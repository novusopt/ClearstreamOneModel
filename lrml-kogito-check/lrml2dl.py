"""LegalRuleML (compact serialisation) -> first-order defeasible theory, for a deliberately small subset.

Supported: Constitutive/Prescriptive/Factual/Override statements; ruleml:Rule with if/then; Atom/Rel/Var/Ind;
And; Neg; Obligation, Prohibition, Permission; SuborderList of obligations/prohibitions; hasStrength.
Everything else raises Unsupported - the compiler fails closed instead of guessing a meaning.

Deontic mapping (a design decision of THIS prototype, not something LegalRuleML prescribes):
  Obligation(a)   -> literal  +O_a          Obligation(not a) / Prohibition(a) -> literal -O_a
  Permission(a)   -> literal  +P_a ;  Permission(not a) -> literal +PN_a  (two predicates: "may do" and
                     "may refrain" do not contradict each other, so they must not be complements).
                     Because a permission is a derogation from the opposite duty, each permission rule also
                     gets a defeater copy whose head is the complement of that duty (it blocks the duty without
                     concluding the opposite duty); symmetrically every duty rule gets a defeater copy that
                     blocks the opposite permission.
  SuborderList [D1, D2, ..] -> rule i has the extra premises "D_k holds and is violated" for all k < i.
"""
from __future__ import annotations
import xml.etree.ElementTree as ET
from dlcore import STRICT, DEFEASIBLE, DEFEATER
from folog import Atom, FRule, FTheory, pred_levels

L = "{http://docs.oasis-open.org/legalruleml/ns/v1.0/}"
R = "{http://ruleml.org/spec}"
OPP = {"+": "-", "-": "+"}


class Unsupported(Exception):
    pass


def _tag(e):
    return e.tag.replace(L, "lrml:").replace(R, "ruleml:")


def _atom(e, sign="+") -> Atom:
    if e.tag == R + "Neg":
        (c,) = list(e)
        return _atom(c, OPP[sign])
    if e.tag != R + "Atom":
        raise Unsupported(f"{_tag(e)} where an atom was expected")
    rel = e.find(R + "Rel")
    name = (rel.get("iri") or rel.text or "").strip().lstrip(":#")
    args = []
    for c in e:
        if c.tag == R + "Rel":
            continue
        if c.tag == R + "Var":
            v = c.text.strip()
            args.append(v[0].upper() + v[1:])
        elif c.tag == R + "Ind":
            v = (c.text or c.get("iri") or "").strip().lstrip(":#")
            args.append(v[0].lower() + v[1:])
        else:
            raise Unsupported(f"{_tag(c)} as an argument (only Var and Ind are supported)")
    if not 1 <= len(args) <= 2:
        raise Unsupported(f"atom {name} has arity {len(args)}; this prototype handles arity 1 and 2")
    return Atom(sign, name, tuple(args))


def _modal(e) -> tuple[str, Atom]:
    """-> ('O'|'P'|'', atom)"""
    if e.tag == L + "Obligation":
        (c,) = list(e); a = _atom(c); return "O", Atom(a.sign, "O_" + a.pred, a.args)
    if e.tag == L + "Prohibition":
        (c,) = list(e); a = _atom(c); return "O", Atom(OPP[a.sign], "O_" + a.pred, a.args)
    if e.tag == L + "Permission":
        (c,) = list(e); a = _atom(c); return "P", Atom("+", ("P_" if a.sign == "+" else "PN_") + a.pred, a.args)
    if e.tag in (R + "Atom", R + "Neg"):
        return "", _atom(e)
    raise Unsupported(_tag(e))


def _body(e) -> list[Atom]:
    if e.tag == R + "And":
        return [a for c in e for a in _body(c)]
    return [_modal(e)[1]]


def _strength(rule) -> str:
    hs = rule.find(L + "hasStrength")
    name = None
    if hs is not None and len(hs):
        name = hs[0].tag.replace(L, "")
    elif rule.get("strength"):
        name = rule.get("strength")
    if name is None:
        raise Unsupported("rule without an explicit strength: LegalRuleML defines no default, so none is assumed")
    try:
        return {"StrictStrength": STRICT, "DefeasibleStrength": DEFEASIBLE, "defeasible": DEFEASIBLE,
                "Defeater": DEFEATER, "defeater": DEFEATER}[name]
    except KeyError:
        raise Unsupported(f"strength {name}")


def compile_lrml(xml_text: str, consts_extra=()) -> tuple[FTheory, dict[str, list[str]]]:
    root = ET.fromstring(xml_text)
    rules: list[FRule] = []
    facts: list[Atom] = []
    by_stmt: dict[str, list[str]] = {}
    overrides: list[tuple[str, str]] = []
    modal_of: dict[str, str] = {}
    for st in root.iter(L + "Statements"):
        for s in st:
            key = s.get("key")
            if s.tag == L + "FactualStatement":
                for a in s.iter(R + "Atom"):
                    at = _atom(a)
                    if at.vars():
                        raise Unsupported("fact with variables")
                    facts.append(at)
            elif s.tag in (L + "OverrideStatement", L + "hasQualification"):
                for o in s.iter(L + "Override"):
                    overrides.append((o.get("over").lstrip("#"), o.get("under").lstrip("#")))
            elif s.tag in (L + "ConstitutiveStatement", L + "PrescriptiveStatement"):
                rule = s.find(R + "Rule")
                kind = _strength(rule)
                if_, then = rule.find(R + "if"), rule.find(R + "then")
                if then is None:
                    raise Unsupported(f"statement {key}: rule without ruleml:then")
                body = _body(if_[0]) if if_ is not None and len(if_) else []
                (h,) = list(then)
                chain = list(h) if h.tag == L + "SuborderList" else [h]
                if s.tag == L + "ConstitutiveStatement" and any(c.tag.startswith(L) for c in chain):
                    raise Unsupported(f"statement {key}: deontic conclusion in a constitutive statement")
                extra: list[Atom] = []
                for i, c in enumerate(chain):
                    m, head = _modal(c)
                    label = key if len(chain) == 1 else f"{key}.{i + 1}"
                    full = tuple(body + extra)
                    unsafe = set(head.vars()) - {v for a in full for v in a.vars()}
                    if unsafe:
                        raise Unsupported(f"statement {key}: head variable(s) {sorted(unsafe)} not bound in the body")
                    rules.append(FRule(label, kind, head, full))
                    by_stmt.setdefault(key, []).append(label)
                    modal_of[label] = m
                    if len(chain) > 1:
                        if m != "O":
                            raise Unsupported(f"statement {key}: only obligations/prohibitions may appear in a SuborderList")
                        inner = Atom(OPP[head.sign], head.pred[2:], head.args)  # the violating state of affairs
                        extra += [head, inner]
            else:
                raise Unsupported(_tag(s))
    for e in root.iter():
        if e.tag in (R + "Or", R + "Naf", R + "Expr", R + "Equal", R + "Forall", R + "Exists", L + "Right",
                     L + "Violation", L + "Compliance", L + "Alternatives", L + "TemporalCharacteristics"):
            raise Unsupported(_tag(e))
    sup = {(a, b) for o, u in overrides for a in by_stmt.get(o, []) for b in by_stmt.get(u, [])}
    missing = [k for o, u in overrides for k in (o, u) if k not in by_stmt]
    if missing:
        raise Unsupported(f"Override refers to unknown statement(s) {missing}")
    # permission <-> opposite duty: defeater copies carrying the same priorities
    copies: list[FRule] = []
    for r in list(rules):
        if modal_of[r.label] == "P":
            # P a blocks O(not a): defeater for +O_a.  P(not a) blocks O a: defeater for -O_a.
            inner = r.head.pred.split("_", 1)[1]
            c = FRule(r.label + "~O", DEFEATER, Atom("+" if r.head.pred.startswith("P_") else "-", "O_" + inner, r.head.args), r.body)
        elif modal_of[r.label] == "O":
            # O a blocks P(not a): defeater for -PN_a.  O(not a) blocks P a: defeater for -P_a.
            inner = r.head.pred[2:]
            c = FRule(r.label + "~P", DEFEATER, Atom("-", ("PN_" if r.head.sign == "+" else "P_") + inner, r.head.args), r.body)
        else:
            continue
        copies.append(c)
        sup |= {(c.label, lo) for hi, lo in sup if hi == r.label} | {(hi, c.label) for hi, lo in sup if lo == r.label}
    rules += copies
    arity: dict[str, int] = {}
    consts = set(consts_extra)
    for a in [x for r in rules for x in (r.head, *r.body)] + facts:
        if arity.setdefault(a.pred, len(a.args)) != len(a.args):
            raise Unsupported(f"predicate {a.pred} used with different arities")
        consts.update(x for x in a.args if not x[0].isupper())
    ft = FTheory(sorted(consts), arity, facts, rules, sup, "")
    if pred_levels(ft) is None:
        raise Unsupported("recursive predicates: the stratified scheme cannot order them")
    return ft, by_stmt

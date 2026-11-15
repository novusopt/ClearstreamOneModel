"""First-order (function-free, safe) defeasible rules: grounding for the reference, lifted DRL for Drools."""
from __future__ import annotations
import itertools, json, random
from dataclasses import dataclass
from dlcore import Rule, Theory, STRICT, DEFEASIBLE, DEFEATER

HEADER = "package dl.gen;\nimport dl.model.*;\n\n"


@dataclass(frozen=True)
class Atom:
    sign: str  # "+" | "-"
    pred: str
    args: tuple[str, ...]  # variables start with an upper-case letter

    def vars(self):
        return [a for a in self.args if a[0].isupper()]


@dataclass(frozen=True)
class FRule:
    label: str
    kind: str
    head: Atom
    body: tuple[Atom, ...]


@dataclass
class FTheory:
    consts: list[str]
    arity: dict[str, int]
    facts: list[Atom]  # ground
    rules: list[FRule]
    sup: set[tuple[str, str]]
    name: str = ""


def lit(sign: str, pred: str, args) -> str:
    return ("-" if sign == "-" else "") + pred + "(" + ",".join(args) + ")"


def ground(ft: FTheory) -> Theory:
    rules: list[Rule] = []
    inst: dict[str, list[str]] = {}
    for r in ft.rules:
        vs = sorted({v for a in (r.head, *r.body) for v in a.vars()})
        for combo in itertools.product(ft.consts, repeat=len(vs)):
            sub = dict(zip(vs, combo))
            g = lambda a: lit(a.sign, a.pred, [sub.get(x, x) for x in a.args])
            label = r.label + "#" + ".".join(combo)
            rules.append(Rule(label, r.kind, g(r.head), tuple(g(b) for b in r.body)))
            inst.setdefault(r.label, []).append(label)
    sup = {(a, b) for hi, lo in ft.sup for a in inst.get(hi, []) for b in inst.get(lo, [])}
    facts = frozenset(lit(a.sign, a.pred, a.args) for a in ft.facts)
    # make every ground literal known so that expected sets are over the full Herbrand base
    return Theory(facts, rules, frozenset(sup), None, ft.name)


def _q(s):
    return json.dumps(s, ensure_ascii=False)


def _pattern(cls: str, a: Atom, bound: set[str], extra: str = "") -> str:
    cons = [f"sign == {_q(a.sign)}", f"pred == {_q(a.pred)}"]
    args = list(a.args) + ["_"] * (2 - len(a.args))
    for i, x in enumerate(args):
        fld = f"a{i + 1}"
        if x[0].isupper():
            if x in bound:
                cons.append(f"{fld} == ${x}")
            else:
                cons.append(f"${x} : {fld}"); bound.add(x)
        else:
            cons.append(f"{fld} == {_q(x)}")
    return f"{cls}({', '.join(cons)}{extra})"


def _args(a: Atom) -> str:
    args = list(a.args) + ["_"] * (2 - len(a.args))
    return ", ".join(("$" + x) if x[0].isupper() else _q(x) for x in args)


def _rule(name, pats, action, sal=None):
    s = "" if sal is None else f"salience {sal}\n"
    return f"rule {_q(name)}\n{s}when\n" + "".join(f"    {p}\n" for p in pats) + f"then\n    {action}\nend\n\n"


OPP = {"+": "-", "-": "+"}


def pred_levels(ft: FTheory) -> dict[str, int] | None:
    """Longest-path level per predicate; None if predicates are recursive."""
    deps: dict[str, set[str]] = {p: set() for p in ft.arity}
    for r in ft.rules:
        deps[r.head.pred].update(b.pred for b in r.body)
    lvl: dict[str, int] = {}
    state: dict[str, int] = {}

    def visit(p):
        if state.get(p) == 1:
            raise RecursionError
        if p in lvl:
            return lvl[p]
        state[p] = 1
        v = 1 + max((visit(d) for d in deps[p]), default=-1)
        state[p] = 2; lvl[p] = v
        return v

    try:
        for p in deps:
            visit(p)
    except RecursionError:
        return None
    return lvl


def encode_lifted(ft: FTheory, style: str) -> str:
    """style: 'meta'  - generic meta-rules shared by all predicates, truth maintenance does the ordering
              'pred'  - supported/attacked/defeasible rules specialised per predicate, no salience
              'strat' - like 'pred' plus one salience band per predicate level (no retraction ever needed)"""
    lv = pred_levels(ft) if style in ("strat", "antistrat") else None
    if style in ("strat", "antistrat") and lv is None:
        raise ValueError("recursive predicates: cannot stratify by predicate")
    top = (max(lv.values(), default=0) + 1) if lv else 0
    band = (lambda l, k: (top - l) * 10 + k) if lv else (lambda l, k: None)
    hi = (top + 2) * 10 if lv else None
    if style == "antistrat":  # worst firing order: everything concluded early must be retracted again
        band = lambda l, k: -(top - l) * 10 - 10 + k
        hi = -(top + 3) * 10
    out = [HEADER]
    F = "$s : sign, $p : pred, $a : a1, $b : a2"
    out.append(_rule("fact", [f"FFact({F})"], "insertLogical(new FStrict($s, $p, $a, $b));", hi and hi + 2))
    out.append(_rule("strict-to-def", [f"FStrict({F})"], "insertLogical(new FDef($s, $p, $a, $b));", hi and hi + 1))
    rules = {r.label: r for r in ft.rules}
    for r in ft.rules:
        if r.kind == STRICT:
            b: set[str] = set()
            out.append(_rule(f"S:{r.label}", [_pattern("FStrict", x, b) for x in r.body],
                             f"insertLogical(new FStrict({_q(r.head.sign)}, {_q(r.head.pred)}, {_args(r.head)}));", hi and hi + 2))
        b = set()
        rl = 1 + max((lv[x.pred] for x in r.body), default=-1) if lv else 0
        out.append(_rule(f"A:{r.label}", [_pattern("FDef", x, b) for x in r.body],
                         f"insertLogical(new FApp({_q(r.label)}, {_q(r.kind)}, {_q(r.head.sign)}, {_q(r.head.pred)}, {_args(r.head)}));",
                         band(rl, 4)))
    for a, c in sorted(ft.sup):
        if a not in rules or c not in rules:
            continue
        t, s = rules[a], rules[c]
        if t.kind == DEFEATER or t.head.pred != s.head.pred or t.head.sign == s.head.sign:
            continue
        # Beaten(s, q): q is the head instance of the applicable superior rule t
        out.append(_rule(f"B:{t.label}>{s.label}", [f"FApp(rule == {_q(t.label)}, {F})"],
                         f"insertLogical(new FBeaten({_q(s.label)}, $s, $p, $a, $b));",
                         band(lv[t.head.pred], 3) if lv else None))
    if style == "meta":
        out.append(_rule("supported", [f'FApp(kind != "x", {F})'], "insertLogical(new FSupported($s, $p, $a, $b));"))
        for sg in "+-":
            out.append(_rule(f"attacked{sg}", [f"FApp($r : rule, sign == {_q(OPP[sg])}, $p : pred, $a : a1, $b : a2)",
                                               f"not FBeaten(rule == $r, sign == {_q(sg)}, pred == $p, a1 == $a, a2 == $b)"],
                             f"insertLogical(new FAttacked({_q(sg)}, $p, $a, $b));"))
            out.append(_rule(f"defeasible{sg}", [f"FSupported(sign == {_q(sg)}, $p : pred, $a : a1, $b : a2)",
                                                 f"not FStrict(sign == {_q(OPP[sg])}, pred == $p, a1 == $a, a2 == $b)",
                                                 f"not FAttacked(sign == {_q(sg)}, pred == $p, a1 == $a, a2 == $b)"],
                             f"insertLogical(new FDef({_q(sg)}, $p, $a, $b));"))
        return "".join(out)
    for p in sorted(ft.arity):
        L = lv[p] if lv else 0
        P = f"pred == {_q(p)}, $a : a1, $b : a2"
        for sg in "+-":
            out.append(_rule(f"U:{p}{sg}", [f'FApp(kind != "x", sign == {_q(sg)}, {P})'],
                             f"insertLogical(new FSupported({_q(sg)}, {_q(p)}, $a, $b));", band(L, 3)))
            out.append(_rule(f"T:{p}{sg}", [f"FApp($r : rule, sign == {_q(OPP[sg])}, {P})",
                                            f"not FBeaten(rule == $r, sign == {_q(sg)}, pred == {_q(p)}, a1 == $a, a2 == $b)"],
                             f"insertLogical(new FAttacked({_q(sg)}, {_q(p)}, $a, $b));", band(L, 2)))
            out.append(_rule(f"D:{p}{sg}", [f"FSupported(sign == {_q(sg)}, {P})",
                                            f"not FStrict(sign == {_q(OPP[sg])}, pred == {_q(p)}, a1 == $a, a2 == $b)",
                                            f"not FAttacked(sign == {_q(sg)}, pred == {_q(p)}, a1 == $a, a2 == $b)"],
                             f"insertLogical(new FDef({_q(sg)}, {_q(p)}, $a, $b));", band(L, 1)))
    return "".join(out)


def fact_op(a: Atom, op="+"):
    args = list(a.args) + ["_"] * (2 - len(a.args))
    return [op, "FFact", a.sign, a.pred, *args]


def parse_out(items) -> frozenset[str]:
    res = set()
    for it in items:
        sign, pred, a1, a2 = it.split(",")
        res.add(lit(sign, pred, [a1] if a2 == "_" else [a1, a2]))
    return frozenset(res)


def random_ftheory(rng: random.Random, n_pred=5, n_const=3, n_rules=8, recursive=False, name="") -> FTheory:
    consts = [f"c{i}" for i in range(n_const)]
    preds = [f"p{i}" for i in range(n_pred)]
    arity = {p: rng.choice((1, 1, 2)) for p in preds}
    facts = []
    for p in preds:
        for combo in itertools.product(consts, repeat=arity[p]):
            if rng.random() < 0.3:
                facts.append(Atom(rng.choice("++-"), p, combo))
    rules: list[FRule] = []
    VARS = ["X", "Y", "Z"]
    for i in range(n_rules):
        hi = rng.randrange(n_pred)
        pool = preds if recursive else preds[:hi]
        nb = rng.randint(0, min(3, len(pool))) if pool else 0
        body = []
        for _ in range(nb):
            p = rng.choice(pool)
            args = tuple(rng.choice(VARS) if rng.random() < 0.8 else rng.choice(consts) for _ in range(arity[p]))
            body.append(Atom(rng.choice("++-"), p, args))
        bvars = sorted({v for a in body for v in a.vars()})
        hargs = tuple((rng.choice(bvars) if bvars and rng.random() < 0.8 else rng.choice(consts)) for _ in range(arity[preds[hi]]))
        kind = rng.choices((STRICT, DEFEASIBLE, DEFEATER), weights=(0.2, 0.6, 0.2))[0]
        rules.append(FRule(f"r{i}", kind, Atom(rng.choice("+-"), preds[hi], hargs), tuple(body)))
    sup = set()
    for i, r in enumerate(rules):
        for s in rules[i + 1:]:
            if r.head.pred == s.head.pred and r.head.sign != s.head.sign and rng.random() < 0.5:
                sup.add((r.label, s.label) if rng.random() < 0.5 else (s.label, r.label))
    return FTheory(consts, arity, facts, rules, sup, name)

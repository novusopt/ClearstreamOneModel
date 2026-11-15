"""Compilation schemes for dlcore theories.

encode_asp(th)          -> clingo program (scheme: strict layer + applicable /
                           supported / beaten / attacked), `variant="naive"`
                           gives the known-wrong simple scheme.
encode_drl_ground(th)   -> DRL, every rule specialised to the theory
                           (what a LegalRuleML->DRL compiler would emit).
encode_drl_generic(th)  -> DRL with per-rule "applicable"/strict rules and
                           fixed meta-rules; superiority/conflict are facts.
INTERP_DRL              -> one fixed DRL; the whole theory is data.

All DRL variants derive everything with insertLogical and use `not` for
negation. Input facts are a separate type (Fact) so that stated and logical
insertions of the same object never mix.
"""
from __future__ import annotations

import json

import clingo

from dlcore import DEFEATER, STRICT, Theory

HEADER = "package dl.gen;\nimport dl.model.*;\n\n"

# Mutations used to measure whether the test-suite can see a wrong compiler.
MUTATIONS = (
    "defeater_ignored",        # defeaters do not attack
    "no_strict_block",         # drop "no conflicting literal is strictly provable"
    "defeater_can_beat",       # defeaters may win the superiority fight
    "beat_without_applicable",  # superior rule beats even if it is not applicable
    "no_team_defeat",          # attacker must be beaten by every... (single-rule defeat)
    "strict_not_defeasible",   # strict rules do not support defeasible conclusions
    "no_superiority",          # superiority relation ignored
    "strict_from_defeasible",  # strict rules fire on defeasible premises
    "attack_needs_no_app",     # a rule attacks even when not applicable
)


def _q(s: str) -> str:
    # DRL string literal. Non-ASCII is written raw: the classic (MVEL) constraint parser of Drools 10.2.0
    # rejects \uXXXX escapes ("illegal unicode escape sequence").
    return json.dumps(s, ensure_ascii=False)


# ----------------------------------------------------------------------------
# ASP
# ----------------------------------------------------------------------------
def _a(lit: str) -> str:
    return ("n_" + lit[1:]) if lit.startswith("-") else ("p_" + lit)


def encode_asp(th: Theory, variant: str = "full") -> str:
    out: list[str] = []
    for f in sorted(th.facts):
        out.append(f"s({_a(f)}).")
    out.append("d(Q) :- s(Q).")
    rules = {r.label: r for r in th.rules}
    for r in th.rules:
        if r.kind == STRICT:
            body = ", ".join(f"s({_a(b)})" for b in r.body)
            out.append(f"s({_a(r.head)})" + (f" :- {body}." if body else "."))
        body = ", ".join(f"d({_a(b)})" for b in r.body)
        out.append(f"app({r.label})" + (f" :- {body}." if body else "."))
    if variant == "naive":
        # conclusion of any applicable non-defeater rule that is not overridden
        # by an applicable superior conflicting rule
        for hi, lo in sorted(th.sup):
            if hi in rules and lo in rules and rules[lo].head in th.C(rules[hi].head):
                out.append(f"over({lo}) :- app({hi}).")
        for r in th.rules:
            if r.kind != DEFEATER:
                out.append(f"d({_a(r.head)}) :- app({r.label}), not over({r.label}).")
        return "\n".join(out) + "\n#show s/1.\n#show d/1.\n"
    for r in th.rules:
        if r.kind != DEFEATER:
            out.append(f"sup({_a(r.head)}) :- app({r.label}).")
    for hi, lo in sorted(th.sup):
        if hi not in rules or lo not in rules:
            continue
        t, s = rules[hi], rules[lo]
        if t.kind != DEFEATER and s.head in th.C(t.head):
            out.append(f"beaten({s.label},{_a(t.head)}) :- app({t.label}).")
    for q in th.literals():
        cq = sorted(th.C(q))
        for c in cq:
            for s in th.rules:
                if s.head == c:
                    out.append(f"att({_a(q)}) :- app({s.label}), not beaten({s.label},{_a(q)}).")
        nots = "".join(f", not s({_a(c)})" for c in cq)
        out.append(f"d({_a(q)}) :- sup({_a(q)}){nots}, not att({_a(q)}).")
    return "\n".join(out) + "\n#show s/1.\n#show d/1.\n"


def _un(a: str) -> str:
    return ("-" + a[2:]) if a.startswith("n_") else a[2:]


def solve_asp(program: str) -> dict[str, frozenset[str]]:
    ctl = clingo.Control(["0", "--warn=none"])
    ctl.add("base", [], program)
    ctl.ground([("base", [])])
    models: list[tuple[frozenset[str], frozenset[str]]] = []

    def on_model(m: clingo.Model) -> None:
        s = frozenset(_un(str(x.arguments[0])) for x in m.symbols(shown=True) if x.name == "s")
        d = frozenset(_un(str(x.arguments[0])) for x in m.symbols(shown=True) if x.name == "d")
        models.append((s, d))

    ctl.solve(on_model=on_model)
    if len(models) != 1:
        raise RuntimeError(f"expected exactly one stable model, got {len(models)}")
    return {"+D": models[0][0], "+d": models[0][1]}


# ----------------------------------------------------------------------------
# DRL: ground (fully specialised) scheme
# ----------------------------------------------------------------------------
def _when(patterns: list[str]) -> str:
    return "".join(f"    {p}\n" for p in patterns)


def _rule(name: str, patterns: list[str], action: str, salience: int | None = None) -> str:
    sal = "" if salience is None else f"salience {salience}\n"
    return f"rule {_q(name)}\n{sal}when\n{_when(patterns)}then\n    {action}\nend\n\n"


def levels(th: Theory) -> dict[str, int]:
    """Longest-path depth of every literal in the dependency graph (acyclic theories only)."""
    from dlcore import dependency_edges, find_cycle
    if find_cycle(th) is not None:
        raise ValueError("stratification needs an acyclic theory")
    edges = dependency_edges(th)
    lvl: dict[str, int] = {}
    order: list[str] = []
    seen: set[str] = set()
    for root in edges:  # iterative post-order
        if root in seen:
            continue
        stack = [(root, iter(sorted(edges[root])))]
        seen.add(root)
        while stack:
            node, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                order.append(node); stack.pop()
            elif nxt not in seen:
                seen.add(nxt); stack.append((nxt, iter(sorted(edges[nxt]))))
    for q in order:
        lvl[q] = 1 + max((lvl[b] for b in edges[q]), default=-1)
    return lvl


def encode_drl_strat(th: Theory, invert: bool = False) -> str:
    """Ground scheme with one salience band per dependency level, so every `not`
    is only evaluated after everything it depends on is final. Conclusions are
    then never retracted: correctness does not depend on truth-maintenance
    cascades. Valid for one-shot evaluation of acyclic theories only."""
    lvl = levels(th)
    top = max(lvl.values(), default=0) + 1
    band = lambda l: (top - l) * 10
    hi = (top + 2) * 10
    if invert:
        # stress variant: the worst possible firing order. Conclusions are drawn
        # before their attackers are known and must all be retracted again by
        # truth maintenance.
        band = lambda l: -(top - l) * 10 - 10
        hi = -(top + 3) * 10
    out = [HEADER]
    out.append(_rule("fact", ["Fact($l : lit)"], "insertLogical(new Strict($l));", hi + 2))
    out.append(_rule("strict-to-def", ["Strict($l : lit)"], "insertLogical(new Def($l));", hi + 1))
    rules = {r.label: r for r in th.rules}
    for r in th.rules:
        if r.kind == STRICT:
            out.append(_rule(f"S:{r.label}", [f"Strict(lit == {_q(b)})" for b in r.body],
                             f"insertLogical(new Strict({_q(r.head)}));", hi + 2))
        rl = 1 + max((lvl[b] for b in r.body), default=-1)
        out.append(_rule(f"A:{r.label}", [f"Def(lit == {_q(b)})" for b in r.body],
                         f"insertLogical(new App({_q(r.label)}, {_q(r.head)}, {_q(r.kind)}));", band(rl) + 4))
        if r.kind != DEFEATER:
            out.append(_rule(f"U:{r.label}", [f"App(rule == {_q(r.label)})"],
                             f"insertLogical(new Supported({_q(r.head)}));", band(lvl[r.head]) + 3))
    for a, b in sorted(th.sup):
        if a not in rules or b not in rules:
            continue
        t, s = rules[a], rules[b]
        if t.kind != DEFEATER and s.head in th.C(t.head):
            out.append(_rule(f"B:{t.label}>{s.label}", [f"App(rule == {_q(t.label)})"],
                             f"insertLogical(new Beaten({_q(s.label)}, {_q(t.head)}));", band(lvl[t.head]) + 3))
    for q in th.literals():
        cq = sorted(th.C(q))
        for c in cq:
            for s in th.rules:
                if s.head == c:
                    out.append(_rule(f"T:{s.label}@{q}", [f"App(rule == {_q(s.label)})",
                                                          f"not Beaten(rule == {_q(s.label)}, lit == {_q(q)})"],
                                     f"insertLogical(new Attacked({_q(q)}));", band(lvl[q]) + 2))
        pats = [f"Supported(lit == {_q(q)})"] + [f"not Strict(lit == {_q(c)})" for c in cq] + [f"not Attacked(lit == {_q(q)})"]
        out.append(_rule(f"D:{q}", pats, f"insertLogical(new Def({_q(q)}));", band(lvl[q]) + 1))
    return "".join(out)


def encode_drl_ground(th: Theory, mutation: str | None = None, naive: bool = False) -> str:
    assert mutation is None or mutation in MUTATIONS
    out = [HEADER]
    out.append(_rule("fact", ["Fact($l : lit)"], "insertLogical(new Strict($l));"))
    out.append(_rule("strict-to-def", ["Strict($l : lit)"], "insertLogical(new Def($l));"))
    rules = {r.label: r for r in th.rules}
    for r in th.rules:
        if r.kind == STRICT:
            src = "Def" if mutation == "strict_from_defeasible" else "Strict"
            out.append(_rule(f"S:{r.label}", [f"{src}(lit == {_q(b)})" for b in r.body],
                             f"insertLogical(new Strict({_q(r.head)}));"))
        out.append(_rule(f"A:{r.label}", [f"Def(lit == {_q(b)})" for b in r.body],
                         f"insertLogical(new App({_q(r.label)}, {_q(r.head)}, {_q(r.kind)}));"))
    if naive:
        for hi, lo in sorted(th.sup):
            if hi in rules and lo in rules and rules[lo].head in th.C(rules[hi].head):
                out.append(_rule(f"O:{hi}>{lo}", [f"App(rule == {_q(hi)})"],
                                 f"insertLogical(new Beaten({_q(lo)}, {_q(rules[lo].head)}));"))
        for r in th.rules:
            if r.kind != DEFEATER:
                out.append(_rule(f"D:{r.label}", [f"App(rule == {_q(r.label)})", f"not Beaten(rule == {_q(r.label)})"],
                                 f"insertLogical(new Def({_q(r.head)}));"))
        return "".join(out)
    for r in th.rules:
        if r.kind == DEFEATER:
            continue
        if r.kind == STRICT and mutation == "strict_not_defeasible":
            continue
        out.append(_rule(f"U:{r.label}", [f"App(rule == {_q(r.label)})"],
                         f"insertLogical(new Supported({_q(r.head)}));"))
    if mutation != "no_superiority":
        for hi, lo in sorted(th.sup):
            if hi not in rules or lo not in rules:
                continue
            t, s = rules[hi], rules[lo]
            if s.head not in th.C(t.head):
                continue
            if t.kind == DEFEATER and mutation != "defeater_can_beat":
                continue
            pats = [] if mutation == "beat_without_applicable" else [f"App(rule == {_q(t.label)})"]
            out.append(_rule(f"B:{t.label}>{s.label}", pats,
                             f"insertLogical(new Beaten({_q(s.label)}, {_q(t.head)}));"))
    for q in th.literals():
        cq = sorted(th.C(q))
        team = [t for t in th.rules if t.head == q and t.kind != DEFEATER]
        for c in cq:
            for s in th.rules:
                if s.head != c:
                    continue
                if s.kind == DEFEATER and mutation == "defeater_ignored":
                    continue
                pats = [] if mutation == "attack_needs_no_app" else [f"App(rule == {_q(s.label)})"]
                if mutation == "no_team_defeat":
                    # wrong on purpose: s counts as answered only if EVERY applicable
                    # supporting rule beats it, i.e. it attacks as soon as one
                    # applicable team member is not superior to it
                    weak = [t for t in team if (t.label, s.label) not in th.sup]
                    for t in weak:
                        out.append(_rule(f"T:{s.label}@{q}/{t.label}", pats + [f"App(rule == {_q(t.label)})"],
                                         f"insertLogical(new Attacked({_q(q)}));"))
                    continue
                pats = pats + [f"not Beaten(rule == {_q(s.label)}, lit == {_q(q)})"]
                out.append(_rule(f"T:{s.label}@{q}", pats, f"insertLogical(new Attacked({_q(q)}));"))
        pats = [f"Supported(lit == {_q(q)})"]
        if mutation != "no_strict_block":
            pats += [f"not Strict(lit == {_q(c)})" for c in cq]
        pats.append(f"not Attacked(lit == {_q(q)})")
        out.append(_rule(f"D:{q}", pats, f"insertLogical(new Def({_q(q)}));"))
    return "".join(out)


def facts_ops(th: Theory) -> list[list[str]]:
    return [["+", "Fact", f] for f in sorted(th.facts)]


# ----------------------------------------------------------------------------
# DRL: generic meta-rules + per-rule applicability
# ----------------------------------------------------------------------------
META_RULES = (
    _rule("fact", ["Fact($l : lit)"], "insertLogical(new Strict($l));")
    + _rule("strict-to-def", ["Strict($l : lit)"], "insertLogical(new Def($l));")
    + _rule("supported", ['App($h : head, kind != "x")'], "insertLogical(new Supported($h));")
    + _rule("beaten", ["Sup($t : hi, $s : lo)", 'App(rule == $t, kind != "x", $q : head)'],
            "insertLogical(new Beaten($s, $q));")
    + _rule("attacked", ["Conflict($q : a, $c : b)", "App($s : rule, head == $c)",
                         "not Beaten(rule == $s, lit == $q)"], "insertLogical(new Attacked($q));")
    + _rule("defeasible", ["Supported($q : lit)", "not Attacked(lit == $q)",
                           "not (Conflict(a == $q, $c : b) and Strict(lit == $c))"],
            "insertLogical(new Def($q));")
)


def encode_drl_generic(th: Theory) -> str:
    out = [HEADER, META_RULES]
    for r in th.rules:
        if r.kind == STRICT:
            out.append(_rule(f"S:{r.label}", [f"Strict(lit == {_q(b)})" for b in r.body],
                             f"insertLogical(new Strict({_q(r.head)}));"))
        out.append(_rule(f"A:{r.label}", [f"Def(lit == {_q(b)})" for b in r.body],
                         f"insertLogical(new App({_q(r.label)}, {_q(r.head)}, {_q(r.kind)}));"))
    return "".join(out)


def structure_ops(th: Theory) -> list[list[str]]:
    ops = [["+", "Sup", hi, lo] for hi, lo in sorted(th.sup)]
    for q in th.literals():
        for c in sorted(th.C(q)):
            ops.append(["+", "Conflict", q, c])
    return ops


# ----------------------------------------------------------------------------
# DRL: interpreter (rules are data, the DRL never changes)
# ----------------------------------------------------------------------------
INTERP_DRL = (
    HEADER + META_RULES
    + _rule("strict-rule", ['RuleDef($r : label, kind == "s", $h : head)',
                            "forall(Body(rule == $r, $l : lit) Strict(lit == $l))"],
            "insertLogical(new Strict($h));")
    + _rule("applicable", ["RuleDef($r : label, $k : kind, $h : head)",
                           "forall(Body(rule == $r, $l : lit) Def(lit == $l))"],
            "insertLogical(new App($r, $h, $k));")
)


def interp_ops(th: Theory) -> list[list[str]]:
    ops = structure_ops(th)
    for r in th.rules:
        ops.append(["+", "RuleDef", r.label, r.kind, r.head])
        for b in sorted(set(r.body)):
            ops.append(["+", "Body", r.label, b])
    return ops

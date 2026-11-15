"""Propositional defeasible logic DL(d||): ambiguity blocking, team defeat.

Proof conditions follow Antoniou, Billington, Governatori, Maher,
"Representation results for defeasible logic", ACM TOCL 2(2), 2001,
generalised from "complementary literal" to an arbitrary conflict relation
C(q) (needed for deontic conflicts such as O(p) vs P(-p)). With the default
C(q) = {~q} this is exactly the ABGM logic.

Two independently written evaluators live here:
  ref_fixpoint  - bottom-up least fixpoint over the four tagged sets
                  (+D, -D, +d, -d). Works on cyclic theories as well.
  ref_recursive - top-down memoised evaluation, acyclic theories only,
                  using "not provable" for the negative tags.
They share the author's reading of the published conditions; they do not
share code.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
import random

STRICT, DEFEASIBLE, DEFEATER = "s", "d", "x"


def neg(lit: str) -> str:
    return lit[1:] if lit.startswith("-") else "-" + lit


@dataclass(frozen=True)
class Rule:
    label: str
    kind: str  # STRICT | DEFEASIBLE | DEFEATER
    head: str
    body: tuple[str, ...] = ()


@dataclass
class Theory:
    facts: frozenset[str]
    rules: list[Rule]
    sup: frozenset[tuple[str, str]]  # (stronger, weaker) rule labels
    # explicit conflict relation; None means C(q) = {~q}
    conflict: dict[str, frozenset[str]] | None = None
    name: str = ""
    _lits: tuple[str, ...] | None = field(default=None, repr=False, compare=False)

    def C(self, q: str) -> frozenset[str]:
        if self.conflict is None:
            return frozenset((neg(q),))
        return self.conflict.get(q, frozenset())

    def literals(self) -> tuple[str, ...]:
        if self._lits is None:
            s: set[str] = set(self.facts)
            for r in self.rules:
                s.add(r.head)
                s.update(r.body)
            if self.conflict is None:
                s |= {neg(x) for x in s}
            else:
                for k, v in self.conflict.items():
                    s.add(k)
                    s |= v
            self._lits = tuple(sorted(s))
        return self._lits

    def to_json(self) -> dict:
        return {
            "name": self.name,
            "facts": sorted(self.facts),
            "rules": [[r.label, r.kind, r.head, list(r.body)] for r in self.rules],
            "sup": sorted(list(x) for x in self.sup),
            "conflict": None if self.conflict is None else {k: sorted(v) for k, v in sorted(self.conflict.items())},
        }

    @staticmethod
    def from_json(d: dict) -> "Theory":
        return Theory(
            facts=frozenset(d["facts"]),
            rules=[Rule(l, k, h, tuple(b)) for l, k, h, b in d["rules"]],
            sup=frozenset(tuple(x) for x in d["sup"]),
            conflict=None if d.get("conflict") is None else {k: frozenset(v) for k, v in d["conflict"].items()},
            name=d.get("name", ""),
        )


# ----------------------------------------------------------------------------
# Reference 1: bottom-up fixpoint of the proof conditions
# ----------------------------------------------------------------------------
def ref_fixpoint(th: Theory) -> dict[str, frozenset[str]]:
    lits = th.literals()
    by_head: dict[str, list[Rule]] = {q: [] for q in lits}
    for r in th.rules:
        by_head[r.head].append(r)
    pD: set[str] = set()
    mD: set[str] = set()
    pd: set[str] = set()
    md: set[str] = set()
    sup = th.sup

    changed = True
    while changed:
        changed = False
        for q in lits:
            Rq = by_head[q]
            Rs = [r for r in Rq if r.kind == STRICT]
            Rsd = [r for r in Rq if r.kind != DEFEATER]
            Cq = th.C(q)
            attackers = [s for c in Cq for s in by_head.get(c, [])]

            if q not in pD:
                if q in th.facts or any(all(a in pD for a in r.body) for r in Rs):
                    pD.add(q); changed = True
            if q not in mD:
                if q not in th.facts and all(any(a in mD for a in r.body) for r in Rs):
                    mD.add(q); changed = True
            if q not in pd:
                ok = q in pD
                if not ok:
                    c1 = any(all(a in pd for a in r.body) for r in Rsd)
                    c2 = all(c in mD for c in Cq)
                    c3 = all(
                        any(a in md for a in s.body)
                        or any(all(a in pd for a in t.body) and (t.label, s.label) in sup for t in Rsd)
                        for s in attackers
                    )
                    ok = c1 and c2 and c3
                if ok:
                    pd.add(q); changed = True
            if q not in md:
                if q in mD:
                    c1 = all(any(a in md for a in r.body) for r in Rsd)
                    c2 = any(c in pD for c in Cq)
                    c3 = any(
                        all(a in pd for a in s.body)
                        and all(any(a in md for a in t.body) or (t.label, s.label) not in sup for t in Rsd)
                        for s in attackers
                    )
                    if c1 or c2 or c3:
                        md.add(q); changed = True
    return {"+D": frozenset(pD), "-D": frozenset(mD), "+d": frozenset(pd), "-d": frozenset(md)}


# ----------------------------------------------------------------------------
# Dependency graph / acyclicity
# ----------------------------------------------------------------------------
def dependency_edges(th: Theory) -> dict[str, set[str]]:
    """q -> b whenever deciding q needs b: b is in the body of a rule for q
    or of a rule for a literal conflicting with q."""
    lits = th.literals()
    by_head: dict[str, list[Rule]] = {q: [] for q in lits}
    for r in th.rules:
        by_head[r.head].append(r)
    edges: dict[str, set[str]] = {q: set() for q in lits}
    for q in lits:
        for h in (q, *th.C(q)):
            for r in by_head.get(h, []):
                edges[q].update(r.body)
    return edges


def find_cycle(th: Theory) -> list[str] | None:
    edges = dependency_edges(th)
    WHITE, GREY, BLACK = 0, 1, 2
    color = {q: WHITE for q in edges}
    for root in edges:
        if color[root] != WHITE:
            continue
        stack = [(root, iter(sorted(edges[root])))]
        path = [root]
        color[root] = GREY
        while stack:
            node, it = stack[-1]
            nxt = next(it, None)
            if nxt is None:
                color[node] = BLACK
                stack.pop(); path.pop()
                continue
            if color[nxt] == GREY:
                return path[path.index(nxt):] + [nxt]
            if color[nxt] == WHITE:
                color[nxt] = GREY
                path.append(nxt)
                stack.append((nxt, iter(sorted(edges[nxt]))))
    return None


def is_acyclic(th: Theory) -> bool:
    return find_cycle(th) is None


# ----------------------------------------------------------------------------
# Reference 2: top-down, acyclic only
# ----------------------------------------------------------------------------
def ref_recursive(th: Theory) -> dict[str, frozenset[str]]:
    if not is_acyclic(th):
        raise ValueError("ref_recursive requires an acyclic theory")
    lits = th.literals()
    by_head: dict[str, list[Rule]] = {q: [] for q in lits}
    for r in th.rules:
        by_head[r.head].append(r)

    @lru_cache(maxsize=None)
    def definite(q: str) -> bool:
        if q in th.facts:
            return True
        for r in by_head.get(q, []):
            if r.kind == STRICT and all(definite(a) for a in r.body):
                return True
        return False

    @lru_cache(maxsize=None)
    def applicable(label_idx: int) -> bool:
        return all(defeasible(a) for a in th.rules[label_idx].body)

    idx = {id(r): i for i, r in enumerate(th.rules)}

    @lru_cache(maxsize=None)
    def defeasible(q: str) -> bool:
        if definite(q):
            return True
        team = [r for r in by_head.get(q, []) if r.kind != DEFEATER and applicable(idx[id(r)])]
        if not team:
            return False
        for c in th.C(q):
            if definite(c):
                return False
        for c in th.C(q):
            for s in by_head.get(c, []):
                if not applicable(idx[id(s)]):
                    continue
                if not any((t.label, s.label) in th.sup for t in team):
                    return False
        return True

    import sys
    old = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old, 20000))
    try:
        pD = frozenset(q for q in lits if definite(q))
        pd = frozenset(q for q in lits if defeasible(q))
    finally:
        sys.setrecursionlimit(old)
    return {"+D": pD, "+d": pd}


# ----------------------------------------------------------------------------
# Random theory generation
# ----------------------------------------------------------------------------
def random_theory(
    rng: random.Random,
    n_atoms: int = 6,
    n_rules: int = 10,
    max_body: int = 3,
    p_fact: float = 0.3,
    p_neg: float = 0.5,
    kinds: tuple[float, float, float] = (0.2, 0.6, 0.2),  # strict, defeasible, defeater
    p_sup: float = 0.5,  # prob. of ordering a conflicting pair of rules
    p_sup_noise: float = 0.05,  # prob. of an (irrelevant) superiority between non-conflicting rules
    p_sup_cycle: float = 0.0,  # prob. of adding the reverse pair as well (malformed >)
    acyclic: bool = True,
    p_dup_rule: float = 0.0,
    p_inconsistent_fact: float = 0.05,
    name: str = "",
) -> Theory:
    atoms = [f"a{i}" for i in range(n_atoms)]
    facts: set[str] = set()
    for a in atoms:
        if rng.random() < p_fact:
            l = a if rng.random() < 0.5 else neg(a)
            facts.add(l)
            if rng.random() < p_inconsistent_fact:
                facts.add(neg(l))
    rules: list[Rule] = []
    for i in range(n_rules):
        hi = rng.randrange(n_atoms)
        head = atoms[hi] if rng.random() >= p_neg else neg(atoms[hi])
        pool = atoms[:hi] if acyclic else atoms
        k = rng.randint(0, min(max_body, len(pool))) if pool else 0
        body = []
        for _ in range(k):
            a = rng.choice(pool)
            body.append(a if rng.random() < 0.5 else neg(a))
        kind = rng.choices((STRICT, DEFEASIBLE, DEFEATER), weights=kinds)[0]
        rules.append(Rule(f"r{i}", kind, head, tuple(body)))
        if rng.random() < p_dup_rule:
            rules.append(Rule(f"r{i}dup", rng.choices((STRICT, DEFEASIBLE, DEFEATER), weights=kinds)[0], head, tuple(body)))
    sup: set[tuple[str, str]] = set()
    for i, r in enumerate(rules):
        for s in rules[i + 1:]:
            conflicting = r.head == neg(s.head)
            p = p_sup if conflicting else p_sup_noise
            if rng.random() < p:
                pair = (r.label, s.label) if rng.random() < 0.5 else (s.label, r.label)
                sup.add(pair)
                if rng.random() < p_sup_cycle:
                    sup.add((pair[1], pair[0]))
    return Theory(frozenset(facts), rules, frozenset(sup), None, name)


def random_conflict_theory(rng: random.Random, n_atoms: int = 6, n_rules: int = 10, name: str = "", **kw) -> Theory:
    """Positive literals only, with a random (possibly asymmetric, possibly
    empty) conflict relation. Exercises the generalised C(q) code paths that a
    deontic layer (O p / O -p / P -p) relies on.

    Atoms are split into consecutive groups of 1-4; conflicts exist only inside
    a group and rule bodies only use atoms of earlier groups, so the theory is
    acyclic by construction."""
    atoms = [f"a{i}" for i in range(n_atoms)]
    groups: list[list[str]] = []
    i = 0
    while i < n_atoms:
        k = rng.randint(1, 4)
        groups.append(atoms[i:i + k])
        i += k
    group_of = {a: gi for gi, g in enumerate(groups) for a in g}
    facts = {a for a in atoms if rng.random() < kw.get("p_fact", 0.25)}
    max_body = kw.get("max_body", 3)
    kinds = kw.get("kinds", (0.2, 0.6, 0.2))
    conflict: dict[str, set[str]] = {a: set() for a in atoms}
    symmetric = kw.get("symmetric", rng.random() < 0.5)
    p_conflict = kw.get("p_conflict", 0.6)
    for g in groups:
        for x, a in enumerate(g):
            for b in g[x + 1:]:
                if rng.random() < p_conflict:
                    if symmetric:
                        conflict[a].add(b); conflict[b].add(a)
                    else:
                        r = rng.random()
                        if r < 0.4:
                            conflict[a].add(b)
                        elif r < 0.8:
                            conflict[b].add(a)
                        else:
                            conflict[a].add(b); conflict[b].add(a)
    rules: list[Rule] = []
    for i in range(n_rules):
        head = rng.choice(atoms)
        pool = [a for a in atoms if group_of[a] < group_of[head]]
        k = rng.randint(0, min(max_body, len(pool))) if pool else 0
        body = tuple(rng.choice(pool) for _ in range(k))
        kind = rng.choices((STRICT, DEFEASIBLE, DEFEATER), weights=kinds)[0]
        rules.append(Rule(f"r{i}", kind, head, body))
    sup: set[tuple[str, str]] = set()
    for i, r in enumerate(rules):
        for s in rules[i + 1:]:
            related = s.head in conflict[r.head] or r.head in conflict[s.head]
            if rng.random() < (kw.get("p_sup", 0.5) if related else 0.05):
                sup.add((r.label, s.label) if rng.random() < 0.5 else (s.label, r.label))
    return Theory(frozenset(facts), rules, frozenset(sup), {k: frozenset(v) for k, v in conflict.items()}, name)

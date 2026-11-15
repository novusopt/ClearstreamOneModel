"""Phase 4b (Python only): is "permission/duty conflict via defeater copies" equivalent to giving the logic the
deontic conflict relation directly?  Reference with explicit conflict sets
    C(O a) = {O -a, P -a}   C(O -a) = {O a, P a}   C(P a) = {O -a}   C(P -a) = {O a}
versus the complement-only logic on the transformed theory (what lrml2dl emits). No strict rules or facts for
deontic literals (the transformation does not cover those)."""
import random, sys
from dlcore import *

N = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
rng = random.Random(909)
diff = 0
for n in range(N):
    na = rng.randint(1, 4); nb = rng.randint(1, 4)
    base = [f"b{i}" for i in range(nb)]
    modal = [m for i in range(na) for m in (f"Oa{i}", f"ONa{i}", f"Pa{i}", f"PNa{i}")]
    conflict = {m: set() for m in modal + base}
    for i in range(na):
        conflict[f"Oa{i}"] = {f"ONa{i}", f"PNa{i}"}; conflict[f"ONa{i}"] = {f"Oa{i}", f"Pa{i}"}
        conflict[f"Pa{i}"] = {f"ONa{i}"}; conflict[f"PNa{i}"] = {f"Oa{i}"}
    facts = frozenset(b for b in base if rng.random() < 0.6)
    rules = []
    for k in range(rng.randint(2, 10)):
        head = rng.choice(modal)
        body = tuple(rng.choice(base) for _ in range(rng.randint(0, 2)))
        rules.append(Rule(f"r{k}", rng.choice([DEFEASIBLE, DEFEASIBLE, DEFEATER]), head, body))
    sup = set()
    for i, r in enumerate(rules):
        for s in rules[i + 1:]:
            if (s.head in conflict[r.head] or r.head in conflict[s.head]) and rng.random() < 0.5:
                sup.add((r.label, s.label) if rng.random() < 0.5 else (s.label, r.label))
    direct = ref_fixpoint(Theory(facts, rules, frozenset(sup), {k: frozenset(v) for k, v in conflict.items()}))
    # transformed: O a -> +O, O -a -> -O (complements); P a -> +P, P -a -> +PN; defeater copies
    def tr(m):
        i = m[-1]
        return {"Oa": f"O{i}", "ONa": f"-O{i}", "Pa": f"P{i}", "PNa": f"PN{i}"}[m[:-1]]
    r2, s2 = [], set(sup)
    for r in rules:
        r2.append(Rule(r.label, r.kind, tr(r.head), r.body))
        i = r.head[-1]; kind = r.head[:-1]
        copy_head = {"Pa": f"O{i}", "PNa": f"-O{i}", "Oa": f"-PN{i}", "ONa": f"-P{i}"}[kind]
        r2.append(Rule(r.label + "~", DEFEATER, copy_head, r.body))
        s2 |= {(r.label + "~", lo) for hi, lo in sup if hi == r.label} | {(hi, r.label + "~") for hi, lo in sup if lo == r.label}
    via = ref_fixpoint(Theory(facts, r2, frozenset(s2), None))
    if {tr(m) for m in modal if m in direct["+d"]} != {tr(m) for m in modal if tr(m) in via["+d"]}:
        diff += 1
        if diff <= 3:
            print("DIFF", [(r.label, r.kind, r.head, r.body) for r in rules], sorted(sup), sorted(facts))
print(f"permission/duty conflicts: direct conflict relation vs defeater-copy transformation, {N} random theories: differences = {diff}")
sys.exit(0 if diff == 0 else 1)

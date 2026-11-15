"""Phase 2a: literature examples in Drools, order independence, structural edge cases."""
import random, sys, json, time
from dlcore import *
from encoders import *
from drools_run import run_cases
from cases import *
from litex import EXAMPLES, T
from sets import SETS, make

mode = sys.argv[1] if len(sys.argv) > 1 else "classic"
bad = 0

def report(title, ths, cases, refs=None):
    global bad
    refs = refs or [ref_fixpoint(t) for t in ths]
    res = run_cases(cases, mode=mode, quiet=True)
    fails = [(c["id"], m) for th, ref, c, r in zip(ths, refs, cases, res) if (m := check(th, ref, r))]
    print(f"{title:62} cases={len(cases):>5} failures={len(fails)}")
    for f in fails[:5]:
        print("     ", f)
    bad += len(fails)
    return res

LV = ("ground", "strat", "generic", "interp")
print(f"== mode={mode}")
# 1. literature examples
ths, cs = [], []
for th, ask, exp_d, exp_D in EXAMPLES:
    for v in LV:
        ths.append(th); cs.append(case(th, v, f"{th.name}/{v}"))
res = report("literature examples x ground, strat, generic, interp", ths, cs)
# and against the hand-derived expectation directly (not via the reference)
n_hand = 0
for i, (th, ask, exp_d, exp_D) in enumerate(EXAMPLES):
    for j, v in enumerate(LV):
        r = res[i * len(LV) + j]
        D = set(r["snaps"][-1]["facts"]["Def"]) if not r["err"] else None
        if D is None or sorted(x for x in ask if x in D) != sorted(exp_d):
            n_hand += 1; print("   HAND-EXPECTATION FAIL", th.name, v)
print(f"{'  same, against hand-derived expectations':62} cases={len(EXAMPLES)*len(LV):>5} failures={n_hand}")
bad += n_hand

# 2. order independence: fact order, rule order, salience -- reported per scheme
rng = random.Random(4242)
base = [make(rng, SETS[k], f"O{i}") for i, k in enumerate(["A small/dense", "B medium", "D malformed >", "E conflict sets"] * 75)]
def order_cases(v, shuffle=False, drl=False, sal=False):
    ths, cs = [], []
    for i, th in enumerate(base):
        for p in range(5):
            ths.append(th)
            cs.append(case(th, v, f"{th.name}/{v}/p{p}", shuffle=(i * 7 + p if shuffle else None),
                           drl_seed=(i * 13 + p if drl else None), salience=sal))
    return ths, cs
print("-- schemes in which no rule can feed itself (candidates for a compiler); failures count")
for v in ("ground", "strat"):
    report(f"order [{v}]: fact insertion order shuffled", *order_cases(v, shuffle=True))
    report(f"order [{v}]: rule order in the DRL file shuffled", *order_cases(v, drl=True))
    report(f"order [{v}]: fact order + rule order shuffled", *order_cases(v, shuffle=True, drl=True))
report("order [ground]: rule order + random salience on every rule", *order_cases("ground", drl=True, sal=True))
report("order [ground]: fact order + rule order + random salience", *order_cases("ground", shuffle=True, drl=True, sal=True))
counted = bad
print("-- schemes with rules shared by all literals (measured, not counted: they hit the engine defect)")
for v in ("generic", "interp"):
    report(f"order [{v}]: fact insertion order shuffled", *order_cases(v, shuffle=True))
report("order [generic]: rule order + random salience", *order_cases("generic", drl=True, sal=True))
shared_fail = bad - counted
bad = counted

# 3. structural edge cases
S, D, X = STRICT, DEFEASIBLE, DEFEATER
weird = ['he said "hi"', "back\\slash", "dollar$sign", "new\nline", "tab\there", "unicode-é-法-✓", "semi;colon", "a b c", "//comment", "end", "rule", "'single'"]
edge = [
    T("empty theory", [], []),
    T("facts only", ["a", "-b"], []),
    T("rules only, nothing fires", [], [("r1", D, "p", ("a",)), ("r2", S, "q", ("p",))]),
    T("empty-body defeasible rule", [], [("r1", D, "p", ())]),
    T("empty-body strict rule", [], [("r1", S, "p", ())]),
    T("empty-body defeater only", [], [("r1", X, "p", ())]),
    T("empty-body conflict", [], [("r1", D, "p", ()), ("r2", D, "-p", ())]),
    T("empty-body conflict with priority", [], [("r1", D, "p", ()), ("r2", D, "-p", ())], [("r1", "r2")]),
    T("two empty-body strict rules, inconsistent", [], [("r1", S, "p", ()), ("r2", S, "-p", ())]),
    T("duplicate body literal", ["a"], [("r1", D, "p", ("a", "a", "a"))]),
    T("contradictory body", ["a", "-a"], [("r1", D, "p", ("a", "-a"))]),
    T("contradictory body, one side missing", ["a"], [("r1", D, "p", ("a", "-a"))]),
    T("identical duplicate rules", ["a"], [("r1", D, "p", ("a",)), ("r2", D, "p", ("a",)), ("r3", D, "-p", ("a",))], [("r1", "r3")]),
    T("identical rules, both must beat? no: one suffices", ["a"], [("r1", D, "p", ("a",)), ("r2", D, "p", ("a",)), ("r3", D, "-p", ("a",))], [("r2", "r3")]),
    T("superiority both ways", ["a"], [("r1", D, "p", ("a",)), ("r2", D, "-p", ("a",))], [("r1", "r2"), ("r2", "r1")]),
    T("superiority over unknown label", ["a"], [("r1", D, "p", ("a",))], [("r1", "ghost"), ("ghost", "r1")]),
    T("superiority between non-conflicting rules", ["a"], [("r1", D, "p", ("a",)), ("r2", D, "q", ("a",))], [("r1", "r2")]),
    T("self superiority", ["a"], [("r1", D, "p", ("a",)), ("r2", D, "-p", ("a",))], [("r1", "r1")]),
    T("strict superior to strict (irrelevant to +D)", ["a"], [("r1", S, "p", ("a",)), ("r2", S, "-p", ("a",))], [("r1", "r2")]),
    T("defeasible superior to strict, strict premise definite", ["a"], [("r1", S, "p", ("a",)), ("r2", D, "-p", ("a",))], [("r2", "r1")]),
    T("defeasible superior to strict, strict premise defeasible", [], [("r0", D, "a", ()), ("r1", S, "p", ("a",)), ("r2", D, "-p", ())], [("r2", "r1")]),
    T("strict chain from fact beats defeasible chain", ["a"], [("r1", S, "b", ("a",)), ("r2", S, "c", ("b",)), ("r3", D, "-c", ("a",)), ("r4", D, "d", ("-c",))], [("r3", "r2")]),
    T("fact and its negation with rules", ["p", "-p"], [("r1", D, "q", ("p",)), ("r2", D, "-q", ("-p",))]),
    T("defeater vs defeater", ["a"], [("r1", X, "p", ("a",)), ("r2", X, "-p", ("a",))]),
    T("defeater with superiority over defeasible", ["a"], [("r1", D, "p", ("a",)), ("r2", X, "-p", ("a",))], [("r2", "r1")]),
    T("label and literal names needing escapes", [weird[0], "-" + weird[1]],
      [(weird[2], D, weird[3], (weird[0],)), (weird[4], D, "-" + weird[3], ("-" + weird[1],)),
       (weird[5], S, weird[6], (weird[0],)), (weird[7], D, weird[8], (weird[6],)),
       (weird[9], D, weird[10], (weird[8],)), (weird[11], X, "-" + weird[10], ())],
      [(weird[2], weird[4])]),
    T("literal named like a negation of a negation", ["--a"], [("r1", D, "p", ("--a",)), ("r2", D, "-p", ("-a",))]),
    T("same head many rules mixed kinds", ["a", "b", "c"],
      [("r1", S, "p", ("a",)), ("r2", D, "p", ("b",)), ("r3", X, "p", ("c",)), ("r4", D, "-p", ("a",)), ("r5", X, "-p", ("b",)), ("r6", S, "-p", ("z",))],
      [("r2", "r4"), ("r3", "r5")]),
]
ths, cs = [], []
for th in edge:
    for v in ("ground", "strat", "interp"):
        ths.append(th); cs.append(case(th, v, f"{th.name}/{v}"))
res = report("structural edge cases x ground, strat, interp", ths, cs)
if "-v" in sys.argv:
    for th, r in zip(ths[::3], res[::3]):
        print("   ", th.name, "->", r["snaps"][-1]["facts"]["Def"] if not r["err"] else r["err"][:100])

print(f"RESULT: {'OK' if bad == 0 else str(bad) + ' FAILURES'} for ground/strat (+ literature and edge cases); shared-rule schemes: {shared_fail} wrong answers")
sys.exit(0 if bad == 0 else 1)

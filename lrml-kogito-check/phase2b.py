"""Phase 2b: can the test see a wrong compiler (mutations)? cyclic rule bases; incremental sessions;
mixing stated and derived facts."""
import random, sys, json, time
from dlcore import *
from encoders import *
from drools_run import run_cases
from cases import *
from litex import T
from sets import SETS, make

mode = next((a for a in sys.argv[1:] if a in ("classic", "exec")), "classic")
parts = [a for a in sys.argv[1:] if a not in ("classic", "exec")] or ["mut", "cyc", "inc", "mix"]
S, D, X = STRICT, DEFEASIBLE, DEFEATER
print(f"== mode={mode}")

def snap_check(th, facts, snap):
    ref = ref_fixpoint(Theory(frozenset(facts), th.rules, th.sup, th.conflict))
    if snap["limit"]:
        return "LIMIT"
    if frozenset(snap["facts"]["Strict"]) != ref["+D"]:
        return "+D differs"
    if frozenset(snap["facts"]["Def"]) != ref["+d"]:
        return "+d differs: " + ",".join(sorted(frozenset(snap["facts"]["Def"]) ^ ref["+d"]))
    return None

# ---------------------------------------------------------------- mutations
if "mut" in parts:
    rng = random.Random(777)
    ths = [make(rng, SETS[k], f"M{i}") for i, k in enumerate(["A small/dense", "B medium", "D malformed >"] * 200)]
    refs = [ref_fixpoint(t) for t in ths]
    print(f"\n-- sensitivity: deliberately wrong compilers, {len(ths)} theories each (a wrong compiler must be caught)")
    survivors = []
    for m in (None,) + MUTATIONS + ("NAIVE",):
        cs = [case(t, "ground", mutation=(m if m not in (None, "NAIVE") else None), naive=(m == "NAIVE")) for t in ths]
        res = run_cases(cs, mode=mode, quiet=True)
        n = sum(check(t, r0, r) is not None for t, r0, r in zip(ths, refs, res))
        print(f"   {str(m or 'correct scheme (control)'):28} theories with a wrong answer: {n:>4} / {len(ths)}")
        if m is not None and n == 0:
            survivors.append(m)
    print("   UNDETECTED MUTATIONS:", survivors or "none")

# ---------------------------------------------------------------- cyclic
if "cyc" in parts:
    print("\n-- cyclic rule bases (the reference leaves looping literals undecided; what does Drools do?)")
    hand = [
        T("positive loop p<->q, no base", [], [("r1", D, "p", ("q",)), ("r2", D, "q", ("p",))]),
        T("positive loop with a base fact", ["p"], [("r1", D, "q", ("p",)), ("r2", D, "p", ("q",))]),
        T("self-defeat: =>p, p=>-p", [], [("r1", D, "p", ()), ("r2", D, "-p", ("p",))]),
        T("self-defeat with priority for the loop rule", [], [("r1", D, "p", ()), ("r2", D, "-p", ("p",))], [("r2", "r1")]),
        T("mutual defeat through bodies", [], [("r1", D, "p", ()), ("r2", D, "q", ()), ("r3", D, "-q", ("p",)), ("r4", D, "-p", ("q",))]),
        T("odd negative loop", [], [("r1", D, "a", ()), ("r2", D, "b", ()), ("r3", D, "c", ()),
                                    ("r4", D, "-b", ("a",)), ("r5", D, "-c", ("b",)), ("r6", D, "-a", ("c",))]),
        T("strict positive loop", [], [("r1", S, "p", ("q",)), ("r2", S, "q", ("p",))]),
    ]
    rng = random.Random(99)
    rnd = []
    while len(rnd) < 1500:
        th = random_theory(rng, rng.randint(3, 7), rng.randint(4, 14), acyclic=False, name=f"Y{len(rnd)}",
                           p_fact=rng.choice([0.15, 0.3]), p_sup=rng.choice([0.0, 0.5]))
        if not is_acyclic(th):
            rnd.append(th)
    for label, ths in (("hand-written", hand), ("random cyclic", rnd)):
        for v in ("ground", "interp"):
            cs = [case(t, v) for t in ths]
            res = run_cases(cs, mode=mode, quiet=True, limit=20000)
            lim = wrong = okc = err = 0
            for t, r in zip(ths, res):
                if r["err"]:
                    err += 1; outcome = "ERROR"
                elif r["snaps"][-1]["limit"]:
                    lim += 1; outcome = "NEVER TERMINATES (stopped at 20000 firings)"
                else:
                    m = check(t, ref_fixpoint(t), r)
                    if m: wrong += 1
                    else: okc += 1
                    outcome = m or "same as reference"
                if label == "hand-written" and v == "ground":
                    print(f"   {t.name:46} -> {outcome}")
            print(f"   {label:14} {v:8} n={len(ths):>5}: never terminates={lim}  terminates with different conclusions={wrong}  same as reference={okc}  errors={err}")
    n_rej = 0
    for t in hand + rnd:
        try:
            encode_drl_strat(t)
        except ValueError:
            n_rej += 1
    print(f"   static cycle check rejects {n_rej} / {len(hand) + len(rnd)} of these before any DRL is emitted")

# ---------------------------------------------------------------- incremental
def incremental_cases(ths, variant, steps, rng, direct=False):
    cs, plans = [], []
    for th in ths:
        drl, sops, cache = setup(th, variant)
        ftype = "Strict" if direct else "Fact"
        cur = set(th.facts)
        ops = list(sops) + [["+", ftype, f] for f in sorted(cur)] + [["fire"]]
        states = [frozenset(cur)]
        lits = list(th.literals())
        for _ in range(steps):
            l = rng.choice(lits)
            if l in cur:
                cur.discard(l); ops.append(["-", ftype, l])
            else:
                cur.add(l); ops.append(["+", ftype, l])
            ops.append(["fire"]); states.append(frozenset(cur))
        cs.append({"id": th.name, "drl": drl, "ops": ops, "out": ["Strict", "Def"], "cache": cache})
        plans.append(states)
    return cs, plans

if "inc" in parts:
    print("\n-- incremental sessions: facts inserted/retracted between fireAllRules calls (acyclic theories, 10 steps each)")
    rng = random.Random(555)
    ths = [make(rng, SETS[k], f"I{i}") for i, k in enumerate(["A small/dense", "B medium", "E conflict sets"] * 200)]
    for v in ("ground", "interp", "generic", "strat"):
        cs, plans = incremental_cases(ths, v, 10, random.Random(556))
        res = run_cases(cs, mode=mode, quiet=True)
        bad_th = bad_snap = n_snap = errs = 0
        for th, states, r in zip(ths, plans, res):
            if r["err"]:
                errs += 1; continue
            b = sum(snap_check(th, f, s) is not None for f, s in zip(states, r["snaps"]))
            n_snap += len(states); bad_snap += b; bad_th += b > 0
        print(f"   {v:8} theories={len(ths)} snapshots={n_snap}  wrong snapshots={bad_snap} (in {bad_th} theories)  errors={errs}")

# ---------------------------------------------------------------- stated/logical mixing
if "mix" in parts:
    print("\n-- input facts inserted directly as stated Strict(..) objects instead of a separate Fact type")
    th = T("p is a fact AND strictly derivable from fact a", ["a", "p"], [("r1", S, "p", ("a",)), ("r2", D, "q", ("p",))])
    drl = encode_drl_ground(th)
    for label, ops in (
        ("separate Fact type: delete Fact(p)", [["+", "Fact", "a"], ["+", "Fact", "p"], ["fire"], ["-", "Fact", "p"], ["fire"]]),
        ("stated Strict: delete stated Strict(p), a remains", [["+", "Strict", "a"], ["+", "Strict", "p"], ["fire"], ["-", "Strict", "p"], ["fire"]]),
        ("stated Strict inserted AFTER p was derived, then deleted", [["+", "Strict", "a"], ["fire"], ["+", "Strict", "p"], ["fire"], ["-", "Strict", "p"], ["fire"]]),
    ):
        r = run_cases([{"id": "m", "drl": drl, "ops": ops, "out": ["Strict", "Def"]}], mode=mode, quiet=True)[0]
        last = r["snaps"][-1]["facts"] if not r["err"] else r["err"][:300]
        want = ref_fixpoint(Theory(frozenset(["a"]), th.rules, th.sup))
        okc = (not r["err"]) and frozenset(last["Def"]) == want["+d"] and frozenset(last["Strict"]) == want["+D"]
        print(f"   {label:58} final Strict={last['Strict'] if not r['err'] else last} (expected {sorted(want['+D'])}) Def={last['Def'] if not r['err'] else ''} (expected {sorted(want['+d'])}) -> {'ok' if okc else 'WRONG'}")
    rng = random.Random(558)
    ths = [make(rng, SETS[k], f"X{i}") for i, k in enumerate(["A small/dense", "B medium"] * 200)]
    cs, plans = incremental_cases(ths, "ground", 10, random.Random(559), direct=True)
    res = run_cases(cs, mode=mode, quiet=True)
    bad_th = bad_snap = n_snap = errs = 0
    for th, states, r in zip(ths, plans, res):
        if r["err"]:
            errs += 1; continue
        b = sum(snap_check(th, f, s) is not None for f, s in zip(states, r["snaps"]))
        n_snap += len(states); bad_snap += b; bad_th += b > 0
    print(f"   random incremental, stated Strict inputs: theories={len(ths)} snapshots={n_snap} wrong snapshots={bad_snap} (in {bad_th} theories) errors={errs}")
    if errs:
        print("     first error:", next(r["err"] for r in res if r["err"])[:400])

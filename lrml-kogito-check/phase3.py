"""Phase 3: rules with variables. Lifted DRL (joins on variables) vs the reference applied to the grounding."""
import random, sys, time, json
from dlcore import *
from folog import *
from drools_run import run_cases

N = int(sys.argv[1]) if len(sys.argv) > 1 else 500
mode = sys.argv[2] if len(sys.argv) > 2 else "classic"
OUT = ["FStrict", "FDef"]

def cmp(ft, r, facts=None):
    if r["err"]:
        return "ERR " + r["err"][:300]
    g = ground(ft)
    if facts is not None:
        g = Theory(frozenset(lit(a.sign, a.pred, a.args) for a in facts), g.rules, g.sup, None)
    ref = ref_fixpoint(g)
    snap = r["snaps"][-1]
    if snap["limit"]:
        return "LIMIT"
    if parse_out(snap["facts"]["FStrict"]) != ref["+D"]:
        return "+D differs"
    if parse_out(snap["facts"]["FDef"]) != ref["+d"]:
        return "+d differs " + str(sorted(parse_out(snap["facts"]["FDef"]) ^ ref["+d"]))
    return None

print(f"== first-order rules, mode={mode}, N={N}")
rng = random.Random(31337)
fts = []
while len(fts) < N:
    ft = random_ftheory(rng, rng.randint(3, 7), rng.randint(2, 4), rng.randint(4, 14), name=f"F{len(fts)}")
    g = ground(ft)
    assert is_acyclic(g)
    fts.append(ft)
print(f"   predicate-acyclic theories: {N}; avg ground rules {sum(len(ground(f).rules) for f in fts)/N:.0f}")
bad_total = 0
for style in ("meta", "pred", "strat", "antistrat"):
    cs = [{"id": ft.name, "drl": encode_lifted(ft, style), "ops": [fact_op(a) for a in ft.facts] + [["fire"]], "out": OUT, "shuffle": i} for i, ft in enumerate(fts)]
    t0 = time.time(); res = run_cases(cs, mode=mode, quiet=True)
    fails = [(ft.name, m) for ft, r in zip(fts, res) if (m := cmp(ft, r))]
    dels = sum(r["snaps"][-1].get("tmsDeletes", 0) for r in res if not r["err"])
    print(f"   one-shot    style={style:6} failures={len(fails):>4} / {N}   tmsDeletes={dels:>6}  {time.time()-t0:.0f}s")
    for f in fails[:2]: print("      ", f)
    if style != "meta": bad_total += len(fails)

# incremental on per-predicate styles
for style in ("meta", "pred"):
    rng2 = random.Random(77)
    cs, plans = [], []
    for ft in fts[: N // 2]:
        cur = list(ft.facts); ops = [fact_op(a) for a in cur] + [["fire"]]; states = [list(cur)]
        pool = [Atom(s, p, c) for p in ft.arity for c in __import__("itertools").product(ft.consts, repeat=ft.arity[p]) for s in "+-"]
        for _ in range(8):
            a = rng2.choice(pool)
            if a in cur:
                cur.remove(a); ops.append(fact_op(a, "-"))
            else:
                cur.append(a); ops.append(fact_op(a, "+"))
            ops.append(["fire"]); states.append(list(cur))
        cs.append({"id": ft.name, "drl": encode_lifted(ft, style), "ops": ops, "out": OUT}); plans.append(states)
    res = run_cases(cs, mode=mode, quiet=True)
    bad_s = bad_t = tot = 0
    for ft, states, r in zip(fts, plans, res):
        if r["err"]:
            bad_t += 1; continue
        b = 0
        for st, snap in zip(states, r["snaps"]):
            tot += 1
            if cmp(ft, {"err": None, "snaps": [snap]}, facts=st): b += 1
        bad_s += b; bad_t += b > 0
    print(f"   incremental style={style:6} wrong snapshots={bad_s:>4} / {tot} (in {bad_t} theories)")
    if style != "meta": bad_total += bad_s

# recursive predicates (ground-acyclic is not guaranteed: keep only those whose grounding is acyclic)
rng = random.Random(4711)
rec = []
tries = 0
while len(rec) < min(N, 300) and tries < 200000:
    tries += 1
    ft = random_ftheory(rng, rng.randint(2, 4), rng.randint(2, 3), rng.randint(3, 8), recursive=True, name=f"R{len(rec)}")
    if pred_levels(ft) is None and is_acyclic(ground(ft)):
        rec.append(ft)
print(f"   recursive predicates whose grounding is still acyclic: {len(rec)} theories (from {tries} candidates)")
for style in ("meta", "pred"):
    cs = [{"id": ft.name, "drl": encode_lifted(ft, style), "ops": [fact_op(a) for a in ft.facts] + [["fire"]], "out": OUT, "shuffle": i} for i, ft in enumerate(rec)]
    res = run_cases(cs, mode=mode, quiet=True)
    fails = [(ft.name, m) for ft, r in zip(rec, res) if (m := cmp(ft, r))]
    print(f"   one-shot    style={style:6} recursive: failures={len(fails):>4} / {len(rec)}")
    for f in fails[:2]: print("      ", f)
print("RESULT (pred + strat styles on predicate-acyclic theories):", "OK" if bad_total == 0 else f"{bad_total} FAILURES")

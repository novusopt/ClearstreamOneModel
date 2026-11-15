"""Phase 1: Drools 10.2.0 vs the reference on random acyclic theories.

usage: phase1.py N [mode=classic|exec] [variants=ground,generic,interp] [sets=A,B,C,D,E] [--equality] [--shuffle]
"""
import random, sys, time, json
from dlcore import *
from encoders import *
from drools_run import run_cases, last_sets
from cases import setup
from sets import SETS, make

args = [a for a in sys.argv[1:] if not a.startswith("--")]
N = int(args[0]) if args else 2000
mode = args[1] if len(args) > 1 else "classic"
variants = (args[2] if len(args) > 2 else "ground,generic,interp").split(",")
sets = (args[3] if len(args) > 3 else "A,B,C,D,E").split(",")
equality = "--equality" in sys.argv
shuffle = "--shuffle" in sys.argv
seed_off = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--seed=")), 0)

print(f"Drools differential test: N={N}/set mode={mode} equality={equality} shuffle={shuffle} seed_offset={seed_off}")
print(f"{'set':18} {'variant':8} {'n':>6} {'errors':>7} {'limit':>6} {'D-diff':>7} {'d-diff':>7} {'tmsDel':>8} {'sec':>7}")
bad = 0
examples = []
for si, (sname, spec) in enumerate(SETS.items()):
    if sname[0] not in sets:
        continue
    rng = random.Random(1000 + si + 7919 * seed_off)
    ths = [make(rng, spec, f"{sname[0]}{i}") for i in range(N)]
    refs = [ref_fixpoint(t) for t in ths]
    for v in variants:
        cases = []
        for i, th in enumerate(ths):
            drl, sops, cache = setup(th, v)
            ops = sops + facts_ops(th)
            c = {"id": th.name, "drl": drl, "ops": ops + [["fire"]], "out": ["Strict", "Def"], "cache": cache}
            if shuffle:
                c["shuffle"] = i * 31 + 7
            cases.append(c)
        t0 = time.time()
        res = run_cases(cases, mode=mode, equality=equality, quiet=True)
        errs = lim = dD = dd = dels = 0
        for th, ref, r in zip(ths, refs, res):
            if r["err"]:
                errs += 1
                if len(examples) < 5: examples.append((th.name, v, "ERR", r["err"][:300]))
                continue
            dels += r["snaps"][-1].get("tmsDeletes", 0)
            if r["snaps"][-1]["limit"]:
                lim += 1; continue
            S, D = last_sets(r)
            if S != ref["+D"]:
                dD += 1
            if D != ref["+d"]:
                dd += 1
                if len(examples) < 5: examples.append((th.name, v, sorted(D ^ ref["+d"]), json.dumps(th.to_json())))
        bad += errs + lim + dD + dd
        print(f"{sname:18} {v:8} {N:>6} {errs:>7} {lim:>6} {dD:>7} {dd:>7} {dels:>8} {time.time()-t0:>7.1f}", flush=True)
for e in examples:
    print("EXAMPLE", e)
print("RESULT:", "OK - zero differences" if bad == 0 else f"{bad} PROBLEMS")
sys.exit(0 if bad == 0 else 1)

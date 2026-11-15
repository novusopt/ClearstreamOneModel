"""Phase 0: is the reference itself trustworthy, and does the ASP scheme match it?"""
import random, sys, time
from dlcore import *
from encoders import encode_asp, solve_asp
from litex import EXAMPLES

from sets import SETS, make

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    fail = 0
    print("== literature examples (expected values hand-derived from the published proof conditions)")
    for th, ask, exp_d, exp_D in EXAMPLES:
        r1 = ref_fixpoint(th); r2 = ref_recursive(th); a = solve_asp(encode_asp(th))
        for nm, got in (("fixpoint", r1), ("recursive", r2), ("asp", a)):
            gd = sorted(x for x in ask if x in got["+d"]); gD = sorted(x for x in ask if x in got["+D"])
            if gd != sorted(exp_d) or gD != sorted(exp_D):
                fail += 1; print(f"  FAIL {th.name} [{nm}] +d={gd} (want {sorted(exp_d)}) +D={gD} (want {sorted(exp_D)})")
    print(f"  {len(EXAMPLES)} examples x 3 evaluators, failures: {fail}")

    print(f"\n== random acyclic theories, {N} per set")
    print(f"{'set':18} {'n':>6} {'fix!=rec':>9} {'asp!=fix':>9} {'naive!=fix':>11} {'undecided':>10} {'avg|+d|':>8} {'sec':>6}")
    total_bad = 0
    for si, (sname, spec) in enumerate(SETS.items()):
        rng = random.Random(1000 + si)
        t0 = time.time(); d_rec = d_asp = d_naive = undec = 0; size = 0
        for i in range(N):
            th = make(rng, spec, f"{sname[0]}{i}")
            assert is_acyclic(th)
            r1 = ref_fixpoint(th)
            lits = set(th.literals())
            # decisiveness: on acyclic theories every literal must get exactly one tag of each kind
            if (r1["+D"] | r1["-D"]) != lits or (r1["+d"] | r1["-d"]) != lits or (r1["+D"] & r1["-D"]) or (r1["+d"] & r1["-d"]):
                undec += 1
            r2 = ref_recursive(th)
            if r2["+D"] != r1["+D"] or r2["+d"] != r1["+d"]:
                d_rec += 1
            a = solve_asp(encode_asp(th))
            if a["+D"] != r1["+D"] or a["+d"] != r1["+d"]:
                d_asp += 1
            try:
                nv = solve_asp(encode_asp(th, "naive"))
                if nv["+d"] != r1["+d"]:
                    d_naive += 1
            except RuntimeError:
                d_naive += 1
            size += len(r1["+d"])
        total_bad += d_rec + d_asp + undec
        print(f"{sname:18} {N:>6} {d_rec:>9} {d_asp:>9} {d_naive:>11} {undec:>10} {size/N:>8.1f} {time.time()-t0:>6.1f}")
    print("RESULT:", "OK" if total_bad == 0 and fail == 0 else "DIFFERENCES FOUND")
    sys.exit(0 if total_bad == 0 and fail == 0 else 1)

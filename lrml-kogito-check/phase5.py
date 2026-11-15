"""Phase 5: size limits. Large rule bases, deep chains, wide teams: correctness, build time, run time."""
import random, sys, time
from dlcore import *
from drools_run import run_cases
from cases import *
from litex import T

mode = sys.argv[1] if len(sys.argv) > 1 else "classic"
S, D, X = STRICT, DEFEASIBLE, DEFEATER
rng = random.Random(8080)
big = []
for (na, nr) in ((300, 1000), (1000, 3000), (2000, 6000)):
    big.append(random_theory(rng, na, nr, p_fact=0.3, p_sup=0.5, name=f"random {na} atoms / {nr} rules"))
depth = 3000
chain = T(f"defeasible chain of depth {depth}", ["x0"], [(f"c{i}", D, f"x{i+1}", (f"x{i}",)) for i in range(depth)])
chain_att = T(f"chain of depth {depth}, attacked and rescued at every step", ["x0"],
              [r for i in range(depth) for r in ((f"c{i}", D, f"x{i+1}", (f"x{i}",)), (f"n{i}", D, f"-x{i+1}", (f"x{i}",)))],
              [(f"c{i}", f"n{i}") for i in range(depth)])
schain = T(f"strict chain of depth {depth}", ["x0"], [(f"c{i}", S, f"x{i+1}", (f"x{i}",)) for i in range(depth)])
wide = T("team of 800 supporters vs 800 attackers, pairwise priorities", [f"f{i}" for i in range(800)] + [f"g{i}" for i in range(800)],
         [(f"s{i}", D, "p", (f"f{i}",)) for i in range(800)] + [(f"a{i}", D, "-p", (f"g{i}",)) for i in range(800)],
         [(f"s{i}", f"a{i}") for i in range(800)])
wide_gap = Theory(wide.facts, wide.rules, wide.sup - {("s417", "a417")}, None, "same, one attacker unanswered")
print(f"== mode={mode}")
print(f"{'theory':62} {'variant':8} {'DRL KB':>7} {'build s':>8} {'run s':>7} {'firings':>8}  result")
bad = 0
for th in big + [chain, chain_att, schain, wide, wide_gap]:
    t0 = time.time(); ref = ref_fixpoint(th) if len(th.rules) <= 3100 else ref_recursive(th); tref = time.time() - t0
    for v in ("strat", "ground", "interp"):
        c = case(th, v)
        try:
            r = run_cases([c], mode=mode, quiet=True, threads=1, limit=5_000_000, heap="8g")[0]
        except Exception as e:
            print(f"{th.name:62} {v:8} harness crashed: {str(e)[-300:]}"); bad += 1; continue
        m = check(th, ref, r)
        bad += m is not None
        fired = r["snaps"][-1]["fired"] if not r["err"] else -1
        print(f"{th.name:62} {v:8} {len(c['drl'])//1024:>7} {r.get('buildMs', 0)/1000:>8.1f} {r.get('runMs', 0)/1000:>7.1f} {fired:>8}  {'same as reference' if m is None else m[:160]}", flush=True)
print("RESULT:", "OK" if bad == 0 else f"{bad} PROBLEMS")

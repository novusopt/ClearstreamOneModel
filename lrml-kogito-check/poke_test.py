"""Is every wrong answer of the shared-rule variants the lost-propagation defect?
Test: after a wrong snapshot, insert and delete one dummy object of every fact type (forcing every rule to be
re-evaluated) and fire again. If the answer becomes correct, the wrong answer was a pending, never-processed
retraction, not a logic error of the scheme."""
import random, sys, io, contextlib, importlib.util
from dlcore import *
from drools_run import run_cases
from cases import *
from sets import SETS, make
sys.argv = ["x", "classic", "none"]
spec = importlib.util.spec_from_file_location("p2b", "phase2b.py"); p2b = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(p2b)
TYPES = {"Fact": 1, "Strict": 1, "Def": 1, "App": 3, "Supported": 1, "Attacked": 1, "Beaten": 2, "RuleDef": 3, "Body": 2, "Sup": 2, "Conflict": 2}
POKE = [["+", t] + ["__poke"] * n for t, n in TYPES.items()] + [["fire"]] + [["-", t] + ["__poke"] * n for t, n in TYPES.items()] + [["fire"]]
rng = random.Random(555)
ths = [make(rng, SETS[k], f"I{i}") for i, k in enumerate(["A small/dense", "B medium", "E conflict sets"] * 200)]
for v in ("interp", "generic"):
    cs, plans = p2b.incremental_cases(ths, v, 10, random.Random(556))
    res = run_cases(cs, quiet=True)
    todo = []
    for th, states, c, r in zip(ths, plans, cs, res):
        bad = [i for i, (f, s) in enumerate(zip(states, r["snaps"])) if p2b.snap_check(th, f, s)]
        if bad:
            # cut the script after the first wrong snapshot and append the poke
            i = bad[0]; n = 0; cut = None
            for k, o in enumerate(c["ops"]):
                if o[0] == "fire":
                    if n == i: cut = k; break
                    n += 1
            c2 = dict(c); c2["ops"] = c["ops"][:cut + 1] + POKE; todo.append((th, states[i], c2))
    res2 = run_cases([c for _, _, c in todo], quiet=True)
    healed = sum(p2b.snap_check(th, f, r["snaps"][-1]) is None for (th, f, _), r in zip(todo, res2))
    still = sum(p2b.snap_check(th, f, r["snaps"][-3]) is not None for (th, f, _), r in zip(todo, res2))
    print(f"{v:8} incremental: theories with a wrong snapshot={len(todo)}; wrong again when replayed={still}; correct after forcing re-evaluation={healed}")

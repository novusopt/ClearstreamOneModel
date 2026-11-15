"""Encoding-independent reproduction of the stale-logical-fact behaviour found in Drools 10.2.0.

Two rules, no defeasible logic involved:
  derive: Fact(x), not Attacked(x)  =>  insertLogical Def(x)
  chain : Def("a")                  =>  insertLogical Fact("b")
Steps: insert Fact(a); fire  -> Def(a), Fact(b), Def(b)
       insert Attacked(a); fire -> Def(a) loses its justification, so Fact(b) and Def(b) must go too.
Correct final state: no Def at all.
"""
import sys
from drools_run import run_cases

HEAD = "package dl.gen;\nimport dl.model.*;\n\n"
DERIVE = 'rule "derive"\nwhen\n    Fact($x : lit)\n    not Attacked(lit == $x)\nthen\n    insertLogical(new Def($x));\nend\n\n'
CHAIN = 'rule "chain"\nwhen\n    Def(lit == "a")\nthen\n    insertLogical(new Fact("b"));\nend\n\n'
# same logic, but the chain rule has a second pattern so its retraction is not propagated eagerly
CHAIN2 = 'rule "chain"\nwhen\n    Def(lit == "a")\n    Sup(hi == "go")\nthen\n    insertLogical(new Fact("b"));\nend\n\n'
OPS = [["+", "Fact", "a"], ["fire"], ["+", "Attacked", "a"], ["fire"], ["fire"], ["+", "Fact", "unrelated"], ["fire"]]
OUT = ["Fact", "Def"]
cases = [
    {"id": "derive,chain", "drl": HEAD + DERIVE + CHAIN, "ops": OPS, "out": OUT},
    {"id": "chain,derive", "drl": HEAD + CHAIN + DERIVE, "ops": OPS, "out": OUT},
    {"id": "derive,chain(2 patterns)", "drl": HEAD + DERIVE + CHAIN2, "ops": [["+", "Sup", "go", "x"]] + OPS, "out": OUT},
]
ok = True
for mode in ("classic", "exec"):
    for eq in (False, True):
        res = run_cases(cases, mode=mode, equality=eq, quiet=True, threads=1)
        for c, r in zip(cases, res):
            if r["err"]:
                print(mode, eq, c["id"], "ERR", r["err"][:200]); continue
            snaps = [sorted(s["facts"]["Def"]) for s in r["snaps"]]
            stale = snaps[1] != []
            print(f"mode={mode:7} equality={eq!s:5} rules={c['id']:26} Def after: fire1={snaps[0]} fire2={snaps[1]} fire3={snaps[2]} +unrelated fact,fire4={snaps[3]}  -> {'STALE Def(b)' if stale else 'correct'}")

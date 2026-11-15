"""Greedy delta-debugging of a theory for which a Drools variant disagrees with the reference."""
import json, sys
from dlcore import *
from drools_run import run_cases
from cases import *

def fails_batch(ths, variant, mode="classic"):
    cs = [case(t, variant, str(i)) for i, t in enumerate(ths)]
    res = run_cases(cs, quiet=True, mode=mode)
    return [check(t, ref_fixpoint(t), r) is not None for t, r in zip(ths, res)]

def minimize(th, variant, mode="classic"):
    cur = th
    changed = True
    while changed:
        changed = False
        cands = []
        for i in range(len(cur.rules)):
            cands.append(Theory(cur.facts, cur.rules[:i] + cur.rules[i+1:], cur.sup, cur.conflict, cur.name))
        for f in sorted(cur.facts):
            cands.append(Theory(cur.facts - {f}, cur.rules, cur.sup, cur.conflict, cur.name))
        for s in sorted(cur.sup):
            cands.append(Theory(cur.facts, cur.rules, cur.sup - {s}, cur.conflict, cur.name))
        for i, r in enumerate(cur.rules):
            for j in range(len(r.body)):
                nr = Rule(r.label, r.kind, r.head, r.body[:j] + r.body[j+1:])
                cands.append(Theory(cur.facts, cur.rules[:i] + [nr] + cur.rules[i+1:], cur.sup, cur.conflict, cur.name))
        cands = [c for c in cands if is_acyclic(c)]
        if not cands: break
        fl = fails_batch(cands, variant, mode)
        for c, f in zip(cands, fl):
            if f:
                cur = c; changed = True; break
    return cur

if __name__ == "__main__":
    th = Theory.from_json(json.load(open(sys.argv[1])))
    m = minimize(th, sys.argv[2])
    print(json.dumps(m.to_json()))
    json.dump(m.to_json(), open(sys.argv[1].replace(".json", ".min.json"), "w"))

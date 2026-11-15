"""Export test theories in SPINdle's .dfl text syntax so that the reference can be cross-checked against an
independent, published defeasible-logic reasoner (SPINdle 2.2.4, NICTA; ambiguity blocking is its default).

NOT RUN in this study: executing the downloaded SPINdle jar was not permitted in the test environment.
Syntax follows the sample file shipped with SPINdle (samples/sdlTestTheory.dfl):
    >> a            fact            r1: a,b -> c    strict rule       r2: a => -c   defeasible rule
    r3: a ~> c      defeater        r1 > r2         superiority       -x            negation
usage: export_spindle.py OUTDIR [N per set]
Writes OUTDIR/<name>.dfl and OUTDIR/expected.json ({name: {"+D": [...], "+d": [...]}})."""
import json, os, random, sys
from dlcore import *
from sets import SETS, make

ARROW = {STRICT: "->", DEFEASIBLE: "=>", DEFEATER: "~>"}

def to_dfl(th: Theory) -> str:
    out = [f">> {f}" for f in sorted(th.facts)]
    out += [f"{r.label}: {','.join(r.body)} {ARROW[r.kind]} {r.head}" for r in th.rules]
    out += [f"{a} > {b}" for a, b in sorted(th.sup)]
    return "\n".join(out) + "\n"

if __name__ == "__main__":
    outdir = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 200
    os.makedirs(outdir, exist_ok=True)
    expected = {}
    for si, key in enumerate(["A small/dense", "B medium", "C large/sparse"]):  # standard complement only
        rng = random.Random(5000 + si)
        for i in range(n):
            th = make(rng, SETS[key], f"{key[0]}{i}")
            open(os.path.join(outdir, th.name + ".dfl"), "w").write(to_dfl(th))
            ref = ref_fixpoint(th)
            expected[th.name] = {"+D": sorted(ref["+D"]), "+d": sorted(ref["+d"])}
    json.dump(expected, open(os.path.join(outdir, "expected.json"), "w"), indent=0)
    print(f"wrote {len(expected)} theories to {outdir}")

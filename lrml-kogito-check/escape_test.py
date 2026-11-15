"""Which characters survive in rule labels / literal names when they are written into DRL string literals?"""
import sys
from dlcore import *
from drools_run import run_cases
from cases import *
from litex import T
D = DEFEASIBLE
samples = {"double quote": 'say "hi"', "backslash": "back\\slash", "dollar": "dollar$sign", "newline": "new\nline", "tab": "tab\there",
           "non-ASCII": "unicode-é-法-✓", "semicolon": "semi;colon", "spaces": "a b c", "comment marker": "a//b", "keyword end": "end",
           "keyword rule": "rule", "single quote": "it's", "percent/braces": "100%{x}", "emoji (astral plane)": "ok-😀", "carriage return": "cr\rx",
           "at sign": "@x", "hash": "#x", "parentheses": "f(x,y)", "leading minus handled as negation": "x-y"}
for mode in ("classic", "exec"):
    cs, ths = [], []
    for what, name in samples.items():
        th = T(what, [name], [("L:" + name, D, "H:" + name, (name,))])
        ths.append(th); cs.append(case(th, "ground", what))
    res = run_cases(cs, mode=mode, quiet=True, threads=2)
    bad = [(t.name, (check(t, ref_fixpoint(t), r) or "")[:110].replace("\n", " ")) for t, r in zip(ths, res) if check(t, ref_fixpoint(t), r)]
    print(f"mode={mode}: {len(samples) - len(bad)} / {len(samples)} kinds of name survive; failing: {bad or 'none'}")

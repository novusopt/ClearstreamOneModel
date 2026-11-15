"""Compare what the Kogito application produced with the reference."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
cases = {c["i"]: c for c in json.load(open(os.path.join(HERE, "kogito-app/cases.json")))}
out = json.load(open(os.path.join(HERE, "kogito-app/target/kogito-results.json")))
n = len(out["units"]); d_err = r_err = d_bad = r_bad = sD_bad = 0
first = []
for u in out["units"]:
    c = cases[u["i"]]
    if "directErr" in u:
        d_err += 1; first.append(("directErr", u["i"], u["directErr"][:300]))
    else:
        if u["direct"]["def"] != c["expd"]: d_bad += 1; first.append(("direct def", u["i"]))
        if u["direct"]["strict"] != c["expD"]: sD_bad += 1
    if "restErr" in u:
        r_err += 1; first.append(("restErr", u["i"], u["restErr"][:300]))
    elif u["rest"] != c["expd"]:
        r_bad += 1; first.append(("rest def", u["i"], u["rest"], c["expd"]))
strat = sum(c["strat"] for c in cases.values())
print(f"Kogito rule units: {n} ({n - strat} ground scheme, {strat} stratified)")
print(f"  injected RuleUnit : errors={d_err}  +d differences={d_bad}  +D differences={sD_bad}")
print(f"  generated REST API: errors={r_err}  +d differences={r_bad}")
for f in first[:6]: print("   ", f)
b = out["bug"]
print(f"  two-rule truth-maintenance reproduction as a rule unit: after fire1={b.get('afterFire1')} after fire2={b.get('afterFire2')} err={b.get('err')}"
      f"  -> {'STALE Def(b)' if b.get('afterFire2') else 'correct' if 'err' not in b else 'error'}")
sys.exit(0 if not (d_err or r_err or d_bad or r_bad or sD_bad) else 1)

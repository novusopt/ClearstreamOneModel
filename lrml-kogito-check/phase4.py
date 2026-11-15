"""Phase 4: LegalRuleML XML -> compiler -> Drools, on two small real-law examples and on rejection tests.

Expected conclusions per scenario are written by hand from the legal text (see comments); they are checked
against (1) the reference applied to the grounded theory and (2) Drools running the lifted stratified DRL."""
import sys, os
from dlcore import *
from folog import *
from lrml2dl import compile_lrml, Unsupported
from drools_run import run_cases

mode = sys.argv[1] if len(sys.argv) > 1 else "classic"
HERE = os.path.dirname(os.path.abspath(__file__))

def A(s):
    """'-highRisk(cv)' -> Atom"""
    sign = "-" if s.startswith("-") else "+"
    s = s.lstrip("-"); pred, rest = s.split("(")
    return Atom(sign, pred, tuple(x.strip() for x in rest.rstrip(")").split(",")))

SCENARIOS = {
 "legal/aiact_art6.lrml": [
  # name, facts, literals that MUST be concluded, literals that must NOT be concluded
  ("Annex III system, no derogation: high-risk, provider must register (Art. 6(2), 49(1))",
   ["annexIII(cv)", "provider(acme,cv)"], ["highRisk(cv)", "O_register(acme,cv)"], ["-highRisk(cv)", "O_documentAssessment(acme,cv)"]),
  ("Annex III + derogation condition: not high-risk; document the assessment and register (Art. 6(3), 6(4))",
   ["annexIII(cv)", "derogationCondition(cv)", "provider(acme,cv)"],
   ["-highRisk(cv)", "O_documentAssessment(acme,cv)", "O_register(acme,cv)"], ["highRisk(cv)"]),
  ("Annex III + derogation condition + profiling: always high-risk (Art. 6(3) third subparagraph)",
   ["annexIII(cv)", "derogationCondition(cv)", "profiling(cv)", "provider(acme,cv)"],
   ["highRisk(cv)", "O_register(acme,cv)"], ["-highRisk(cv)", "O_documentAssessment(acme,cv)"]),
  ("Annex III + derogation condition, but also an Annex I product with third-party assessment: high-risk via Art. 6(1)",
   ["annexIII(cv)", "derogationCondition(cv)", "annexIProduct(cv)", "thirdPartyAssessment(cv)", "provider(acme,cv)"],
   ["highRisk(cv)", "O_register(acme,cv)"], ["-highRisk(cv)", "O_documentAssessment(acme,cv)"]),
  ("Annex I product without third-party assessment, not in Annex III: nothing follows",
   ["annexIProduct(toy)", "provider(acme,toy)"], [], ["highRisk(toy)", "-highRisk(toy)", "O_register(acme,toy)"]),
  ("Derogation condition without Annex III: the derogation has nothing to derogate from",
   ["derogationCondition(bot)", "provider(acme,bot)"], [], ["highRisk(bot)", "-highRisk(bot)", "O_register(acme,bot)", "O_documentAssessment(acme,bot)"]),
  ("Two systems, one provider: conclusions stay per system",
   ["annexIII(cv)", "annexIII(score)", "derogationCondition(score)", "provider(acme,cv)", "provider(acme,score)"],
   ["highRisk(cv)", "-highRisk(score)", "O_register(acme,cv)", "O_register(acme,score)", "O_documentAssessment(acme,score)"],
   ["O_documentAssessment(acme,cv)", "highRisk(score)"]),
 ],
 "legal/dora_ict.lrml": [
  ("Bank identified for TLPT: full framework and TLPT (Art. 6(1), 26(1))",
   ["financialEntity(bank)", "identifiedForTlpt(bank)"], ["O_fullIctFramework(bank)", "O_tlpt(bank)"],
   ["O_simplifiedIctFramework(bank)", "PN_fullIctFramework(bank)", "PN_tlpt(bank)"]),
  ("Small non-interconnected investment firm (Art. 16(1) entity): simplified framework, no full framework, no TLPT",
   ["financialEntity(firm)", "art16Entity(firm)", "identifiedForTlpt(firm)"],
   ["O_simplifiedIctFramework(firm)", "PN_fullIctFramework(firm)", "PN_tlpt(firm)"], ["O_fullIctFramework(firm)", "O_tlpt(firm)"]),
  ("Microenterprise identified for TLPT: full framework applies, TLPT does not (Art. 26(1))",
   ["financialEntity(micro)", "microenterprise(micro)", "identifiedForTlpt(micro)"],
   ["O_fullIctFramework(micro)", "PN_tlpt(micro)"], ["O_tlpt(micro)", "O_simplifiedIctFramework(micro)"]),
  ("Bank not identified for TLPT: no TLPT duty",
   ["financialEntity(bank)"], ["O_fullIctFramework(bank)"], ["O_tlpt(bank)"]),
  ("Major incident: report it (Art. 19(1)); only for the entity that had it",
   ["financialEntity(bank)", "financialEntity(firm)", "art16Entity(firm)", "majorIncident(bank,inc1)"],
   ["O_reportIncident(bank,inc1)", "O_fullIctFramework(bank)", "O_simplifiedIctFramework(firm)"],
   ["O_reportIncident(firm,inc1)", "O_fullIctFramework(firm)"]),
 ],
}

bad = 0
for path, scen in SCENARIOS.items():
    xml = open(os.path.join(HERE, path)).read()
    print(f"\n== {path}")
    cases, metas = [], []
    for name, facts, must, mustnot in scen:
        fa = [A(f) for f in facts]
        ft, _ = compile_lrml(xml, consts_extra={c for a in fa for c in a.args})
        ft.facts = fa
        g = ground(ft); assert is_acyclic(g)
        ref = ref_fixpoint(g)
        for style in ("strat", "pred"):
            cases.append({"id": name, "drl": encode_lifted(ft, style), "ops": [fact_op(a) for a in fa] + [["fire"]], "out": ["FStrict", "FDef"]})
            metas.append((name, style, ref, must, mustnot, len(ft.rules), len(g.rules)))
    res = run_cases(cases, mode=mode, quiet=True)
    for (name, style, ref, must, mustnot, nr, ngr), r in zip(metas, res):
        if r["err"]:
            print("  ERR", name, r["err"][:400]); bad += 1; continue
        got = parse_out(r["snaps"][-1]["facts"]["FDef"])
        norm = lambda s: lit("-" if s.startswith("-") else "+", s.lstrip("-").split("(")[0], s.split("(")[1].rstrip(")").split(","))
        p1 = [m for m in must if norm(m) not in ref["+d"]] + [m for m in mustnot if norm(m) in ref["+d"]]
        p2 = [m for m in must if norm(m) not in got] + [m for m in mustnot if norm(m) in got]
        same = got == ref["+d"]
        ok = not p1 and not p2 and same
        bad += not ok
        if style == "strat":
            print(f"  [{'ok' if ok else 'FAIL'}] {name}")
        if not ok:
            print(f"        style={style} reference vs hand expectation: {p1 or 'ok'}; Drools vs hand expectation: {p2 or 'ok'}; Drools == reference: {same}")
    print(f"  ({metas[0][5]} compiled rules incl. permission/duty defeater copies; {len(scen)} scenarios x 2 DRL styles)")

print("\n== fail-closed checks: constructs outside the supported subset must be rejected, not silently dropped")
W = lambda body: f'<lrml:LegalRuleML xmlns:lrml="http://docs.oasis-open.org/legalruleml/ns/v1.0/" xmlns:ruleml="http://ruleml.org/spec"><lrml:Statements>{body}</lrml:Statements></lrml:LegalRuleML>'
at = lambda p, v="X": f'<ruleml:Atom><ruleml:Rel iri=":{p}"/><ruleml:Var>{v}</ruleml:Var></ruleml:Atom>'
rule = lambda key, if_, then, strength="<lrml:hasStrength><lrml:DefeasibleStrength/></lrml:hasStrength>", kind="Constitutive": \
    f'<lrml:{kind}Statement key="{key}"><ruleml:Rule>{strength}<ruleml:if>{if_}</ruleml:if><ruleml:then>{then}</ruleml:then></ruleml:Rule></lrml:{kind}Statement>'
REJECT = [
    ("disjunction in a body (ruleml:Or)", W(rule("r", f"<ruleml:Or>{at('a')}{at('b')}</ruleml:Or>", at("c")))),
    ("negation as failure (ruleml:Naf)", W(rule("r", f"<ruleml:Naf>{at('a')}</ruleml:Naf>", at("c")))),
    ("rule without strength", W(rule("r", at("a"), at("c"), strength=""))),
    ("head variable not bound in the body", W(rule("r", at("a", "X"), at("c", "Y")))),
    ("deontic conclusion in a constitutive statement", W(rule("r", at("a"), f"<lrml:Obligation>{at('c')}</lrml:Obligation>"))),
    ("Override naming an unknown statement", W(rule("r", at("a"), at("c")) + '<lrml:OverrideStatement><lrml:Override over="#zz" under="#r"/></lrml:OverrideStatement>')),
    ("recursive predicates", W(rule("r1", at("a"), at("b")) + rule("r2", at("b"), at("a")))),
    ("permission inside a SuborderList", W(rule("r", at("a"), f"<lrml:SuborderList><lrml:Obligation>{at('c')}</lrml:Obligation><lrml:Permission>{at('d')}</lrml:Permission></lrml:SuborderList>", kind="Prescriptive"))),
    ("function term (ruleml:Expr)", W(rule("r", f'<ruleml:Atom><ruleml:Rel iri=":a"/><ruleml:Expr><ruleml:Fun>f</ruleml:Fun><ruleml:Var>X</ruleml:Var></ruleml:Expr></ruleml:Atom>', at("c")))),
    ("lrml:Violation in a body", W(rule("r", f'<ruleml:And>{at("a")}<lrml:Violation keyref="#x"/></ruleml:And>', at("c")))),
]
for name, xml in REJECT:
    try:
        compile_lrml(xml); print(f"  [FAIL] accepted: {name}"); bad += 1
    except Unsupported as e:
        print(f"  [ok] rejected: {name:48} ({str(e)[:70]})")

print("\n== SuborderList (synthetic example, NOT from a legal text): O pay, otherwise O payFine, otherwise O suspend")
chain = W(rule("c1", at("debtor"), f"<lrml:SuborderList><lrml:Obligation>{at('pay')}</lrml:Obligation><lrml:Obligation>{at('payFine')}</lrml:Obligation><lrml:Obligation>{at('suspend')}</lrml:Obligation></lrml:SuborderList>", kind="Prescriptive"))
CH = [("nothing violated", ["debtor(d)"], ["O_pay(d)"], ["O_payFine(d)", "O_suspend(d)"]),
      ("payment not made", ["debtor(d)", "-pay(d)"], ["O_pay(d)", "O_payFine(d)"], ["O_suspend(d)"]),
      ("payment and fine not made", ["debtor(d)", "-pay(d)", "-payFine(d)"], ["O_pay(d)", "O_payFine(d)", "O_suspend(d)"], []),
      ("fine unpaid but primary duty met", ["debtor(d)", "pay(d)", "-payFine(d)"], ["O_pay(d)"], ["O_payFine(d)", "O_suspend(d)"])]
cases = []
for name, facts, must, mustnot in CH:
    fa = [A(f) for f in facts]; ft, _ = compile_lrml(chain, consts_extra={"d"}); ft.facts = fa
    cases.append({"id": name, "drl": encode_lifted(ft, "strat"), "ops": [fact_op(a) for a in fa] + [["fire"]], "out": ["FStrict", "FDef"]})
res = run_cases(cases, mode=mode, quiet=True)
for (name, facts, must, mustnot), r in zip(CH, res):
    got = parse_out(r["snaps"][-1]["facts"]["FDef"]) if not r["err"] else set()
    okc = not r["err"] and all(m in got for m in must) and not any(m in got for m in mustnot)
    bad += not okc
    print(f"  [{'ok' if okc else 'FAIL'}] {name}" + ("" if okc else f"  got={sorted(got)} err={r['err']}"))
print("\nRESULT:", "OK" if bad == 0 else f"{bad} FAILURES")
sys.exit(0 if bad == 0 else 1)

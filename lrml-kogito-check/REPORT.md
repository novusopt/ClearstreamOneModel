# Can LegalRuleML be compiled to Kogito? Measured findings

Date: 2026-11-15. Engine: Apache KIE Drools 10.2.0 and Kogito BOM 10.2.0 on Quarkus 3.27.2, Java 21.
All numbers below come from runs in this folder; raw outputs are in `results/`, commands in `README.md`.

## Answer

**Yes for a restricted subset under four fixed design rules; no as a general "LegalRuleML → Kogito" compiler.**

- With the right compilation scheme, Drools and Kogito gave the same conclusions as the reference in every
  run: 0 differences in about 82,000 engine runs of the two candidate schemes.
- Drools 10.2.0 has a truth-maintenance defect that silently leaves retracted conclusions in place. Schemes
  that share one rule across many literals gave wrong answers in roughly 1 run in 1,000.
- Cyclic rule bases make Drools loop forever or return different conclusions. They must be rejected at
  compile time.
- LegalRuleML does not define what its rules mean. The logic is a choice you make and document, and large
  parts of the standard have no tested mapping here.

Three things this study did **not** establish:

- **Your `encode_full` is still untested.** `dl_experiment.py` was not in the session, so I wrote my own
  reference and encodings from the published proof conditions.
- **No independent oracle.** I downloaded SPINdle 2.2.4 (the published reference reasoner) but running it
  was not permitted in this environment. My reference agrees with a second evaluator, with clingo and with
  18 textbook examples, but all of those are my reading of the same paper.
- **The legal examples were written from my recollection of the AI Act and DORA texts**, not checked
  against EUR-Lex in this session, and have not had legal review.

## The four design rules the results depend on

| # | Rule | What happens without it (measured) |
|---|---|---|
| 1 | No DRL rule may consume its own conclusions: one rule per source rule and per literal or predicate, never a shared meta-rule | 10 wrong answers in 10,000 one-shot runs; 4 to 15 wrong snapshots per 6,600 in sessions |
| 2 | Reject cyclic rule bases before emitting DRL | 62 of 1,500 random cyclic rule bases never terminate; 45 terminate with different conclusions |
| 3 | Input facts get their own type; never insert a fact as the same object a rule can derive | 383 of 4,400 snapshots wrong |
| 4 | Never write source names into DRL strings; map them to generated identifiers | Names with `"`, newline or carriage return fail to build in the executable model; `\uXXXX` escapes fail in the classic parser |

A fifth, recommended: add salience bands per dependency level (the `strat` scheme). Then no conclusion is ever
retracted (0 retractions in 22,500 runs), so correctness no longer depends on the retraction path that
contains the defect.

## What was tested

"Reference" is my implementation of propositional defeasible logic with ambiguity blocking and team defeat
(Antoniou, Billington, Governatori, Maher, ACM TOCL 2001), extended with an explicit conflict relation.
Every Drools result was compared on both the definite (+Δ) and the defeasible (+∂) conclusions.

### Reference and ASP scheme (no Drools)

| Check | Size | Result |
|---|---|---|
| 18 textbook theories, three evaluators, against hand-derived conclusions | 54 | 0 failures |
| Bottom-up evaluator vs top-down evaluator | 50,000 theories | 0 differences |
| ASP scheme in clingo vs reference | 50,000 theories | 0 differences |
| Naive scheme vs reference | 50,000 theories | 31,634 differ |

### Drools, propositional, one-shot

| Scheme | Engine mode | Runs | Differences | Retractions exercised |
|---|---|---|---|---|
| `ground` | classic | 29,997 | 0 | 1,857 (counted in 20,000 of the runs) |
| `strat` | classic | 20,000 | 0 | 0 |
| `antistrat` (worst firing order) | classic | 20,000 | 0 | 128,647 |
| `ground` | executable model | 2,500 | 0 | 245 |
| `strat` | executable model | 2,500 | 0 | 0 |
| `antistrat` | executable model | 2,500 | 0 | 15,765 |
| `interp` (rules as data) | classic | 30,000 | 0 | 24,264 (counted in 20,000 of the runs) |
| `generic` (shared meta-rules) | classic | 10,000 | **10** | not counted |
| `ground` and `strat`, equality mode, shuffled fact order | classic | 3,000 | 0 | 32 |

Five theory families: small and dense, medium, large and sparse, malformed (cyclic superiority, duplicate
rules, contradictory facts), and non-complement conflict sets.

### Drools, other dimensions (classic mode unless stated)

| Check | Size | Result |
|---|---|---|
| Fact order, rule order and random salience permuted, `ground` | 7,500 runs classic, 7,500 executable model | 0 differences |
| Fact order and rule order permuted, `strat` | 4,500 runs classic, 4,500 executable model | 0 differences |
| 28 structural edge cases × 3 schemes, classic | 84 | 0 failures |
| Same, executable model | 84 | **2 build failures**: the case with `"` and newline in names (design rule 4) |
| Nine deliberately wrong compilers plus the naive scheme | 600 theories each | all detected (13 to 329 wrong answers each) |
| Sessions with inserts and deletes between firings, `ground` and `strat` | 6,600 snapshots each | 0 wrong |
| Same, `interp` / `generic` | 6,600 snapshots each | **15 / 4 wrong** |
| Rules with variables, per-predicate rules (`pred`, `strat`, `antistrat`) | 500 theories each | 0 differences |
| Rules with variables, sessions, `pred` | 2,250 snapshots | 0 wrong |
| Rules with variables, shared meta-rules, sessions | 2,250 snapshots | **2 wrong** |
| Recursive predicates with acyclic grounding | 300 theories | 0 differences |
| Size: up to 6,000 rules; chains of depth 3,000; 800 vs 800 team | 8 theories × 3 schemes | same as reference; build up to 14 s, run under 5 s |

### Kogito

A generated Quarkus application with 240 rule units (120 `ground`, 120 `strat`), OOPath patterns and
`DataStore.addLogical`:

| Path | Units | Errors | Differences |
|---|---|---|---|
| Injected `RuleUnit` | 240 | 0 | 0 |
| REST endpoint generated by Kogito from the unit's query | 240 | 0 | 0 |

The truth-maintenance defect reproduces inside a Kogito rule unit as well.

### LegalRuleML end to end

`lrml2dl.py` parses a subset of the compact XML serialisation and emits lifted, stratified DRL.

| Check | Result |
|---|---|
| AI Act Art. 6 rule set, 7 scenarios with hand-written expected conclusions | 7 pass in reference and Drools |
| DORA rule set (Art. 6(1), 16(1), 19(1), 26(1)), 5 scenarios | 5 pass |
| 10 constructs outside the subset | all rejected with a named reason |
| Permission/duty conflict mapping vs explicit conflict relation (Python only) | 0 differences in 20,000 theories; a broken variant differs in 480 of 3,000 |
| Reparation chain (`SuborderList`), synthetic example, 4 scenarios | 4 pass |

## Findings in detail

### 1. Drools truth maintenance leaves stale conclusions

Two rules are enough (`tms_bug_repro.py`):

```
rule "derive" when Fact($x : lit) not Attacked(lit == $x) then insertLogical(new Def($x)); end
rule "chain"  when Def(lit == "a")                        then insertLogical(new Fact("b")); end
```

Insert `Fact(a)`, fire: `Def(a)`, `Fact(b)`, `Def(b)`. Insert `Attacked(a)`, fire: `Def(a)` and `Fact(b)` are
retracted, but **`Def(b)` stays**, with no fact supporting it. A further `fireAllRules()` does not remove it.

- Reproduced in classic mode, executable-model mode, identity and equality modes, and in a Kogito rule unit.
- It needs a retraction cascade that re-enters the rule currently being evaluated through a single-pattern
  rule. Giving `chain` a second pattern makes the result correct.
- `RuleExecutor.evaluateNetwork` in the 10.2.0 source calls the network evaluator and then `setDirty(false)`,
  which is consistent with a re-entrant change being dropped. I did not confirm the cause in a debugger.
- Forcing every rule to re-evaluate did not repair the wrong session snapshots (0 of 11 healed), so there
  is no cheap workaround at run time.
- I did not check whether this is a known issue or fixed on the main branch. It is worth reporting to
  Apache KIE with the two-rule reproduction.

Why the `ground` and `strat` schemes are not affected: every rule is specific to one literal or one source
rule, and the rule base is acyclic, so a cascade can never return to the rule it started in. That is a
structural argument supported by 0 differences under 144,000 forced retractions; it is not a proof about
the engine.

### 2. Cyclic rule bases

| Example | Drools |
|---|---|
| `⇒ p`, `p ⇒ ¬p` | never terminates |
| Three rules attacking each other in a ring | never terminates |
| `⇒ p`, `⇒ q`, `p ⇒ ¬q`, `q ⇒ ¬p` | terminates, concludes `p`; the reference concludes neither |
| `p ⇒ q`, `q ⇒ p` | same as reference |

The cycle check in `dlcore.find_cycle` rejected all 1,507 cyclic theories. With variables, the stratified
scheme additionally requires non-recursive predicates; recursive ones passed 300 one-shot tests without
salience but that is thin evidence.

### 3. Stated and derived facts must not mix

If an input fact is inserted as the same object a rule derives (`Strict(p)` stated, and `a → p` also derives
it), deleting the input loses the derivation: `Strict(p)` disappears although `a` still holds. With a
separate `Fact` type and a rule `Fact(x) → Strict(x)`, 13,200 session snapshots were correct.

### 4. LegalRuleML leaves the logic open

From the spec text (Working Draft 48 of 2017 and the schemas in the OASIS archive; the final 2021 standard
was not reachable from this environment, so wording should be re-checked):

- Conformance is purely syntactic. There is no reasoner conformance, proof theory or model theory.
- Defeasibility is described only as "sceptical"; ambiguity blocking vs propagation and team defeat are not
  mentioned.
- `hasStrength` is optional and no default is given.
- Deontic operator subtypes are explicitly left neutral.

The choice changes legal answers. In the textbook "evidence" example (A says not responsible, B says
responsible, responsible implies guilty, presumption of not guilty), ambiguity blocking concludes "not guilty";
ambiguity propagation concludes nothing. This study tested blocking only.

### 5. What LegalRuleML allows that has no tested mapping here

| Construct | Status |
|---|---|
| `Or` in bodies, disjunctive or existential heads | rejected by the prototype; not tested |
| `Naf` (negation as failure) | rejected; interacts with stratification |
| `Expr`, `Equal`, arithmetic, numeric thresholds | rejected. Needed for real rules such as size thresholds |
| Temporal characteristics (in force, efficacy, dates) | rejected. Needed for staged applicability |
| `Right`, `Violation`, `Compliance` in bodies, `PenaltyStatement`, `ReparationStatement` | rejected |
| Nested deontic operators | rejected |
| `Override` as a rule conclusion (conditional priority) | not handled |
| Strength applied through `Context`/`Association`; `Alternatives` | not handled |
| Atoms with more than two arguments | harness limitation only |

The deontic mapping I used (obligation and prohibition as complementary literals, permission as a
derogation that blocks the opposite duty, reparation chains as extra premises) is a design decision of this
prototype. It was checked for internal consistency, not against Defeasible Deontic Logic or any other
published deontic semantics.

### 6. Kogito specifics

- Kogito 10.2.0 rules are the `org.drools:drools-quarkus-rules` extension under the Kogito BOM.
- `DataStore.addLogical` is documented for rule units and worked, but in 10.2.0 it is declared on the
  implementation interface `ConsequenceDataStore`, not on the public `org.drools.ruleunits.api.DataStore`.
  That is a small API-stability risk.
- I added `org.drools:drools-tms` explicitly and did not test whether it is required.
- Lifted rules (variables) and the LegalRuleML examples were run in plain Drools only, not in Kogito.
- Drools ships its own experimental defeasible belief system in `drools-tms`. Not evaluated.
- Kogito is an Apache incubating project; the artifact names changed between 1.x and 10.x.

### 7. Harness incidents

- 948 build errors ("could not read class") in two runs. Both bursts started when I rebuilt the harness jar
  while a run was using it. The affected set was re-run undisturbed: 0 errors, 0 differences in 4,000.
  The 3 errored cases of the first run are excluded from the count above.
- One encoder bug of mine (JSON-style `\uXXXX` escapes in DRL strings) was found by the edge cases and fixed.
- One mapping error of mine (permitted A and permitted not-A treated as contradictory) was found and fixed
  before the legal scenarios were recorded.

## Simplifications in the legal examples

**AI Act (`legal/aiact_art6.lrml`)**

- Art. 6(3) conditions (a) to (d) and "no significant risk of harm" are one input predicate.
- Art. 6(1) is two input predicates.
- Priority `6(1) > 6(3)` encodes my reading that the derogation is "from paragraph 2" only. This needs
  legal confirmation; it decides the fourth scenario.
- Registration under Art. 49 ignores national registration for critical infrastructure, deployers and timing.
- No dates of application.

**DORA (`legal/dora_ict.lrml`)**

- The Art. 16(1) entity list is one input predicate; "Articles 5 to 15 shall not apply" is modelled only
  against the Art. 6(1) duty.
- Identification for TLPT under Art. 26(8) and the microenterprise definition are input predicates.
- Incident reporting has no thresholds or deadlines.

## Recommended next steps, in order

1. Send me `dl_experiment.py`. Running your `encode_full` through this harness is a small change.
2. Cross-check the reference against SPINdle (`export_spindle.py` writes the theories and expected results;
   the exporter itself is untested).
3. Decide and write down the logic variant, the default strength and the deontic semantics with a lawyer.
4. Design numeric comparisons and temporal validity before committing to the compiler; real AI Act and DORA
   rules need both.
5. Run the lifted scheme inside Kogito rule units, and repeat the whole suite on every Drools upgrade.
6. Report the truth-maintenance defect upstream.

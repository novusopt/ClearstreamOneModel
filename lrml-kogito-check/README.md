# LegalRuleML → Drools/Kogito feasibility check

Everything needed to reproduce the measurements in `REPORT.md`. Read the report first.

## Requirements

- Java 17+ (run with 21), Maven 3.9+, Python 3 with `clingo` (`pip install clingo`)
- Network access to Maven Central (Drools 10.2.0, Kogito BOM 10.2.0, Quarkus 3.27.2)

## Layout

| File | Purpose |
|---|---|
| `dlcore.py` | Defeasible logic: two reference evaluators, cycle check, random theory generators |
| `litex.py` | 18 textbook theories with hand-derived conclusions |
| `encoders.py` | ASP scheme; DRL schemes `ground`, `strat`, `antistrat`, `generic`, `interp`; deliberately wrong mutants |
| `folog.py` | Rules with variables: grounding and lifted DRL (`meta`, `pred`, `strat`, `antistrat`) |
| `lrml2dl.py` | LegalRuleML (subset) → first-order theory; rejects everything outside the subset |
| `legal/*.lrml` | Illustrative AI Act Art. 6 and DORA rule sets |
| `harness/` | Java harness: builds a KieBase from a DRL string, runs a script of inserts/deletes/fires, dumps working memory. It never sees expected values |
| `kogito_gen.py`, `kogito_check.py` | Generate a Kogito (Quarkus) app with one rule unit per theory; compare its output |
| `tms_bug_repro.py` | Two-rule reproduction of the Drools truth-maintenance defect |
| `export_spindle.py` | Export theories for a cross-check with SPINdle (not run here) |
| `results/` | Raw output of the runs quoted in the report |

## Running

```bash
(cd harness && mvn -q -B package -DskipTests)   # once; do NOT rebuild while a test run is in progress

python3 phase0.py 2000            # reference vs second evaluator vs clingo; literature examples
python3 phase1.py 4000 classic ground,strat,antistrat,interp A,B,C,D,E --seed=1
python3 phase1.py 500  exec    ground,strat,antistrat        A,B,C,D,E --seed=2
python3 phase2a.py classic        # literature examples, order independence, structural edge cases
python3 phase2b.py classic        # mutants, cyclic rule bases, incremental sessions, stated/derived mixing
python3 phase3.py 500 classic     # rules with variables
python3 phase4.py classic         # LegalRuleML XML end to end (AI Act, DORA), rejection tests
python3 phase4b.py 20000          # permission/duty mapping vs direct conflict relation (Python only)
python3 phase5.py classic         # size limits
python3 tms_bug_repro.py          # the engine defect, in isolation

python3 kogito_gen.py 240 && (cd kogito-app && mvn -B -q test) && python3 kogito_check.py
```

`DL_THREADS=n` sets the number of harness threads (default 4). `phase1.py` options: `--shuffle`, `--equality`,
`--seed=k`.

## Scheme names

- `ground`: one DRL rule per defeasible rule and per literal; conclusions via `insertLogical`; no salience.
- `strat`: `ground` plus one salience band per dependency level, so a `not` is evaluated only after everything
  it depends on is final. No conclusion is ever retracted.
- `antistrat`: `strat` with the bands inverted. Worst firing order, used only to stress truth maintenance.
- `generic`: per-rule applicability rules plus meta-rules shared by all literals.
- `interp`: one fixed DRL; the rule base is data.

"""Hand-checked textbook theories with the conclusions published for DL(d||)
(ambiguity blocking, team defeat). Expected sets list the +d (defeasibly
provable) literals among the literals named in `ask`; everything else in
`ask` must NOT be +d."""
from dlcore import Rule, Theory, STRICT as S, DEFEASIBLE as D, DEFEATER as X


def T(name, facts, rules, sup=(), conflict=None):
    return Theory(frozenset(facts), [Rule(*r) for r in rules], frozenset(sup), conflict, name)


EXAMPLES = [
    # (theory, ask, expected +d subset of ask, expected +D subset of ask)
    (T("tweety-penguin", ["bird", "penguin"],
       [("r1", D, "flies", ("bird",)), ("r2", D, "-flies", ("penguin",))], [("r2", "r1")]),
     ["flies", "-flies"], ["-flies"], []),
    (T("tweety-no-priority", ["bird", "penguin"],
       [("r1", D, "flies", ("bird",)), ("r2", D, "-flies", ("penguin",))]),
     ["flies", "-flies"], [], []),
    (T("nixon-diamond", ["quaker", "republican"],
       [("r1", D, "pacifist", ("quaker",)), ("r2", D, "-pacifist", ("republican",))]),
     ["pacifist", "-pacifist"], [], []),
    # Ambiguity blocking: pacifist is ambiguous, so r4 is not applicable and
    # -antimilitary goes through. (Under ambiguity propagation it would not.)
    (T("nixon-extended-ambiguity-blocking", ["quaker", "republican"],
       [("r1", D, "pacifist", ("quaker",)), ("r2", D, "-pacifist", ("republican",)),
        ("r3", D, "footballfan", ("republican",)), ("r4", D, "antimilitary", ("pacifist",)),
        ("r5", D, "-antimilitary", ("footballfan",))]),
     ["pacifist", "-pacifist", "antimilitary", "-antimilitary", "footballfan"], ["-antimilitary", "footballfan"], []),
    (T("evidence-guilty-ambiguity-blocking", ["evA", "evB"],
       [("r1", D, "-responsible", ("evA",)), ("r2", D, "responsible", ("evB",)),
        ("r3", D, "guilty", ("responsible",)), ("r4", D, "-guilty", ())]),
     ["responsible", "-responsible", "guilty", "-guilty"], ["-guilty"], []),
    # Team defeat (ABGM 2001, platypus): no single rule beats both attackers.
    (T("platypus-team-defeat", ["monotreme", "hasFur", "laysEggs", "hasBill"],
       [("r1", D, "mammal", ("monotreme",)), ("r2", D, "mammal", ("hasFur",)),
        ("r3", D, "-mammal", ("laysEggs",)), ("r4", D, "-mammal", ("hasBill",))],
       [("r1", "r3"), ("r2", "r4")]),
     ["mammal", "-mammal"], ["mammal"], []),
    (T("platypus-one-attacker-unanswered", ["monotreme", "hasFur", "laysEggs", "hasBill"],
       [("r1", D, "mammal", ("monotreme",)), ("r2", D, "mammal", ("hasFur",)),
        ("r3", D, "-mammal", ("laysEggs",)), ("r4", D, "-mammal", ("hasBill",))],
       [("r1", "r3")]),
     ["mammal", "-mammal"], [], []),
    # Defeater blocks without concluding.
    (T("defeater-blocks", ["bird", "heavy"],
       [("r1", D, "flies", ("bird",)), ("r2", X, "-flies", ("heavy",))]),
     ["flies", "-flies"], [], []),
    (T("defeater-beaten", ["bird", "heavy"],
       [("r1", D, "flies", ("bird",)), ("r2", X, "-flies", ("heavy",))], [("r1", "r2")]),
     ["flies", "-flies"], ["flies"], []),
    # A defeater cannot rescue a conclusion: r3 > r2 but r3 is a defeater.
    (T("defeater-cannot-support-or-beat", ["a"],
       [("r1", D, "p", ("a",)), ("r2", D, "-p", ("a",)), ("r3", X, "p", ("a",))], [("r3", "r2")]),
     ["p", "-p"], [], []),
    # Strict beats defeasible only through definite provability.
    (T("strict-vs-defeasible", ["a"], [("r1", S, "p", ("a",)), ("r2", D, "-p", ("a",))]),
     ["p", "-p"], ["p"], ["p"]),
    # Strict rule with a merely defeasible premise behaves like a defeasible rule.
    (T("strict-rule-defeasible-premise", [],
       [("r0", D, "a", ()), ("r1", S, "p", ("a",)), ("r2", D, "-p", ())]),
     ["a", "p", "-p"], ["a"], []),
    # penguin -> bird strict; bird => flies; penguin => -flies; no priority.
    (T("penguin-strict-bird", ["penguin"],
       [("r0", S, "bird", ("penguin",)), ("r1", D, "flies", ("bird",)), ("r2", D, "-flies", ("penguin",))]),
     ["bird", "flies", "-flies"], ["bird"], ["bird"]),
    # A fact wins against any rule for its complement.
    (T("fact-vs-rule", ["p"], [("r1", D, "-p", ())]), ["p", "-p"], ["p"], ["p"]),
    # Inconsistent facts: both definitely (hence defeasibly) provable.
    (T("inconsistent-facts", ["p", "-p"], []), ["p", "-p"], ["p", "-p"], ["p", "-p"]),
    # Superiority only counts when the superior rule is applicable.
    (T("superior-not-applicable", ["a"],
       [("r1", D, "p", ("a",)), ("r2", D, "-p", ("a",)), ("r3", D, "p", ("b",))], [("r3", "r2")]),
     ["p", "-p"], [], []),
    # Chain: reinstatement does NOT happen in DL (r3 beats r2, but r1 is not
    # reinstated through r3 unless r3 itself supports p... here r3 supports p).
    (T("three-level-exception", ["a", "b", "c"],
       [("r1", D, "p", ("a",)), ("r2", D, "-p", ("b",)), ("r3", D, "p", ("c",))],
       [("r2", "r1"), ("r3", "r2")]),
     ["p", "-p"], ["p"], []),
    (T("three-level-exception-off", ["a", "b"],
       [("r1", D, "p", ("a",)), ("r2", D, "-p", ("b",)), ("r3", D, "p", ("c",))],
       [("r2", "r1"), ("r3", "r2")]),
     ["p", "-p"], ["-p"], []),
]

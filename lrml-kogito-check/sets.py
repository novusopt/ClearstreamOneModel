"""Random theory families used by all phases."""
import random
from dlcore import random_theory, random_conflict_theory

SETS = {
    "A small/dense":   dict(gen="std", n_atoms=(3, 6), n_rules=(4, 14)),
    "B medium":        dict(gen="std", n_atoms=(7, 14), n_rules=(10, 40)),
    "C large/sparse":  dict(gen="std", n_atoms=(20, 50), n_rules=(30, 120)),
    "D malformed >":   dict(gen="std", n_atoms=(3, 8), n_rules=(4, 20), p_sup_cycle=0.3, p_dup_rule=0.2, p_inconsistent_fact=0.3),
    "E conflict sets": dict(gen="conf", n_atoms=(4, 12), n_rules=(6, 30)),
}

def make(rng, spec, name):
    kw = {k: v for k, v in spec.items() if k not in ("gen", "n_atoms", "n_rules")}
    na = rng.randint(*spec["n_atoms"]); nr = rng.randint(*spec["n_rules"])
    if spec["gen"] == "std":
        kinds = rng.choice([(0.2, 0.6, 0.2), (0.4, 0.4, 0.2), (0.05, 0.6, 0.35), (0.0, 1.0, 0.0), (0.6, 0.3, 0.1)])
        return random_theory(rng, na, nr, kinds=kinds, p_fact=rng.choice([0.15, 0.3, 0.6]),
                             p_sup=rng.choice([0.0, 0.3, 0.6, 0.9]), name=name, **kw)
    return random_conflict_theory(rng, na, nr, name=name, **kw)

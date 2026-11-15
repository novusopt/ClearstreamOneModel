"""Helpers shared by the Drools test phases."""
import random, re
from dlcore import Theory
from encoders import (encode_drl_ground, encode_drl_strat, encode_drl_generic, INTERP_DRL, facts_ops, structure_ops, interp_ops)

VARIANTS = ("ground", "generic", "interp")


def setup(th: Theory, variant: str, mutation=None, naive=False):
    """-> (drl, structural ops (never retracted), cache flag)"""
    if variant == "ground":
        return encode_drl_ground(th, mutation=mutation, naive=naive), [], False
    if variant == "strat":
        return encode_drl_strat(th), [], False
    if variant == "antistrat":
        return encode_drl_strat(th, invert=True), [], False
    if variant == "generic":
        return encode_drl_generic(th), structure_ops(th), False
    return INTERP_DRL, interp_ops(th), True


def case(th: Theory, variant: str, cid=None, shuffle=None, mutation=None, naive=False, drl_seed=None, salience=False):
    drl, sops, cache = setup(th, variant, mutation, naive)
    if drl_seed is not None:
        drl = shuffle_drl(drl, drl_seed, salience)
        cache = False
    c = {"id": cid or th.name, "drl": drl, "ops": sops + facts_ops(th) + [["fire"]], "out": ["Strict", "Def"], "cache": cache}
    if shuffle is not None:
        c["shuffle"] = shuffle
    return c


_RULE = re.compile(r'rule ".*?\nend\n\n', re.S)


def shuffle_drl(drl: str, seed: int, salience: bool = False) -> str:
    """Permute the rule blocks (and optionally give each a random salience)."""
    rng = random.Random(seed)
    head = drl[: drl.index("rule ")]
    blocks = _RULE.findall(drl)
    assert "".join(blocks) == drl[len(head):], "rule block split lost text"
    rng.shuffle(blocks)
    if salience:
        blocks = [b.replace("\nwhen\n", f"\nsalience {rng.randint(-50, 50)}\nwhen\n", 1) for b in blocks]
    return head + "".join(blocks)


def check(th, ref, res):
    """-> None if equal, else a short description."""
    if res["err"]:
        return "ERR " + res["err"][:200]
    snap = res["snaps"][-1]
    if snap["limit"]:
        return "LIMIT (no quiescence)"
    S, D = frozenset(snap["facts"]["Strict"]), frozenset(snap["facts"]["Def"])
    if S != ref["+D"]:
        return f"+D differs: {sorted(S ^ ref['+D'])}"
    if D != ref["+d"]:
        return f"+d differs: {sorted(D ^ ref['+d'])}"
    return None

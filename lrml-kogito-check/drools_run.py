"""Thin driver around the Java harness (harness/target)."""
import json, os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
JAR = os.path.join(HERE, "harness", "target", "dl-drools-harness-1.0.jar")
LIB = os.path.join(HERE, "harness", "target", "lib", "*")


def run_cases(cases, mode="classic", equality=False, limit=200000, threads=int(os.environ.get("DL_THREADS", "4")), heap="6g", quiet=False):
    """cases: list of dicts {id, drl, ops, out, [shuffle], [cache]} -> list of result dicts (same order)."""
    with tempfile.TemporaryDirectory() as d:
        fin, fout = os.path.join(d, "in.jsonl"), os.path.join(d, "out.jsonl")
        with open(fin, "w") as f:
            for c in cases:
                f.write(json.dumps(c) + "\n")
        cmd = ["java", f"-Xmx{heap}", "-cp", f"{JAR}:{LIB}", "dl.harness.Harness", "--mode", mode,
               "--limit", str(limit), "--threads", str(threads), "--in", fin, "--out", fout]
        if equality:
            cmd.append("--equality")
        env = dict(os.environ)
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
        if not quiet:
            for line in p.stderr.splitlines():
                if line.startswith("done:"):
                    print("   [harness] " + line)
        if p.returncode != 0:
            raise RuntimeError("harness failed:\n" + p.stderr[-4000:])
        with open(fout) as f:
            res = [json.loads(l) for l in f]
    assert len(res) == len(cases)
    return res


def last_sets(res):
    """(+D, +d) of the final snapshot."""
    snap = res["snaps"][-1]
    return frozenset(snap["facts"].get("Strict", [])), frozenset(snap["facts"].get("Def", []))

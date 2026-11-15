package dl.harness;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.lang.reflect.Constructor;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

import org.drools.model.codegen.ExecutableModelProject;
import org.kie.api.KieBase;
import org.kie.api.KieServices;
import org.kie.api.builder.ReleaseId;
import org.kie.api.conf.EqualityBehaviorOption;
import org.kie.api.io.ResourceType;
import org.kie.api.runtime.KieSession;
import org.kie.api.runtime.rule.FactHandle;
import org.kie.internal.utils.KieHelper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Differential-test harness. It knows nothing about expected results.
 *
 * Input (JSONL), one case per line:
 *   {"id": "...", "drl": "<DRL source>", "out": ["Strict","Def"],
 *    "ops": [["+","Fact","p"], ["fire"], ["-","Fact","p"], ["fire"]], "shuffle": 17}
 * Output (JSONL), same order:
 *   {"id": "...", "snaps": [{"fired": n, "limit": false, "facts": {"Strict": [...], "Def": [...]}}], "err": null}
 *
 * "+" inserts a stated fact dl.model.<Type>(args...); "-" deletes that same handle;
 * "fire" calls fireAllRules(limit) and snapshots working memory.
 * "shuffle": if present, the maximal runs of consecutive "+" ops are permuted with that seed.
 */
public final class Harness {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Map<String, KieBase> KBASES = new ConcurrentHashMap<>();
    private static final AtomicLong SEQ = new AtomicLong();

    private static boolean exec = false;
    private static boolean equality = false;
    private static int limit = 200_000;

    public static void main(String[] args) throws Exception {
        Path in = null, out = null;
        int threads = Runtime.getRuntime().availableProcessors();
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--mode" -> exec = args[++i].equals("exec");
                case "--equality" -> equality = true;
                case "--limit" -> limit = Integer.parseInt(args[++i]);
                case "--threads" -> threads = Integer.parseInt(args[++i]);
                case "--in" -> in = Path.of(args[++i]);
                case "--out" -> out = Path.of(args[++i]);
                default -> throw new IllegalArgumentException(args[i]);
            }
        }
        List<String> lines = new ArrayList<>();
        try (BufferedReader r = Files.newBufferedReader(in, StandardCharsets.UTF_8)) {
            for (String l; (l = r.readLine()) != null; ) {
                if (!l.isBlank()) {
                    lines.add(l);
                }
            }
        }
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        List<Future<String>> futures = new ArrayList<>();
        for (String l : lines) {
            futures.add(pool.submit(() -> runCase(l)));
        }
        long t0 = System.currentTimeMillis();
        try (BufferedWriter w = Files.newBufferedWriter(out, StandardCharsets.UTF_8)) {
            int n = 0;
            for (Future<String> f : futures) {
                w.write(f.get());
                w.newLine();
                if (++n % 1000 == 0) {
                    System.err.printf("  %d/%d cases, %.1fs%n", n, lines.size(), (System.currentTimeMillis() - t0) / 1000.0);
                }
            }
        }
        pool.shutdown();
        System.err.printf("done: %d cases in %.1fs (mode=%s, equality=%s, kbases built=%d)%n", lines.size(),
                (System.currentTimeMillis() - t0) / 1000.0, exec ? "exec" : "classic", equality, SEQ.get());
    }

    private static KieBase build(String drl) {
        KieServices ks = KieServices.Factory.get();
        ReleaseId rid = ks.newReleaseId("dl.gen", "kb" + SEQ.incrementAndGet(), "1.0");
        KieHelper h = new KieHelper().setReleaseId(rid);
        h.addContent(drl, ResourceType.DRL);
        EqualityBehaviorOption eq = equality ? EqualityBehaviorOption.EQUALITY : EqualityBehaviorOption.IDENTITY;
        try {
            return exec ? h.build(ExecutableModelProject.class, eq) : h.build(eq);
        } finally {
            ks.getRepository().removeKieModule(rid);
        }
    }

    private static Object newFact(String type, String[] a) throws Exception {
        Class<?> c = Class.forName("dl.model." + type);
        Class<?>[] sig = new Class<?>[a.length];
        Arrays.fill(sig, String.class);
        Constructor<?> k = c.getConstructor(sig);
        return k.newInstance((Object[]) a);
    }

    private static String runCase(String line) {
        ObjectNode res = JSON.createObjectNode();
        try {
            JsonNode c = JSON.readTree(line);
            res.set("id", c.get("id"));
            String drl = c.get("drl").asText();
            long tb = System.nanoTime();
            KieBase kb = c.path("cache").asBoolean(false) ? KBASES.computeIfAbsent(drl, Harness::build) : build(drl);
            res.put("buildMs", (System.nanoTime() - tb) / 1_000_000);

            Set<String> outTypes = new HashSet<>();
            c.get("out").forEach(n -> outTypes.add(n.asText()));

            List<String[]> ops = new ArrayList<>();
            for (JsonNode op : c.get("ops")) {
                String[] o = new String[op.size()];
                for (int i = 0; i < o.length; i++) {
                    o[i] = op.get(i).asText();
                }
                ops.add(o);
            }
            if (c.hasNonNull("shuffle")) {
                Random rnd = new Random(c.get("shuffle").asLong());
                int i = 0;
                while (i < ops.size()) {
                    int j = i;
                    while (j < ops.size() && ops.get(j)[0].equals("+")) {
                        j++;
                    }
                    if (j > i) {
                        Collections.shuffle(ops.subList(i, j), rnd);
                    }
                    i = Math.max(j, i + 1);
                }
            }

            long tr = System.nanoTime();
            ArrayNode snaps = res.putArray("snaps");
            KieSession s = kb.newKieSession();
            final ArrayNode trace = c.path("trace").asBoolean(false) ? res.putArray("trace") : null;
            if (trace != null) {
                s.addEventListener(new org.kie.api.event.rule.RuleRuntimeEventListener() {
                    private String by(org.kie.api.definition.rule.Rule r) {
                        return r == null ? "" : "  <- " + r.getName();
                    }

                    @Override
                    public void objectInserted(org.kie.api.event.rule.ObjectInsertedEvent e) {
                        trace.add("+ " + e.getObject() + by(e.getRule()));
                    }

                    @Override
                    public void objectUpdated(org.kie.api.event.rule.ObjectUpdatedEvent e) {
                        trace.add("~ " + e.getObject() + by(e.getRule()));
                    }

                    @Override
                    public void objectDeleted(org.kie.api.event.rule.ObjectDeletedEvent e) {
                        trace.add("- " + e.getOldObject() + by(e.getRule()));
                    }
                });
                s.addEventListener(new org.kie.api.event.rule.DefaultAgendaEventListener() {
                    @Override
                    public void beforeMatchFired(org.kie.api.event.rule.BeforeMatchFiredEvent e) {
                        trace.add("FIRE " + e.getMatch().getRule().getName() + " " + e.getMatch().getObjects());
                    }

                    @Override
                    public void matchCancelled(org.kie.api.event.rule.MatchCancelledEvent e) {
                        trace.add("CANCEL " + e.getMatch().getRule().getName() + " " + e.getMatch().getObjects() + " cause=" + e.getCause());
                    }
                });
            }
            final int[] deletes = {0};
            s.addEventListener(new org.kie.api.event.rule.DefaultRuleRuntimeEventListener() {
                @Override
                public void objectDeleted(org.kie.api.event.rule.ObjectDeletedEvent e) {
                    if (e.getRule() != null) {
                        deletes[0]++; // retraction caused by rule execution, i.e. truth maintenance
                    }
                }
            });
            try {
                Map<String, FactHandle> handles = new HashMap<>();
                for (String[] o : ops) {
                    switch (o[0]) {
                        case "+" -> {
                            String key = String.join("\u0001", o);
                            Object f = newFact(o[1], Arrays.copyOfRange(o, 2, o.length));
                            FactHandle fh = s.insert(f);
                            // a second stated insert of an equal object keeps the first handle in equality mode
                            handles.putIfAbsent(key, fh);
                        }
                        case "-" -> {
                            String key = "+" + String.join("\u0001", o).substring(1);
                            FactHandle fh = handles.remove(key);
                            if (fh == null) {
                                throw new IllegalStateException("delete of unknown fact " + Arrays.toString(o));
                            }
                            s.delete(fh);
                        }
                        case "fire" -> {
                            int fired = s.fireAllRules(limit);
                            ObjectNode snap = snaps.addObject();
                            snap.put("fired", fired);
                            snap.put("limit", fired >= limit);
                            snap.put("tmsDeletes", deletes[0]);
                            deletes[0] = 0;
                            Map<String, Set<String>> byType = new TreeMap<>();
                            for (String t : outTypes) {
                                byType.put(t, new TreeSet<>());
                            }
                            for (Object o2 : s.getObjects()) {
                                Set<String> set = byType.get(o2.getClass().getSimpleName());
                                if (set != null) {
                                    String str = o2.toString();
                                    set.add(str.substring(str.indexOf('(') + 1, str.length() - 1));
                                }
                            }
                            ObjectNode facts = snap.putObject("facts");
                            byType.forEach((t, set) -> {
                                ArrayNode arr = facts.putArray(t);
                                set.forEach(arr::add);
                            });
                        }
                        default -> throw new IllegalArgumentException("op " + o[0]);
                    }
                }
            } finally {
                s.dispose();
            }
            res.put("runMs", (System.nanoTime() - tr) / 1_000_000);
            res.putNull("err");
        } catch (Throwable t) {
            StringBuilder sb = new StringBuilder();
            for (Throwable x = t; x != null; x = x.getCause()) {
                sb.append(x).append('\n');
                StackTraceElement[] st = x.getStackTrace();
                for (int i = 0; i < Math.min(6, st.length); i++) {
                    sb.append("    at ").append(st[i]).append('\n');
                }
            }
            String msg = sb.toString();
            res.put("err", msg.length() > 4000 ? msg.substring(0, 4000) : msg);
        }
        return res.toString();
    }
}

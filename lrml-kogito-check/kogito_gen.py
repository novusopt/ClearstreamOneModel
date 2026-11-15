"""Generate a Kogito (Quarkus) application with one rule unit per test theory.

Each unit is the ground scheme (or its stratified variant) written in rule-unit DRL: OOPath patterns over
DataStores and DataStore.addLogical for conclusions. The generated test fires every unit (a) through the
injected RuleUnit and (b) through the REST endpoint Kogito generates for the unit's query, and writes what
it observed to target/kogito-results.json. Expected values never enter the Java side.
"""
import json, os, random, shutil, sys
from dlcore import *
from encoders import levels
from sets import SETS, make

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, "kogito-app")
q = json.dumps

POM = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>dl</groupId>
  <artifactId>dl-kogito-app</artifactId>
  <version>1.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <quarkus.version>3.27.2</quarkus.version>
    <kogito.version>10.2.0</kogito.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-bom</artifactId><version>${quarkus.version}</version><type>pom</type><scope>import</scope></dependency>
      <dependency><groupId>org.kie.kogito</groupId><artifactId>kogito-bom</artifactId><version>${kogito.version}</version><type>pom</type><scope>import</scope></dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency><groupId>org.drools</groupId><artifactId>drools-quarkus-rules</artifactId></dependency>
    <dependency><groupId>org.drools</groupId><artifactId>drools-tms</artifactId><version>${kogito.version}</version></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-rest</artifactId></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-rest-jackson</artifactId></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-junit5</artifactId><scope>test</scope></dependency>
    <dependency><groupId>io.rest-assured</groupId><artifactId>rest-assured</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>io.quarkus</groupId><artifactId>quarkus-maven-plugin</artifactId><version>${quarkus.version}</version>
        <extensions>true</extensions>
        <executions><execution><goals><goal>build</goal><goal>generate-code</goal><goal>generate-code-tests</goal></goals></execution></executions>
      </plugin>
      <plugin>
        <artifactId>maven-surefire-plugin</artifactId><version>3.2.5</version>
        <configuration>
          <argLine>-Xmx4g</argLine>
          <systemPropertyVariables><java.util.logging.manager>org.jboss.logmanager.LogManager</java.util.logging.manager></systemPropertyVariables>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
"""

def pojo(name, fields):
    decl = "".join(f"    private String {f};\n" for f in fields)
    ctor = ", ".join(f"String {f}" for f in fields)
    assign = "".join(f"        this.{f} = {f};\n" for f in fields)
    acc = "".join(f"    public String get{f[0].upper()+f[1:]}() {{\n        return {f};\n    }}\n\n    public void set{f[0].upper()+f[1:]}(String {f}) {{\n        this.{f} = {f};\n    }}\n\n" for f in fields)
    eq = " && ".join(f"java.util.Objects.equals({f}, o.{f})" for f in fields)
    h = ", ".join(fields)
    return f"""package dl.k.model;

public class {name} {{
{decl}
    public {name}() {{
    }}

    public {name}({ctor}) {{
{assign}    }}

{acc}    @Override
    public boolean equals(Object other) {{
        if (!(other instanceof {name})) {{
            return false;
        }}
        {name} o = ({name}) other;
        return {eq};
    }}

    @Override
    public int hashCode() {{
        return java.util.Objects.hash({h});
    }}
}}
"""

MODEL = {"Fact": ["lit"], "Strict": ["lit"], "Def": ["lit"], "App": ["rule", "head", "kind"], "Supported": ["lit"],
         "Attacked": ["lit"], "Beaten": ["rule", "lit"]}
STORES = [("facts", "Fact"), ("definite", "Strict"), ("defeasible", "Def"), ("applicable", "App"),
          ("supported", "Supported"), ("attacked", "Attacked"), ("beaten", "Beaten")]

def unit_java(pkg, cls):
    fields = "".join(f"    private final DataStore<{t}> {n} = DataSource.createStore();\n" for n, t in STORES)
    getters = "".join(f"    public DataStore<{t}> get{n[0].upper()+n[1:]}() {{\n        return {n};\n    }}\n\n" for n, t in STORES)
    return f"""package {pkg};

import dl.k.model.*;
import org.drools.ruleunits.api.DataSource;
import org.drools.ruleunits.api.DataStore;
import org.drools.ruleunits.api.RuleUnitData;

public class {cls} implements RuleUnitData, dl.k.DlUnit {{
{fields}
{getters}}}
"""

def rule(name, pats, action, sal=None):
    s = "" if sal is None else f"salience {sal}\n"
    return f"rule {q(name)}\n{s}when\n" + "".join(f"    {p}\n" for p in pats) + f"then\n    {action}\nend\n\n"

def unit_drl(th, pkg, cls, strat):
    lvl = levels(th) if strat else None
    top = (max(lvl.values(), default=0) + 1) if strat else 0
    band = (lambda l, k: (top - l) * 10 + k) if strat else (lambda l, k: None)
    hi = (top + 2) * 10 if strat else None
    o = [f"package {pkg};\nunit {cls};\nimport dl.k.model.*;\n\n"]
    o.append(rule("fact", ["/facts[ $l : lit ]"], "definite.addLogical(new Strict($l));", hi and hi + 2))
    o.append(rule("strict-to-def", ["/definite[ $l : lit ]"], "defeasible.addLogical(new Def($l));", hi and hi + 1))
    rules = {r.label: r for r in th.rules}
    for r in th.rules:
        if r.kind == STRICT:
            o.append(rule(f"S:{r.label}", [f"/definite[ lit == {q(b)} ]" for b in r.body], f"definite.addLogical(new Strict({q(r.head)}));", hi and hi + 2))
        rl = (1 + max((lvl[b] for b in r.body), default=-1)) if strat else 0
        o.append(rule(f"A:{r.label}", [f"/defeasible[ lit == {q(b)} ]" for b in r.body],
                      f"applicable.addLogical(new App({q(r.label)}, {q(r.head)}, {q(r.kind)}));", band(rl, 4)))
        if r.kind != DEFEATER:
            o.append(rule(f"U:{r.label}", [f"/applicable[ rule == {q(r.label)} ]"], f"supported.addLogical(new Supported({q(r.head)}));",
                          band(lvl[r.head], 3) if strat else None))
    for a, b in sorted(th.sup):
        if a in rules and b in rules:
            t, s = rules[a], rules[b]
            if t.kind != DEFEATER and s.head in th.C(t.head):
                o.append(rule(f"B:{t.label}>{s.label}", [f"/applicable[ rule == {q(t.label)} ]"],
                              f"beaten.addLogical(new Beaten({q(s.label)}, {q(t.head)}));", band(lvl[t.head], 3) if strat else None))
    for lt in th.literals():
        cq = sorted(th.C(lt))
        for c in cq:
            for s in th.rules:
                if s.head == c:
                    o.append(rule(f"T:{s.label}@{lt}", [f"/applicable[ rule == {q(s.label)} ]", f"not( /beaten[ rule == {q(s.label)}, lit == {q(lt)} ] )"],
                                  f"attacked.addLogical(new Attacked({q(lt)}));", band(lvl[lt], 2) if strat else None))
        pats = [f"/supported[ lit == {q(lt)} ]"] + [f"not( /definite[ lit == {q(c)} ] )" for c in cq] + [f"not( /attacked[ lit == {q(lt)} ] )"]
        o.append(rule(f"D:{lt}", pats, f"defeasible.addLogical(new Def({q(lt)}));", band(lvl[lt], 1) if strat else None))
    o.append(f"query \"AllDef{cls}\"\n    $d : /defeasible\nend\n\nquery \"AllStrict{cls}\"\n    $s : /definite\nend\n")
    return "".join(o)

BUG_DRL = """package dl.k.bug;
unit BugUnit;
import dl.k.model.*;

rule "derive"
when
    /facts[ $x : lit ]
    not( /attacked[ lit == $x ] )
then
    defeasible.addLogical(new Def($x));
end

rule "chain"
when
    /defeasible[ lit == "a" ]
then
    facts.addLogical(new Fact("b"));
end

query "AllDefBugUnit"
    $d : /defeasible
end
"""

def main(n):
    if os.path.exists(APP):
        shutil.rmtree(APP)
    j = os.path.join(APP, "src/main/java"); r = os.path.join(APP, "src/main/resources"); t = os.path.join(APP, "src/test/java/dl/k")
    os.makedirs(os.path.join(j, "dl/k/model")); os.makedirs(t)
    open(os.path.join(APP, "pom.xml"), "w").write(POM)
    for name, fields in MODEL.items():
        open(os.path.join(j, "dl/k/model", name + ".java"), "w").write(pojo(name, fields))
    getters = "".join(f"    org.drools.ruleunits.api.DataStore<dl.k.model.{t_}> get{n_[0].upper()+n_[1:]}();\n" for n_, t_ in STORES)
    open(os.path.join(j, "dl/k/DlUnit.java"), "w").write(f"package dl.k;\n\npublic interface DlUnit {{\n{getters}}}\n")
    rng = random.Random(2024)
    cases = []
    keys = ["A small/dense", "B medium", "D malformed >", "E conflict sets"]
    for i in range(n):
        th = make(rng, SETS[keys[i % 4]], f"K{i}")
        cls, pkg = f"U{i}", f"dl.k.t{i}"
        strat = i % 2 == 1
        os.makedirs(os.path.join(j, "dl/k", f"t{i}")); os.makedirs(os.path.join(r, "dl/k", f"t{i}"))
        open(os.path.join(j, "dl/k", f"t{i}", cls + ".java"), "w").write(unit_java(pkg, cls))
        open(os.path.join(r, "dl/k", f"t{i}", "rules.drl"), "w").write(unit_drl(th, pkg, cls, strat))
        ref = ref_fixpoint(th)
        cases.append({"i": i, "theory": th.to_json(), "strat": strat, "expD": sorted(ref["+D"]), "expd": sorted(ref["+d"])})
    os.makedirs(os.path.join(j, "dl/k/bug")); os.makedirs(os.path.join(r, "dl/k/bug"))
    open(os.path.join(j, "dl/k/bug/BugUnit.java"), "w").write(unit_java("dl.k.bug", "BugUnit"))
    open(os.path.join(r, "dl/k/bug/rules.drl"), "w").write(BUG_DRL)
    json.dump(cases, open(os.path.join(APP, "cases.json"), "w"))
    # the Java test only gets the input facts
    json.dump([{"i": c["i"], "facts": c["theory"]["facts"]} for c in cases], open(os.path.join(APP, "inputs.json"), "w"))
    inj = "".join(f"    @Inject RuleUnit<dl.k.t{i}.U{i}> u{i};\n" for i in range(n))
    calls = "".join(f"            case {i} -> direct(u{i}, new dl.k.t{i}.U{i}(), \"U{i}\", facts);\n" for i in range(n))
    open(os.path.join(t, "AllUnitsTest.java"), "w").write(f"""package dl.k;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dl.k.model.*;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.drools.ruleunits.api.DataHandle;
import org.drools.ruleunits.api.RuleUnit;
import org.drools.ruleunits.api.RuleUnitData;
import org.drools.ruleunits.api.RuleUnitInstance;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class AllUnitsTest {{
{inj}    @Inject RuleUnit<dl.k.bug.BugUnit> bug;

    private static final ObjectMapper JSON = new ObjectMapper();

    private static TreeSet<String> lits(RuleUnitInstance<?> inst, String query, Class<?> type) {{
        TreeSet<String> out = new TreeSet<>();
        for (Map<String, Object> row : inst.executeQuery(query).toList()) {{
            for (Object o : row.values()) {{
                if (o instanceof Def d) {{
                    out.add(d.getLit());
                }} else if (o instanceof Strict s) {{
                    out.add(s.getLit());
                }}
            }}
        }}
        return out;
    }}

    private static <T extends RuleUnitData & DlUnit> ObjectNode direct(RuleUnit<T> unit, T data, String cls, List<String> facts) {{
        ObjectNode n = JSON.createObjectNode();
        for (String f : facts) {{
            data.getFacts().add(new Fact(f));
        }}
        try (RuleUnitInstance<T> inst = unit.createInstance(data)) {{
            inst.fire();
            ArrayNode d = n.putArray("def");
            lits(inst, "AllDef" + cls, Def.class).forEach(d::add);
            ArrayNode s = n.putArray("strict");
            lits(inst, "AllStrict" + cls, Strict.class).forEach(s::add);
        }}
        return n;
    }}

    private ObjectNode run(int i, List<String> facts) {{
        return switch (i) {{
{calls}            default -> throw new IllegalArgumentException();
        }};
    }}

    @Test
    public void runAll() throws Exception {{
        JsonNode inputs = JSON.readTree(new File("inputs.json"));
        ArrayNode results = JSON.createArrayNode();
        for (JsonNode c : inputs) {{
            int i = c.get("i").asInt();
            List<String> facts = new ArrayList<>();
            c.get("facts").forEach(f -> facts.add(f.asText()));
            ObjectNode res = JSON.createObjectNode();
            res.put("i", i);
            try {{
                res.set("direct", run(i, facts));
            }} catch (Throwable t) {{
                res.put("directErr", t.toString());
            }}
            try {{
                // the REST endpoint Kogito generates from the unit's query
                ObjectNode body = JSON.createObjectNode();
                ArrayNode fs = body.putArray("facts");
                facts.forEach(f -> fs.addObject().put("lit", f));
                String json = RestAssured.given().contentType(ContentType.JSON).body(body.toString())
                        .post("/all-def-u" + i).then().statusCode(200).extract().asString();
                TreeSet<String> got = new TreeSet<>();
                JSON.readTree(json).forEach(x -> got.add(x.get("lit").asText()));
                ArrayNode arr = res.putArray("rest");
                got.forEach(arr::add);
            }} catch (Throwable t) {{
                res.put("restErr", t.toString());
            }}
            results.add(res);
        }}
        // the two-rule truth-maintenance reproduction, as a rule unit
        ObjectNode b = JSON.createObjectNode();
        dl.k.bug.BugUnit data = new dl.k.bug.BugUnit();
        data.getFacts().add(new Fact("a"));
        try (RuleUnitInstance<dl.k.bug.BugUnit> inst = bug.createInstance(data)) {{
            inst.fire();
            ArrayNode a1 = b.putArray("afterFire1");
            lits(inst, "AllDefBugUnit", Def.class).forEach(a1::add);
            data.getAttacked().add(new Attacked("a"));
            inst.fire();
            ArrayNode a2 = b.putArray("afterFire2");
            lits(inst, "AllDefBugUnit", Def.class).forEach(a2::add);
        }} catch (Throwable t) {{
            b.put("err", t.toString());
        }}
        ObjectNode out = JSON.createObjectNode();
        out.set("units", results);
        out.set("bug", b);
        JSON.writeValue(new File("target/kogito-results.json"), out);
    }}
}}
""")
    print(f"generated {n} rule units in {APP}")

if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 40)

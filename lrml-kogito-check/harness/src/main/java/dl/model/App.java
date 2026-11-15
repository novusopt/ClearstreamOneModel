package dl.model;

public final class App extends Tuple {
    public App(String rule, String head, String kind) {
        super(rule, head, kind);
    }

    public String getRule() {
        return f[0];
    }

    public String getHead() {
        return f[1];
    }

    public String getKind() {
        return f[2];
    }
}

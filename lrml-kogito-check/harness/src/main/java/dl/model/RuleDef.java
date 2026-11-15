package dl.model;

public final class RuleDef extends Tuple {
    public RuleDef(String label, String kind, String head) {
        super(label, kind, head);
    }

    public String getLabel() {
        return f[0];
    }

    public String getKind() {
        return f[1];
    }

    public String getHead() {
        return f[2];
    }
}

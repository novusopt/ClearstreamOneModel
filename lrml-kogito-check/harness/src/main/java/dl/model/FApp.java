package dl.model;

public final class FApp extends Tuple {
    public FApp(String rule, String kind, String sign, String pred, String a1, String a2) {
        super(rule, kind, sign, pred, a1, a2);
    }

    public String getRule() {
        return f[0];
    }

    public String getKind() {
        return f[1];
    }

    public String getSign() {
        return f[2];
    }

    public String getPred() {
        return f[3];
    }

    public String getA1() {
        return f[4];
    }

    public String getA2() {
        return f[5];
    }
}

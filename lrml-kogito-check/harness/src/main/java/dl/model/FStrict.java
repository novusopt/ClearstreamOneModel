package dl.model;

public final class FStrict extends Tuple {
    public FStrict(String sign, String pred, String a1, String a2) {
        super(sign, pred, a1, a2);
    }

    public String getSign() {
        return f[0];
    }

    public String getPred() {
        return f[1];
    }

    public String getA1() {
        return f[2];
    }

    public String getA2() {
        return f[3];
    }
}

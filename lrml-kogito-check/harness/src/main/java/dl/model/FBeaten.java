package dl.model;

public final class FBeaten extends Tuple {
    public FBeaten(String rule, String sign, String pred, String a1, String a2) {
        super(rule, sign, pred, a1, a2);
    }

    public String getRule() {
        return f[0];
    }

    public String getSign() {
        return f[1];
    }

    public String getPred() {
        return f[2];
    }

    public String getA1() {
        return f[3];
    }

    public String getA2() {
        return f[4];
    }
}

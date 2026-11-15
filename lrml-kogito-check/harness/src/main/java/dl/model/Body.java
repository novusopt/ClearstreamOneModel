package dl.model;

public final class Body extends Tuple {
    public Body(String rule, String lit) {
        super(rule, lit);
    }

    public String getRule() {
        return f[0];
    }

    public String getLit() {
        return f[1];
    }
}

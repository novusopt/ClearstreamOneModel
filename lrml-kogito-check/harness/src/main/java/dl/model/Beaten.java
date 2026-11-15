package dl.model;

public final class Beaten extends Tuple {
    public Beaten(String rule, String lit) {
        super(rule, lit);
    }

    public String getRule() {
        return f[0];
    }

    public String getLit() {
        return f[1];
    }
}

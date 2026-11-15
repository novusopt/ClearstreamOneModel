package dl.model;

public final class Conflict extends Tuple {
    public Conflict(String a, String b) {
        super(a, b);
    }

    public String getA() {
        return f[0];
    }

    public String getB() {
        return f[1];
    }
}

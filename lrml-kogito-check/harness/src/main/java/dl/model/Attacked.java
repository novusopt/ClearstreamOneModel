package dl.model;

public final class Attacked extends Tuple {
    public Attacked(String lit) {
        super(lit);
    }

    public String getLit() {
        return f[0];
    }
}

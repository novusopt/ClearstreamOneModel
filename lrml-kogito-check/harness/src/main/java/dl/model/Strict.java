package dl.model;

public final class Strict extends Tuple {
    public Strict(String lit) {
        super(lit);
    }

    public String getLit() {
        return f[0];
    }
}

package dl.model;

public final class Supported extends Tuple {
    public Supported(String lit) {
        super(lit);
    }

    public String getLit() {
        return f[0];
    }
}

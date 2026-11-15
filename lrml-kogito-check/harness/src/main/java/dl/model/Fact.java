package dl.model;

public final class Fact extends Tuple {
    public Fact(String lit) {
        super(lit);
    }

    public String getLit() {
        return f[0];
    }
}

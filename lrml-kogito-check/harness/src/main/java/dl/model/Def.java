package dl.model;

public final class Def extends Tuple {
    public Def(String lit) {
        super(lit);
    }

    public String getLit() {
        return f[0];
    }
}

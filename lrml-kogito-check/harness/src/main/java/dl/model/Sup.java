package dl.model;

public final class Sup extends Tuple {
    public Sup(String hi, String lo) {
        super(hi, lo);
    }

    public String getHi() {
        return f[0];
    }

    public String getLo() {
        return f[1];
    }
}

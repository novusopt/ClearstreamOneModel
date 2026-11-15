package dl.model;

import java.util.Arrays;

/** Value-equal base for all working-memory fact types (insertLogical needs equals/hashCode). */
public abstract class Tuple {
    protected final String[] f;

    protected Tuple(String... f) {
        this.f = f;
    }

    @Override
    public final boolean equals(Object o) {
        return o != null && o.getClass() == getClass() && Arrays.equals(f, ((Tuple) o).f);
    }

    @Override
    public final int hashCode() {
        return getClass().hashCode() * 31 + Arrays.hashCode(f);
    }

    @Override
    public final String toString() {
        return getClass().getSimpleName() + "(" + String.join(",", f) + ")";
    }
}

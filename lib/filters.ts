import type { Car } from "./schemas";
import { SORT_OPTIONS, type SortValue } from "./constants";

export type FilterState = {
  q: string;
  make: string | null;
  bodyType: string | null;
  fuel: string | null;
  transmission: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  sort: SortValue;
};

export const EMPTY_FILTERS: FilterState = {
  q: "",
  make: null,
  bodyType: null,
  fuel: null,
  transmission: null,
  minPrice: null,
  maxPrice: null,
  minYear: null,
  maxYear: null,
  sort: "newest",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | null {
  const s = first(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseSearchParams(sp: RawParams): FilterState {
  const sort = first(sp.sort);
  const validSort = SORT_OPTIONS.some((o) => o.value === sort);
  return {
    q: first(sp.q) ?? "",
    make: first(sp.make) ?? null,
    bodyType: first(sp.bodyType) ?? null,
    fuel: first(sp.fuel) ?? null,
    transmission: first(sp.transmission) ?? null,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minYear: num(sp.minYear),
    maxYear: num(sp.maxYear),
    sort: (validSort ? (sort as SortValue) : "newest"),
  };
}

export function stateToSearchParams(state: Partial<FilterState>): URLSearchParams {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.make) p.set("make", state.make);
  if (state.bodyType) p.set("bodyType", state.bodyType);
  if (state.fuel) p.set("fuel", state.fuel);
  if (state.transmission) p.set("transmission", state.transmission);
  if (state.minPrice != null) p.set("minPrice", String(state.minPrice));
  if (state.maxPrice != null) p.set("maxPrice", String(state.maxPrice));
  if (state.minYear != null) p.set("minYear", String(state.minYear));
  if (state.maxYear != null) p.set("maxYear", String(state.maxYear));
  if (state.sort && state.sort !== "newest") p.set("sort", state.sort);
  return p;
}

export function applyFilters(cars: readonly Car[], f: FilterState): Car[] {
  const q = f.q.trim().toLowerCase();
  const filtered = cars.filter((c) => {
    if (q) {
      const hay = `${c.make} ${c.model} ${c.year} ${c.color} ${c.bodyType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.make && c.make !== f.make) return false;
    if (f.bodyType && c.bodyType !== f.bodyType) return false;
    if (f.fuel && c.fuelType !== f.fuel) return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.minPrice != null && c.price < f.minPrice) return false;
    if (f.maxPrice != null && c.price > f.maxPrice) return false;
    if (f.minYear != null && c.year < f.minYear) return false;
    if (f.maxYear != null && c.year > f.maxYear) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (f.sort) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "year-desc":
      sorted.sort((a, b) => b.year - a.year);
      break;
    case "mileage-asc":
      sorted.sort((a, b) => a.mileage - b.mileage);
      break;
    case "newest":
    default:
      sorted.sort((a, b) => +new Date(b.listedAt) - +new Date(a.listedAt));
  }
  return sorted;
}

export function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.q) n++;
  if (f.make) n++;
  if (f.bodyType) n++;
  if (f.fuel) n++;
  if (f.transmission) n++;
  if (f.minPrice != null) n++;
  if (f.maxPrice != null) n++;
  if (f.minYear != null) n++;
  if (f.maxYear != null) n++;
  return n;
}

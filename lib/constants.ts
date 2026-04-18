import { bodyTypes, fuelTypes, transmissions } from "./schemas";

export const BODY_TYPES = bodyTypes;
export const FUEL_TYPES = fuelTypes;
export const TRANSMISSIONS = transmissions;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest listings" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "year-desc", label: "Year: newest first" },
  { value: "mileage-asc", label: "Mileage: low to high" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PRICE_BOUNDS = { min: 0, max: 120_000, step: 1_000 };
export const YEAR_BOUNDS = { min: 2015, max: new Date().getFullYear() };

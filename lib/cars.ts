import data from "@/data/cars.json";
import { carSchema, type Car } from "./schemas";

// Validate once at module load so broken data fails loudly in dev/build.
const parsed = (data as unknown[]).map((c) => carSchema.parse(c));

export const cars: readonly Car[] = Object.freeze(parsed);

export function getCars(): readonly Car[] {
  return cars;
}

export function getCarById(id: string): Car | undefined {
  return cars.find((c) => c.id === id);
}

export function getFeaturedCars(limit = 4): Car[] {
  return [...cars]
    .sort((a, b) => +new Date(b.listedAt) - +new Date(a.listedAt))
    .slice(0, limit);
}

export function getSimilarCars(car: Car, limit = 3): Car[] {
  return cars
    .filter((c) => c.id !== car.id && c.bodyType === car.bodyType)
    .slice(0, limit);
}

export function getMakes(): string[] {
  return Array.from(new Set(cars.map((c) => c.make))).sort();
}

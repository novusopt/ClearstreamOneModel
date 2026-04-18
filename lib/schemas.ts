import { z } from "zod";

export const bodyTypes = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Hatchback",
  "EV",
] as const;

export const fuelTypes = [
  "Gasoline",
  "Diesel",
  "Hybrid",
  "Electric",
] as const;

export const transmissions = ["Automatic", "Manual"] as const;
export const sellerTypes = ["Dealer", "Private"] as const;

export const carSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  price: z.number().int().nonnegative(),
  mileage: z.number().int().nonnegative(),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissions),
  bodyType: z.enum(bodyTypes),
  color: z.string(),
  images: z.array(z.string().url()).min(1),
  location: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  sellerName: z.string(),
  sellerType: z.enum(sellerTypes),
  listedAt: z.string(),
});

export type Car = z.infer<typeof carSchema>;

export const inquirySchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[\d\s()+\-]{7,}$/.test(v),
      "Enter a valid phone number",
    ),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

export type InquiryForm = z.infer<typeof inquirySchema>;

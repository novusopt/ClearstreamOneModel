import type { Metadata } from "next";
import { HomePage, homeMetadata } from "@/components/home/home-page";

export const metadata: Metadata = homeMetadata("en");

export default function Home() {
  return <HomePage lang="en" />;
}

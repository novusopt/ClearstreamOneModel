import { navigate } from "../router";

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => undefined,
  prefetch: () => undefined,
};

export const useRouter = () => router;
export const usePathname = () => "/";
export function notFound(): never {
  navigate("/");
  throw new Error("not found");
}

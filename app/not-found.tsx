import { Button } from "@/components/base/buttons/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pt-24 text-center">
      <p lang="ar" className="font-quran text-6xl text-brand-secondary">٤٠٤</p>
      <h1 className="mt-4 text-display-xs font-semibold text-primary">Page not found</h1>
      <p className="mt-2 text-tertiary">That page doesn’t exist. Try one of the 114 surahs instead.</p>
      <Button className="mt-8" href="/">
        Back home
      </Button>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 bg-dots px-6 text-center">
      <p className="font-mono text-xs tracking-[0.08em] text-tertiary uppercase">Not found</p>
      <h1 className="font-display text-display-sm font-semibold text-primary">There is nothing at this address</h1>
      <p className="max-w-md text-md text-tertiary">The product may have been renamed, or the sample data was restored.</p>
      <Link href="/products" className="mt-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white outline-offset-2 outline-brand hover:bg-brand-solid_hover focus-visible:outline-2">
        Back to products
      </Link>
    </div>
  );
}

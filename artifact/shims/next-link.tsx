import { type AnchorHTMLAttributes, forwardRef, type MouseEvent } from "react";
import { navigate, pathToHash } from "../router";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** Drop-in for next/link that routes through the hash router. */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, onClick, ...props }, ref) {
  const internal = href.startsWith("/") || href.startsWith("#");
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !internal || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return <a ref={ref} href={internal ? pathToHash(href) : href} onClick={handle} {...props} />;
});

export default Link;

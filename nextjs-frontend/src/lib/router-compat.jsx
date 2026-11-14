"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Compatibility layer used by the components ported from the Vite app.
 * It exposes the React Router API the app already uses (`to`, `useNavigate`,
 * `NavLink` render props) on top of Next.js App Router navigation.
 */

export function Link({ to, href, state: _state, ...props }) {
  return <NextLink href={to ?? href ?? "/"} {...props} />;
}

export function NavLink({ to, end = false, className, children, ...props }) {
  const pathname = usePathname();
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <NextLink
      href={to}
      className={
        typeof className === "function" ? className({ isActive }) : className
      }
      {...props}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </NextLink>
  );
}

export function Navigate({ to, replace = false, state: _state }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);

  return null;
}

export function useNavigate() {
  const router = useRouter();

  return (to, options = {}) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: "", hash: "", state: null };
}

export function useSearchParams() {
  return new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
}

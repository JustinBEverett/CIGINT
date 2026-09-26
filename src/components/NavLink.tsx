"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof Link> & { href: string };

// A Link that marks itself aria-current="page" on its own route (or a
// sub-route), so callers can style or hide the current page with the
// aria-[current=page]: variant. "/" only matches exactly, or it would be
// current everywhere.
export default function NavLink({ href, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const isCurrent =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link href={href} aria-current={isCurrent ? "page" : undefined} {...props} />
  );
}

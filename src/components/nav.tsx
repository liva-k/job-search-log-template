"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

const LINKS = [
  { href: "/", label: "Jobs" },
  { href: "/tracker", label: "Tracker" },
  { href: "/companies", label: "Companies" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-xs tracking-wide uppercase"
          >
            Job Search Log
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-xs tracking-wide uppercase transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}

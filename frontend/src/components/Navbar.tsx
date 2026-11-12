"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { menuNav, primaryNav } from "@/lib/nav";

const linkBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-earth-300";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-void-900/80 backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4"
      >
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 rounded-lg px-2 py-1 text-base font-semibold tracking-tight text-white transition-colors hover:text-earth-300"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-earth-400 to-earth-700 text-sm"
          >
            ♫
          </span>
          EarthSight2Sound
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`${linkBase} ${
                pathname === link.href ? "text-earth-300" : "text-white/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="main-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-10 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden="true" className="relative block h-4 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-transform ${
                open ? "top-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute top-1/2 left-0 block h-0.5 w-5 -translate-y-1/2 rounded bg-current transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-transform ${
                open ? "top-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        id="main-menu"
        hidden={!open}
        className="border-t border-white/10 bg-void-800/95 backdrop-blur-xl"
      >
        <ul className="mx-auto grid w-full max-w-6xl gap-1 px-4 py-3 sm:grid-cols-2">
          {menuNav.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-earth-300 ${
                  pathname === link.href ? "text-earth-300" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

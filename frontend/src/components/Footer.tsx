import Link from "next/link";
import { footerNav } from "@/lib/nav";

// Evaluated once at module load, so prerendered pages never read the clock
// during render (Next.js rejects that as a blocking prerender).
const COPYRIGHT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-void-900/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">
          © {COPYRIGHT_YEAR} EarthSight2Sound · NASA 2026 Hackathon
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {footerNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-earth-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

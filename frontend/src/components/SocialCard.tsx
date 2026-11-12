import type { SocialLinks } from "@es2s/shared";
import { socialLabels, socialPlatforms } from "@/lib/social";

const icons: Record<keyof SocialLinks, string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.23 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 3.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8Zm0 2.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm6.6-2.6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z",
  facebook:
    "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.6V13h2.7v8h3.2Z",
  discord:
    "M19.3 5.4A16 16 0 0 0 15.4 4l-.2.4a12 12 0 0 1 3.4 1.7 11.4 11.4 0 0 0-9.2 0A12 12 0 0 1 12.8 4.4L12.6 4a16 16 0 0 0-3.9 1.4C6.2 9 5.5 12.5 5.8 16a16 16 0 0 0 4.8 2.4l.6-1a10 10 0 0 1-1.7-.8l.4-.3a11.4 11.4 0 0 0 9.8 0l.4.3a10 10 0 0 1-1.7.8l.6 1A16 16 0 0 0 23.8 16c.4-4-.7-7.5-4.5-10.6ZM9.7 14.2c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm4.6 0c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z",
  snapchat:
    "M12 2.5c2.6 0 4.4 1.9 4.4 4.5 0 .8-.1 1.6-.1 2.2.4.2.9.2 1.3.1.5-.1 1 .2 1.1.7.1.5-.2 1-.7 1.1-.5.2-1.2.4-1.6.6.3.9 1.1 1.9 2.2 2.5.4.2.5.7.2 1-.6.7-1.6 1-2.4 1.1-.2.5-.3 1-.7 1.1-.5.2-1.2 0-1.9-.1-.6-.1-1.2-.1-1.8.2-.7.4-1.4.9-2.3.9s-1.6-.5-2.3-.9c-.6-.3-1.2-.3-1.8-.2-.7.1-1.4.3-1.9.1-.4-.1-.5-.6-.7-1.1-.8-.1-1.8-.4-2.4-1.1-.3-.3-.2-.8.2-1 1.1-.6 1.9-1.6 2.2-2.5-.4-.2-1.1-.4-1.6-.6-.5-.1-.8-.6-.7-1.1.1-.5.6-.8 1.1-.7.4.1.9.1 1.3-.1 0-.6-.1-1.4-.1-2.2 0-2.6 1.8-4.5 4.4-4.5Z",
};

type SocialCardProps = {
  socials: SocialLinks;
};

export function SocialCard({ socials }: SocialCardProps) {
  return (
    <ul className="flex items-center gap-2">
      {socialPlatforms.map((platform) => {
        const href = socials[platform];
        const label = socialLabels[platform];

        if (!href) {
          return (
            <li key={platform}>
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-lg bg-white/5 text-white/25"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current">
                  <path d={icons[platform]} />
                </svg>
              </span>
            </li>
          );
        }

        return (
          <li key={platform}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="grid size-9 place-items-center rounded-lg bg-white/5 text-white/70 transition-colors hover:bg-earth-600 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4 fill-current"
              >
                <path d={icons[platform]} />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

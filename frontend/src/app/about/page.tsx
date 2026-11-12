import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "About",
  description: "What EarthSight2Sound is and how it works.",
};

export default function AboutPage() {
  return (
    <LegalPage
      title="About"
      intro="EarthSight2Sound turns satellite imagery of Earth into short soundscapes."
    >
      <p>
        Upload an image of our planet, describe what you see, and the pipeline
        resizes it, reads its structure, and renders a 20–30 second WAV. The
        result is published to a public feed so anyone can listen.
      </p>
      <p>
        The project was built for the NASA 2026 Hackathon under the theme
        &ldquo;Earth Jukebox&rdquo;. It is a demonstration of how Earth
        observation data can be made audible rather than only visible.
      </p>
      <p>
        Everything runs on a small, boring stack: Next.js for the interface,
        Hono on Bun for the API, MariaDB for metadata, and Cloudflare R2 for
        images and audio.
      </p>
    </LegalPage>
  );
}

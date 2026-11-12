import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookies",
  description: "How EarthSight2Sound uses cookies.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      intro="This site does not use tracking cookies."
    >
      <p>
        EarthSight2Sound sets no advertising or analytics cookies. There is no
        third-party tracking script on any page.
      </p>
      <p>
        The framework may store a small amount of technical data in your browser
        to keep the interface working, for example to remember that a page was
        already loaded. This data never leaves your device.
      </p>
      <p>
        Your volume and mute preferences live in memory for the duration of your
        visit and are not persisted.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How EarthSight2Sound handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect as little as possible."
    >
      <p>
        There are no accounts and no sign-in. We do not ask for your name, your
        email address, or any other personal identifier.
      </p>
      <p>
        When you upload an image we store the resized image, the generated
        audio, and the description you typed. All three are published publicly
        on the feed.
      </p>
      <p>
        Server logs may record the time of a request and the response status.
        They are used only for debugging and are not shared with third parties.
      </p>
      <p>
        Images and audio are stored on Cloudflare R2. To have content removed,
        contact the team through the contact page.
      </p>
    </LegalPage>
  );
}

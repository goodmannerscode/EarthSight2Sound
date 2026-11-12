import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with EarthSight2Sound.",
};

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      intro="Something not working? Here is what to check first."
    >
      <div>
        <h2 className="mb-1 font-semibold text-white">The upload is rejected</h2>
        <p>
          Images must be PNG, JPEG or WebP and no larger than 10 MB. Very large
          dimensions are also rejected to protect the server.
        </p>
      </div>
      <div>
        <h2 className="mb-1 font-semibold text-white">
          The song never appears
        </h2>
        <p>
          Sonification usually takes a few seconds. If the job fails, the error
          is shown on the upload page. Try again with a smaller image.
        </p>
      </div>
      <div>
        <h2 className="mb-1 font-semibold text-white">Audio does not play</h2>
        <p>
          Browsers block autoplay until you interact with the page. Press play
          on a card, and check that the volume bar is not at zero.
        </p>
      </div>
      <p>
        Still stuck? Reach the team on the{" "}
        <Link href="/contact" className="text-earth-300 underline">
          contact page
        </Link>
        .
      </p>
    </LegalPage>
  );
}

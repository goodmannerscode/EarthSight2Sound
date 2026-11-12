import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for EarthSight2Sound.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="By using EarthSight2Sound you agree to the terms below."
    >
      <p>
        EarthSight2Sound is a demonstration project built for the NASA 2026
        Hackathon. It is provided as-is, without warranty of any kind, and may
        be taken offline at any time.
      </p>
      <p>
        You may only upload images you have the right to use. Do not upload
        personal data, confidential material, or content that is unlawful.
      </p>
      <p>
        Uploaded images and generated audio are published publicly on the feed.
        Do not upload anything you are not comfortable making public.
      </p>
      <p>
        We may remove any content and restrict access at our discretion, in
        particular to keep the service available for everyone.
      </p>
    </LegalPage>
  );
}

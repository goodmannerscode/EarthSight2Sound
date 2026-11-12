import type { Metadata } from "next";
import { UploadCard } from "@/components/UploadCard";

export const metadata: Metadata = {
  title: "Upload",
  description:
    "Upload a satellite image of Earth and turn it into a soundscape.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <section aria-labelledby="upload-heading" className="flex flex-col gap-4">
        <div>
          <h1
            id="upload-heading"
            className="text-2xl font-semibold tracking-tight text-white"
          >
            Sonify an image
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Pick a satellite image, describe it, and we will turn it into a
            20–30 second soundscape.
          </p>
        </div>
        <UploadCard />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { CollaboratorCard } from "@/components/CollaboratorCard";
import { team } from "@/lib/team";

export const metadata: Metadata = {
  title: "Contact",
  description: "The team behind EarthSight2Sound.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section
        aria-labelledby="collaborators-heading"
        className="flex flex-col gap-4"
      >
        <div>
          <h1
            id="collaborators-heading"
            className="text-2xl font-semibold tracking-tight text-white"
          >
            Collaborators
          </h1>
          <p className="mt-1 text-sm text-white/60">
            The people turning Earth observation data into sound.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {team.map((member) => (
            <li key={member.id}>
              <CollaboratorCard member={member} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

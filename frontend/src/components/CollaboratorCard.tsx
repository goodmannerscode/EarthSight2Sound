import Image from "next/image";
import type { TeamMember } from "@es2s/shared";
import { SocialCard } from "@/components/SocialCard";

export function CollaboratorCard({ member }: { member: TeamMember }) {
  return (
    <article className="glass flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-void-700">
        <Image
          src={member.imageUrl}
          alt={member.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-base font-semibold text-white">{member.name}</h2>
          <p className="text-xs uppercase tracking-wide text-earth-300">
            {member.role}
          </p>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-white/70">
          {member.bio}
        </p>
        <SocialCard socials={member.socials} />
      </div>
    </article>
  );
}

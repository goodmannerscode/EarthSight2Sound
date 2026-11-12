import { TeamSchema, type Team } from "@es2s/shared";

const rawTeam = [
  {
    id: "ada",
    name: "Ada Lovelace",
    role: "Sonification Engineer",
    bio: "Maps satellite imagery onto harmonic structures so that every coastline has its own voice.",
    imageUrl: "https://picsum.photos/seed/team-ada/800/600",
    socials: {
      instagram: "https://instagram.com/",
      youtube: "https://youtube.com/",
    },
  },
  {
    id: "grace",
    name: "Grace Hopper",
    role: "Backend Lead",
    bio: "Keeps the pipeline honest: head before get, put before insert, cleanup on every throw.",
    imageUrl: "https://picsum.photos/seed/team-grace/800/600",
    socials: {
      facebook: "https://facebook.com/",
      discord: "https://discord.com/",
    },
  },
  {
    id: "katherine",
    name: "Katherine Johnson",
    role: "Data & Imagery",
    bio: "Verifies every orbit and every pixel before it is allowed anywhere near the sonifier.",
    imageUrl: "https://picsum.photos/seed/team-katherine/800/600",
    socials: {
      youtube: "https://youtube.com/",
      snapchat: "https://snapchat.com/",
    },
  },
  {
    id: "margaret",
    name: "Margaret Hamilton",
    role: "Frontend & UX",
    bio: "Builds the interface that makes a 30 second soundscape feel like standing on the shoreline.",
    imageUrl: "https://picsum.photos/seed/team-margaret/800/600",
    socials: {
      instagram: "https://instagram.com/",
      discord: "https://discord.com/",
    },
  },
];

export const team: Team = TeamSchema.parse(rawTeam);

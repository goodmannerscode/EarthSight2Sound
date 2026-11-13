import { TeamSchema, type Team } from "@es2s/shared";

const rawTeam = [
  {
    id: "ada",
    name: "Ana Maria",
    role: "Sonification Engineer",
    bio: "Maps satellite imagery onto harmonic structures so that every coastline has its own voice.",
    imageUrl: "https://i.pravatar.cc/300?u=user-42",
    socials: {
      instagram: "https://instagram.com/",
      youtube: "https://youtube.com/",
    },
  },
  {
    id: "grace",
    name: "Alexandru Pitton",
    role: "Backend Lead",
    bio: "Keeps the pipeline honest: head before get, put before insert, cleanup on every throw.",
    imageUrl: "https://i.pravatar.cc/300?u=user-36",
    socials: {
      instagram: "https://www.instagram.com/TerraKode",
      discord: "https://discord.gg/bh9duTN9Yz",      
    },
  },
  {
    id: "katherine",
    name: "Ioana",
    role: "Data & Imagery",
    bio: "Verifies every orbit and every pixel before it is allowed anywhere near the sonifier.",
    imageUrl: "https://i.pravatar.cc/300?u=user-41",
    socials: {
      youtube: "https://youtube.com/",
      snapchat: "https://snapchat.com/",
    },
  },
  {
    id: "margaret",
    name: "Claudia",
    role: "Frontend & UX",
    bio: "Builds the interface that makes a 30 second soundscape feel like standing on the shoreline.",
    imageUrl: "https://i.pravatar.cc/300?u=user-38",
    socials: {
      instagram: "https://instagram.com/",
      discord: "https://discord.com/",
    },
  },
];

export const team: Team = TeamSchema.parse(rawTeam);

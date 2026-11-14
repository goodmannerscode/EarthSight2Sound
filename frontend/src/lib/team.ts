import { TeamSchema, type Team } from "@es2s/shared";

const rawTeam = [
  {
    id: "ada",
    name: "Ana Maria",
    role: "Sonification Engineer",
    bio: "Maps satellite imagery onto harmonic structures so that every coastline has its own voice.",
    imageUrl: "/team/anamaria.webp",
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
    imageUrl: "/team/alex.webp",
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
    imageUrl: "/team/ioana.webp",
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
    imageUrl: "/team/claudia.webp",
    socials: {
      instagram: "https://instagram.com/",
      discord: "https://discord.com/",
    },
  },
];

export const team: Team = TeamSchema.parse(rawTeam);

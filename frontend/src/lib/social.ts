import type { SocialLinks } from "@es2s/shared";

export type SocialPlatform = keyof SocialLinks;

export const socialPlatforms: readonly SocialPlatform[] = [
  "instagram",
  "facebook",
  "discord",
  "youtube",
  "snapchat",
];

export const socialLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  discord: "Discord",
  youtube: "YouTube",
  snapchat: "Snapchat",
};

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "ECE Paris Grades",
  description:
    "Easy solution to compute your grades average extracted from ECE Paris website using the tampermonkey script.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/BragdonD/ECE-Scripts",
    docs: "https://ui.shadcn.com",
  },
}

export interface NavLink {
  label: string;
  href: string;
}

export const primaryNavLinks: NavLink[] = [
  { label: "Explore", href: "#explore" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Businesses", href: "#business" },
  { label: "Become a provider", href: "#business" },
];

export const footerNav = {
  product: [
    { label: "Explore", href: "#explore" },
    { label: "Categories", href: "#categories" },
    { label: "How it works", href: "#how-it-works" },
    { label: "AI assistant", href: "#ai-assistant" },
  ] as NavLink[],
  providers: [
    { label: "Become a provider", href: "#business" },
    { label: "Business portal", href: "#business" },
    { label: "Resources", href: "#business" },
  ] as NavLink[],
  company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ] as NavLink[],
};

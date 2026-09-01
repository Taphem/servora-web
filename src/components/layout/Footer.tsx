import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Logo } from "@/components/ui/Logo";
import { footerNav } from "@/data/nav";

const footerColumns = [
  { title: "Product", links: footerNav.product },
  { title: "For providers", links: footerNav.providers },
  { title: "Company", links: footerNav.company },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-ink-950 text-ink-300">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-4 lg:col-span-4">
            <Logo variant="inverse" />
            <p className="max-w-xs text-sm leading-relaxed text-ink-400">
              Find trusted local professionals, compare your options, and
              book in minutes.
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="col-span-1 flex flex-col gap-3 sm:col-span-2 lg:col-span-2 lg:col-start-auto"
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14">
          <Divider className="border-white/10" />
          <p className="mt-8 text-sm text-ink-500">
            &copy; {new Date().getFullYear()} Servora. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}

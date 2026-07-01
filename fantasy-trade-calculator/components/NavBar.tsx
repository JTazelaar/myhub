import Link from "next/link";

const LINKS = [
  { href: "/calculator", label: "Calculator" },
  { href: "/vote", label: "Vote" },
  { href: "/admin", label: "Admin" },
];

export function NavBar() {
  return (
    <div className="sticky top-0 z-50 px-4 pt-4 pb-2">
      <nav className="glass mx-auto flex max-w-2xl items-center gap-1 overflow-x-auto rounded-full px-3 py-2">
        <Link
          href="/"
          className="mr-auto shrink-0 rounded-full px-2 py-1 text-sm font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          🏈 <span className="ml-0.5">FTC</span>
        </Link>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

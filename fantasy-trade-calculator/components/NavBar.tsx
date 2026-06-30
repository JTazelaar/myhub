import Link from "next/link";
const LINKS = [{ href: "/", label: "Home" }, { href: "/calculator", label: "Calculator" }, { href: "/vote", label: "Vote" }, { href: "/admin", label: "Admin" }];
export function NavBar() {
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-2xl items-center gap-5 overflow-x-auto px-4 py-3 text-sm font-medium">
        {LINKS.map((link) => (<Link key={link.href} href={link.href} className="whitespace-nowrap text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">{link.label}</Link>))}
      </div>
    </nav>
  );
}

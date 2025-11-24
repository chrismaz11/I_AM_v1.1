import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { authOptions } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/credentials", label: "Credentials" },
  { href: "/institution/dashboard", label: "Institution" },
  { href: "/audit", label: "Audit log" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-[#f7f8fb]">
      <aside className="hidden md:flex w-64 flex-col gap-6 border-r border-ink-200 bg-white px-6 py-8 shadow-soft/30">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">I AM</p>
          <h1 className="text-2xl font-semibold text-ink-900">Wallet</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-200/60 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 text-sm text-ink-500">
          <p className="font-medium text-ink-700">{session.user.name ?? session.user.email}</p>
          <p className="text-xs rounded-full bg-ink-200/60 px-3 py-1 inline-block">
            {session.user.role ?? "member"}
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-ink-200 bg-white">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Signed in</p>
            <p className="font-semibold text-ink-900">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline rounded-full bg-ink-200/60 px-3 py-1 text-sm font-medium text-ink-700">
              {session.user.role ?? "member"}
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

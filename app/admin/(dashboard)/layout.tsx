import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "@/app/admin/actions";
import { Monogram } from "@/components/Monogram";

export const metadata = { title: "Admin · Baby Shaker Registry" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-cream">
      <header className="pinstripe bg-navy text-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Monogram size={30} className="text-brass" />
            <span className="eyebrow">Registry admin</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/"
              target="_blank"
              className="eyebrow text-cream/70 transition-colors hover:text-cream"
            >
              View site
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="eyebrow text-cream/70 transition-colors hover:text-brass"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}

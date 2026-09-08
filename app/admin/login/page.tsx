import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { Monogram } from "@/components/Monogram";

export const metadata = { title: "Admin · Baby Shaker Registry" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="pinstripe flex min-h-dvh items-center justify-center bg-navy px-5 text-cream">
      <div className="w-full max-w-sm rounded-sm border border-brass/40 bg-navy-deep/60 px-8 py-10 text-center shadow-card">
        <Monogram size={44} className="text-brass" />
        <p className="eyebrow mt-5 text-brass">Registry admin</p>
        <h1 className="mt-2 font-display text-3xl font-medium">Welcome back</h1>
        <LoginForm />
      </div>
    </main>
  );
}

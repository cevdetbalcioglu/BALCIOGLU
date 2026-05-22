// app/dashboard/layout.js
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { db } from "@/lib/db";
import { getUserMenus } from "@/lib/menu";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  // Kullanıcı rolünü çek
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = dbUser?.role || "USER";

  // DB'den yetkili menüleri çek
  const menus = await getUserMenus(session.user.id, role);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-lg">CB</span>
            </Link>

            {/* Dinamik Menüler */}
            <div className="hidden sm:flex items-center gap-1">
              {menus.map(menu => (
                <Link
                  key={menu.id}
                  href={menu.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {menu.icon && <span className="text-base leading-none">{menu.icon}</span>}
                  {menu.label}
                </Link>
              ))}
            </div>

            {/* Kullanıcı */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard/profile" className="hidden sm:block text-right group">
                <p className="text-sm font-medium text-slate-800 group-hover:text-blue-500 transition-colors">
                  {session.user.name || "Kullanıcı"}
                </p>
                <p className="text-xs text-slate-500">{session.user.email}</p>
              </Link>
              <Link
                href="/dashboard/profile"
                title="Hesap Ayarları"
                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm hover:bg-blue-200 hover:ring-2 hover:ring-blue-300 transition-all"
              >
                {(session.user.name || session.user.email || "U")[0].toUpperCase()}
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

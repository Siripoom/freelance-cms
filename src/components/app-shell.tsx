"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, BriefcaseBusiness, CreditCard, FileText, LayoutDashboard, ListTodo, LogOut, Settings, Users, Workflow } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { initLocale, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

const nav = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/customers", key: "customers", icon: Users },
  { href: "/pipeline", key: "pipeline", icon: Workflow },
  { href: "/projects", key: "projects", icon: BriefcaseBusiness },
  { href: "/payments", key: "payments", icon: CreditCard },
  { href: "/followups", key: "followups", icon: ListTodo },
  { href: "/documents", key: "documents", icon: FileText },
  { href: "/reports", key: "reports", icon: BarChart3 },
  { href: "/settings", key: "settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    initLocale();
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-blue-100 bg-white">
        <div className="flex h-16 items-center border-b border-blue-100 px-5">
          <div>
            <div className="text-lg font-semibold tracking-tight text-primary">Freelance CRM</div>
            <div className="max-w-[210px] truncate text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-blue-100 bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="text-sm font-semibold text-slate-800">{t(nav.find((item) => item.href === pathname)?.key ?? "dashboard")}</div>
          <Button variant="ghost" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

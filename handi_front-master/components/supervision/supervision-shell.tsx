"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { PageHeader } from "@/components/ui/layout";
import type { ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function SupervisionShell({
  badge,
  title,
  description,
  children,
  actions,
}: {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const navItems = [
    { href: "/admin/supervision", label: t("supervision.nav.dashboard") },
    { href: "/admin/supervision/pipeline", label: t("supervision.nav.pipeline") },
    { href: "/admin/supervision/reports", label: t("supervision.nav.reports") },
    { href: "/admin/supervision/offers", label: t("supervision.nav.offers") },
    { href: "/admin/supervision/candidates", label: t("supervision.nav.candidates") },
    { href: "/admin/supervision/export", label: t("supervision.nav.export") },
  ];

  return (
    <div className="stack-lg">
      <PageHeader badge={badge} title={title} description={description} actions={actions} />

      <nav className="flex flex-wrap gap-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classes("nav-chip", active && "nav-chip-active")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

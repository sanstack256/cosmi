"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Search,
  Building2,
  BarChart3,
} from "lucide-react";

import UserMenu from "@/app/components/UserMenu";
import RequireAuth from "@/app/components/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#070B14] text-white flex overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className="
            hidden md:flex flex-col items-center
            w-[92px] shrink-0
            py-6 px-3
            bg-white/[0.02]
            border-r border-white/[0.06]
            backdrop-blur-2xl
          "
        >
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div
              className="
                h-12 w-12 rounded-2xl
                bg-white/[0.04]
                border border-white/[0.08]
                flex items-center justify-center
                shadow-[0_0_30px_rgba(139,92,246,0.08)]
              "
            >
              <span className="text-sm font-semibold tracking-wide text-violet-100">
                C
              </span>
            </div>

            <div className="text-[11px] tracking-[0.24em] uppercase text-slate-500">
              Cosmi
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col items-center gap-2 w-full">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-[18px] w-[18px]" />}
              active={pathname === "/dashboard"}
              label="Overview"
            />

            <SidebarItem
              href="/dashboard/invoices"
              icon={<FileText className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/invoices")}
              label="Invoices"
            />

            <SidebarItem
              href="/dashboard/clients"
              icon={<Users className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/clients")}
              label="Clients"
            />

            <SidebarItem
              href="/dashboard/analytics"
              icon={<BarChart3 className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/analytics")}
              label="Analytics"
            />

            <SidebarItem
              href="/dashboard/company"
              icon={<Building2 className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/company")}
              label="Company"
            />

            <SidebarItem
              href="/dashboard/settings"
              icon={<Settings className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/settings")}
              label="Settings"
            />
          </nav>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* CONTEXT BAR */}
          <header
            className="
              sticky top-0 z-40
              h-[84px]
              px-8 md:px-10
              flex items-center justify-between
              bg-[#070B14]/80
              backdrop-blur-2xl
              border-b border-white/[0.05]
            "
          >
            {/* Left */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Workspace
              </span>

              <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">
                Good evening, Sanjeev
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button
                className="
                  h-11 w-11 rounded-2xl
                  bg-white/[0.03]
                  border border-white/[0.06]
                  flex items-center justify-center
                  text-slate-400
                  transition-all duration-200
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >
                <Search className="h-[17px] w-[17px]" />
              </button>

              <button
                className="
                  relative
                  h-11 w-11 rounded-2xl
                  bg-white/[0.03]
                  border border-white/[0.06]
                  flex items-center justify-center
                  text-slate-400
                  transition-all duration-200
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >
                <Bell className="h-[17px] w-[17px]" />

                <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-violet-400" />
              </button>

              <div
                className="
                  h-11 px-2 rounded-2xl
                  bg-white/[0.03]
                  border border-white/[0.06]
                  flex items-center
                "
              >
                <UserMenu />
              </div>
            </div>
          </header>

          {/* CONTENT AREA */}
          <section className="flex-1 px-8 md:px-10 py-10">
            {children}
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

/* Sidebar Item */

function SidebarItem({
  icon,
  href,
  active,
  label,
}: {
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`
        group relative
        h-12 w-12 rounded-2xl
        flex items-center justify-center
        transition-all duration-200
        border
        ${
          active
            ? "bg-white/[0.06] border-white/[0.10] text-violet-100 shadow-[0_0_30px_rgba(139,92,246,0.10)]"
            : "bg-transparent border-transparent text-slate-500 hover:bg-white/[0.03] hover:border-white/[0.06] hover:text-slate-200"
        }
      `}
    >
      {icon}

      {/* Tooltip */}
      <div
        className="
          pointer-events-none absolute left-[72px]
          px-3 py-1.5 rounded-xl
          bg-[#111827]
          border border-white/[0.08]
          text-[11px] text-slate-300
          opacity-0 translate-x-2
          transition-all duration-200
          whitespace-nowrap
          group-hover:opacity-100
          group-hover:translate-x-0
        "
      >
        {label}
      </div>
    </Link>
  );
}



"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Search,
  Building2,
} from "lucide-react";

import UserMenu from "@/app/components/UserMenu";
import RequireAuth from "@/app/components/RequireAuth";
import { useAuth } from "../providers/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { plan } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <RequireAuth>
      <div className="relative min-h-screen bg-[#040407] text-slate-100 flex overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 blur-[200px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[200px] pointer-events-none" />

        {/* SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col relative backdrop-blur-xl
          bg-gradient-to-b from-[#0b0b18] via-[#0d0d1f] to-black
          border-r border-violet-500/10
          transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Collapse line glow */}
          <div
            className="absolute right-0 top-0 h-full w-[2px]
            bg-gradient-to-b from-violet-500/40 via-violet-300/20 to-transparent
            shadow-[0_0_15px_rgba(139,92,246,0.45)] z-50"
          />

          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            {sidebarCollapsed ? (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-10 w-10 rounded-full bg-black/40 border border-violet-500/18 flex items-center justify-center text-violet-300 hover:bg-black/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 to-fuchsia-600 font-bold text-white">
                    C
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Cosmi</div>
                    <div className="text-xs text-slate-400">
                      AI Invoice Dashboard
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-10 w-10 rounded-full bg-black/40 border border-violet-500/18 flex items-center justify-center text-violet-300 hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="mt-3 w-full h-[2px] bg-gradient-to-r from-violet-500/40 via-violet-300/20 to-transparent" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              active={pathname === "/dashboard"}
              collapsed={sidebarCollapsed}
            >
              Overview
            </SidebarItem>

            <SidebarItem
              href="/dashboard/invoices"
              icon={<FileText className="h-4 w-4" />}
              active={pathname?.startsWith("/dashboard/invoices")}
              collapsed={sidebarCollapsed}
            >
              Invoices
            </SidebarItem>

            <SidebarItem
              href="/dashboard/clients"
              icon={<Users className="h-4 w-4" />}
              active={pathname?.startsWith("/dashboard/clients")}
              collapsed={sidebarCollapsed}
            >
              Clients
            </SidebarItem>

            <SidebarItem
              href="/dashboard/settings"
              icon={<Settings className="h-4 w-4" />}
              active={pathname?.startsWith("/dashboard/settings")}
              collapsed={sidebarCollapsed}
            >
              Settings
            </SidebarItem>

            <SidebarItem
              href="/dashboard/company"
              icon={<Building2 className="h-4 w-4" />}
              active={pathname?.startsWith("/dashboard/company")}
              collapsed={sidebarCollapsed}
            >
              Company
            </SidebarItem>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col">
          {/* TOP BAR */}
          <header className="relative px-6 md:px-5 py-3 flex items-center gap-4
          bg-gradient-to-r from-[#0b0b18] via-[#0d0d1f] to-black
          border-b border-violet-500/10
          backdrop-blur-xl z-50">
            <div className="absolute bottom-0 left-0 w-full h-[2px]
              bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-transparent"
            />

            <div>
              <h1 className="text-lg md:text-xl font-semibold">
                {getPageTitle(pathname)}
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                {plan === "free"
                  ? "Free plan"
                  : "Pro plan"}
              </p>
            </div>

            <div className="flex-1" />

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Search..."
                  className="bg-slate-950/80 border border-white/12 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none"
                />
              </div>

              <button className="relative rounded-xl p-2 bg-slate-950/80 border border-white/12">
                <Bell className="h-4 w-4" />
              </button>

              <UserMenu />
            </div>
          </header>

          {/* PAGE CONTENT */}
          <section className="flex-1 px-6 md:px-10 py-8 space-y-8">
            {children}
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

/* Sidebar Item */

function SidebarItem({
  children,
  icon,
  href,
  active,
  collapsed,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Link
        href={href}
        className={`w-full flex items-center justify-center py-3 rounded-xl text-xs ${
          active
            ? "bg-violet-500/14 text-violet-100"
            : "text-slate-300 hover:bg-white/5"
        }`}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
        active
          ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/40 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/* Dynamic Title */

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/invoices")) return "Invoices";
  if (pathname.startsWith("/dashboard/clients")) return "Clients";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/dashboard/company")) return "Company";
  return "Dashboard";
}
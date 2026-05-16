"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import UserMenu from "@/app/components/UserMenu";
import { useAuth } from "@/app/providers/AuthProvider";
import RequireAuth from "@/app/components/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);


  const pathname = usePathname();
  const { user } = useAuth();

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";


  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#070B14] text-white flex overflow-hidden">
        {/* SIDEBAR */}
        <aside
          onClick={() => {
            if (!sidebarExpanded) {
              setSidebarExpanded(true);
            }
          }}
          className={`
            group/sidebar
  hidden md:flex flex-col
  shrink-0
  py-6 px-3
  bg-white/[0.02]
  border-r border-white/[0.05]
  backdrop-blur-2xl
  transition-all duration-300 ease-out
  ${sidebarExpanded ? "w-[240px]" : "w-[92px]"}
`}
        >
          {/* Logo */}
          <div
            className={`
    mb-10 flex items-center
    min-h-[48px]
    transition-all duration-300
    ${sidebarExpanded ? "justify-between px-2" : "justify-center"}
  `}
          >
            <div
              className={`
    relative flex items-center transition-all duration-300
    ${sidebarExpanded ? "w-full justify-between" : "w-12 justify-center"}
  `}
            >


              {/* Ruby Logo */}
              <div
                className={`
  flex items-center justify-center
  transition-all duration-300
  z-10
  ${sidebarExpanded
                    ? "relative opacity-100"
                    : "absolute inset-0 opacity-100 group-hover/sidebar:opacity-0"
                  }
`}
              >
                <div
                  className="
        h-12 w-12 rounded-2xl
        bg-white/[0.03]
        border border-white/[0.06]
        flex items-center justify-center
        overflow-hidden
        shadow-[0_0_24px_rgba(139,92,246,0.06)]
      "
                >
                  <Image
                    src="/android-chrome-192x192.png"
                    alt="Cosmi"
                    width={34}
                    height={34}
                    priority
                    className="select-none"
                  />
                </div>

                <div
                  className={`
    overflow-hidden transition-all duration-300
    ${sidebarExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0"}
  `}
                >
                  <div className="text-sm font-medium tracking-[-0.02em] text-white whitespace-nowrap">
                    Cosmi
                  </div>

                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    Business OS
                  </div>
                </div>
              </div>

              {/* Toggle Button */}
              <div
                className={`
  transition-all duration-300
  ${sidebarExpanded
                    ? "flex items-center justify-center"
                    : "absolute inset-0 flex items-center justify-center opacity-0 group-hover/sidebar:opacity-100"
                  }
`}
              >
                <button
                  onClick={() => setSidebarExpanded((prev) => !prev)}
                  className="
          h-12 w-12 rounded-2xl
          flex items-center justify-center
          bg-white/[0.03]
          border border-white/[0.06]
          text-slate-400
          transition-all duration-200
          hover:bg-white/[0.05]
          hover:text-white
        "
                >
                  {sidebarExpanded ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelLeftOpen className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

          </div>


          {/* Navigation */}
          <nav
            className={`
    flex flex-col gap-2
    w-full
    items-center
    ${sidebarExpanded ? "items-stretch" : "items-center"}
  `}
          >
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-[18px] w-[18px]" />}
              active={pathname === "/dashboard"}
              label="Overview"
              expanded={sidebarExpanded}
            />

            <SidebarItem
              href="/dashboard/invoices"
              icon={<FileText className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/invoices")}
              label="Invoices"
              expanded={sidebarExpanded}
            />

            <SidebarItem
              href="/dashboard/clients"
              icon={<Users className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/clients")}
              label="Clients"
              expanded={sidebarExpanded}
            />

            <SidebarItem
              href="/dashboard/analytics"
              icon={<BarChart3 className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/analytics")}
              label="Analytics"
              expanded={sidebarExpanded}
            />

            <SidebarItem
              href="/dashboard/company"
              icon={<Building2 className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/company")}
              label="Company"
              expanded={sidebarExpanded}
            />

            <SidebarItem
              href="/dashboard/settings"
              icon={<Settings className="h-[18px] w-[18px]" />}
              active={pathname.startsWith("/dashboard/settings")}
              label="Settings"
              expanded={sidebarExpanded}
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

              <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                {greeting}
                {user?.displayName ? `, ${user.displayName}` : ""}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Here’s what’s happening across your workspace today.
              </p>


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
      </div >
    </RequireAuth >
  );
}

/* Sidebar Item */

function SidebarItem({
  icon,
  href,
  active,
  label,
  expanded,
}: {

  icon: React.ReactNode;
  href: string;
  active?: boolean;
  label: string;
  expanded: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
  group relative
  h-12 rounded-2xl
  flex items-center
  overflow-hidden
  border
  transition-[width,padding,gap,background-color,border-color,color] duration-300
  ${expanded
          ? "w-full px-4 gap-3 justify-start"
          : "w-12 justify-center"
        }
  ${active
          ? "bg-white/[0.06] border-white/[0.10] text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.08)]"
          : "bg-transparent border-transparent text-slate-500 hover:bg-white/[0.03] hover:border-white/[0.06] hover:text-slate-200"
        }
`}
    >
      {icon}

      <div
        className={`
transition-[width,padding,gap,background-color,border-color,color] duration-300
    whitespace-nowrap
    text-sm
    overflow-hidden
    ${expanded
            ? "opacity-100 max-w-[160px] ml-1"
            : "opacity-0 max-w-0 ml-0"
          }
  `}
      >
        {label}
      </div>

    </Link>
  );
}



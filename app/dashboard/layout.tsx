"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, FileText, Users } from "lucide-react";
import SidebarItem from "@/components/SidebarItem";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050509] text-white">
      {/* SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col relative backdrop-blur-xl
bg-gradient-to-b from-[#0b0b18] via-[#0d0d1f] to-black
border-r border-violet-500/10
transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}

        >
          <div
            className="absolute right-0 top-0 h-full w-[2px]
          bg-gradient-to-b from-violet-500/40 via-violet-300/20 to-transparent
          shadow-[0_0_15px_rgba(139,92,246,0.45)] z-50"
          />

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
                  <div className={`${cardBase} p-6`}
                  >
                    C
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Cosmi</div>
                    <div className="text-xs text-slate-400">AI Invoice Dashboard</div>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-10 w-10 rounded-full bg-black/40 border border-violet-500/18 
             flex items-center justify-center text-violet-300 hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

              </div>
            )}

            <div className="mt-3 w-full h-[2px] bg-gradient-to-r from-violet-500/40 via-violet-300/20 to-transparent" />
          </div>

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
              href="/clients"
              icon={<Users className="h-4 w-4" />}
              active={pathname?.startsWith("/clients")}
              collapsed={sidebarCollapsed}
            >
              Clients
            </SidebarItem>

            <SidebarItem
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              active={pathname?.startsWith("/settings")}
              collapsed={sidebarCollapsed}
            >
              Settings
            </SidebarItem>

            <SidebarItem
              href="/company"
              icon={<Building2 className="h-4 w-4" />}
              active={pathname?.startsWith("/company")}
              collapsed={sidebarCollapsed}
            >
              Company
            </SidebarItem>

          </nav>
        </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
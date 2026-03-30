"use client";

import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6 text-white">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>

        <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition">
          AI Review
        </button>
      </div>

      {/* ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400 mb-2">
            Revenue Trend
          </div>
          <div className="h-[260px] flex items-center justify-center text-slate-500">
            Chart coming soon
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400 mb-2">
            Status Breakdown
          </div>
          <div className="h-[260px] flex items-center justify-center text-slate-500">
            Chart coming soon
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Clients */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400 mb-2">
            Top Clients
          </div>
          <div className="h-[220px] flex items-center justify-center text-slate-500">
            Chart coming soon
          </div>
        </div>

        {/* Payment Delay */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400 mb-2">
            Payment Delay Distribution
          </div>
          <div className="h-[220px] flex items-center justify-center text-slate-500">
            Chart coming soon
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-slate-400 mb-4">
          Client Behavior
        </div>

        <div className="h-[260px] flex items-center justify-center text-slate-500">
          Table coming soon
        </div>
      </div>

    </div>
  );
}
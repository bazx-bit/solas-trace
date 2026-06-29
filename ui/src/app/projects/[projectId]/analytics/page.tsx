"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertOctagon,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn, formatDuration, formatCost } from "@/lib/utils";

// Recharts components imports
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [dateRange, setDateRange] = useState("7d");
  const [loading, setLoading] = useState(false);

  // Mock workspace / project data
  const workspaces = [{ id: "ws_default", name: "Default Swarm", slug: "default" }];
  const projects = [
    { id: projectId || "proj_solas", name: "Weather Swarm Engine", color: "#f97316" }
  ];

  // Mock analytics history matching ClickHouse's pre-aggregations structure
  const latencyData = [
    { name: "Mon", p50: 840, p95: 1450, p99: 2100 },
    { name: "Tue", p50: 920, p95: 1610, p99: 2400 },
    { name: "Wed", p50: 790, p95: 1320, p99: 1950 },
    { name: "Thu", p50: 1100, p95: 2200, p99: 3100 },
    { name: "Fri", p50: 880, p95: 1540, p99: 2250 },
    { name: "Sat", p50: 640, p95: 1100, p99: 1600 },
    { name: "Sun", p50: 710, p95: 1250, p99: 1800 },
  ];

  const tokenCostData = [
    { name: "Mon", cost: 12.4, tokens: 48000 },
    { name: "Tue", cost: 14.8, tokens: 62000 },
    { name: "Wed", cost: 11.2, tokens: 44000 },
    { name: "Thu", cost: 22.5, tokens: 94000 },
    { name: "Fri", cost: 18.1, tokens: 78000 },
    { name: "Sat", cost: 8.4, tokens: 32000 },
    { name: "Sun", cost: 9.6, tokens: 38000 },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        workspaces={workspaces}
        projects={projects}
        currentWorkspaceId="ws_default"
        currentProjectId={projectId || "proj_solas"}
        onSelectWorkspace={() => {}}
        onCreateProject={() => {}}
        onCreateWorkspace={() => {}}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/15 z-10">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-wider font-mono">
              ANALYTICS & METRICS PERFORMANCE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Range selector */}
            <div className="flex items-center border border-border bg-card/40 rounded-md p-0.5">
              {["24h", "7d", "30d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-mono rounded uppercase",
                    dateRange === range ? "bg-muted text-foreground" : "text-muted-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Aggregated Status Widgets */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card/30 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                P95 Latency Response
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">1.54s</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> -12%
                </span>
              </div>
            </div>

            <div className="bg-card/30 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                Daily Avg Cost
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">$13.85</span>
                <span className="text-[10px] text-rose-400 font-mono flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +4%
                </span>
              </div>
            </div>

            <div className="bg-card/30 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <AlertOctagon className="h-3 w-3 text-rose-500" />
                Triggered Anomalies
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">42</span>
                <span className="text-[10px] text-muted-foreground font-mono">last 7 days</span>
              </div>
            </div>

            <div className="bg-card/30 border border-border rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-orange-400" />
                Tokens / Execution
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">4.8k</span>
                <span className="text-[10px] text-muted-foreground font-mono">tokens</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Latency & Cost */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Latency Chart */}
            <div className="bg-card/20 border border-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                  Latency Percentile Trends (ms)
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Displaying p50, p95, and p99 trace metrics
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyData}>
                    <defs>
                      <linearGradient id="p95-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#999", fontSize: "10px" }}
                      itemStyle={{ color: "#fff", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="p95" stroke="#f43f5e" fillOpacity={1} fill="url(#p95-gradient)" name="p95 Latency" />
                    <Area type="monotone" dataKey="p50" stroke="#f97316" fill={undefined} name="p50 Latency" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Token & Cost Bar Chart */}
            <div className="bg-card/20 border border-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                  Accrued Tokens & Budget Usage ($)
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Visualizing direct token consumption and API expenditures
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokenCostData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#999", fontSize: "10px" }}
                      itemStyle={{ color: "#fff", fontSize: "11px" }}
                    />
                    <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Model Breakdown breakdown */}
          <div className="bg-card/20 border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                Model Allocation Split
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Distribution of span requests processed across active API providers
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border border-border/80 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">GPT-4o (OpenAI)</span>
                  <h4 className="text-xl font-bold font-mono text-foreground mt-1">68.4%</h4>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin duration-10000" />
              </div>

              <div className="border border-border/80 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">Claude 3.5 Sonnet</span>
                  <h4 className="text-xl font-bold font-mono text-foreground mt-1">24.2%</h4>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin duration-10000" />
              </div>

              <div className="border border-border/80 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">DeepSeek V3</span>
                  <h4 className="text-xl font-bold font-mono text-foreground mt-1">7.4%</h4>
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin duration-10000" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

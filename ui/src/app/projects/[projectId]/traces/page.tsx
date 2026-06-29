"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  Play,
  Search,
  Terminal,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import WireFlow from "@/components/WireFlow";
import { cn, formatDuration, formatCost, formatDateTime } from "@/lib/utils";

interface Trace {
  id: string;
  name: string;
  start_time: string;
  duration_ms: number;
  total_cost: number;
  total_tokens: number;
  status: "OK" | "ERROR";
  agent_name: string;
  span_count: number;
  error_count: number;
}

interface SpanNode {
  span_id: string;
  name: string;
  span_kind: string;
  status: "OK" | "ERROR";
  duration_ms: number;
  cost: number;
  input: string;
  output: string;
  model_name?: string;
  children?: SpanNode[];
}

export default function TraceMonitorPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedTraceDetails, setSelectedTraceDetails] = useState<Trace | null>(null);
  const [spans, setSpans] = useState<SpanNode[]>([]);
  const [selectedSpan, setSelectedSpan] = useState<SpanNode | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OK" | "ERROR">("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock Workspace/Project data for sidebar navigation
  const workspaces = [{ id: "ws_default", name: "Default Swarm", slug: "default" }];
  const projects = [
    { id: projectId || "proj_solas", name: "Weather Swarm Engine", color: "#f97316" }
  ];

  const fetchTraces = async (showProgress = true) => {
    if (showProgress) setLoading(true);
    try {
      const res = await fetch(`/api/traces?projectId=${projectId || "proj_solas"}`);
      if (res.ok) {
        const data = await res.json();
        setTraces(data);
      } else {
        // Fallback to rich interactive demo traces if backend is launching
        setTraces(getDemoTraces());
      }
    } catch {
      setTraces(getDemoTraces());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTraceSpans = async (traceId: string) => {
    try {
      const res = await fetch(`/api/traces/${traceId}/spans`);
      if (res.ok) {
        const data = await res.json();
        setSpans(data);
      } else {
        setSpans(getDemoSpans(traceId));
      }
    } catch {
      setSpans(getDemoSpans(traceId));
    }
  };

  useEffect(() => {
    fetchTraces();
  }, [projectId]);

  useEffect(() => {
    if (selectedTraceId) {
      const details = traces.find((t) => t.id === selectedTraceId) || null;
      setSelectedTraceDetails(details);
      fetchTraceSpans(selectedTraceId);
      setSelectedSpan(null);
    } else {
      setSelectedTraceDetails(null);
      setSpans([]);
      setSelectedSpan(null);
    }
  }, [selectedTraceId, traces]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTraces(false);
  };

  // Filter traces
  const filteredTraces = traces.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.agent_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OK" && t.status === "OK") ||
      (statusFilter === "ERROR" && t.status === "ERROR");

    return matchesSearch && matchesStatus;
  });

  // Calculate Aggregations
  const totalTracesCount = traces.length;
  const errorRate = totalTracesCount > 0 
    ? (traces.filter((t) => t.status === "ERROR").length / totalTracesCount) * 100 
    : 0;
  const avgDuration = totalTracesCount > 0
    ? traces.reduce((acc, t) => acc + t.duration_ms, 0) / totalTracesCount
    : 0;
  const totalCostAccumulated = traces.reduce((acc, t) => acc + t.total_cost, 0);

  // Generate dynamic topology nodes based on selected trace or general state
  const topologyNodes = [
    { id: "core", name: "Solas Engine", type: "orchestrator" as const, status: "active" as const, metrics: { latency: "14ms", calls: 12 } },
    { id: "agent_weather", name: "Weather Router", type: "router" as const, status: selectedTraceDetails?.status === "ERROR" ? "error" as const : "active" as const, metrics: { latency: "210ms", calls: 4 } },
    { id: "llm_openai", name: "GPT-4o Agent", type: "llm" as const, status: "active" as const, metrics: { latency: "1.2s", calls: 8, tokens: 4200 } },
    { id: "tool_fetch", name: "Weather API Tool", type: "tool" as const, status: selectedTraceDetails?.status === "ERROR" ? "warning" as const : "active" as const, metrics: { latency: "85ms", calls: 3 } },
    { id: "memory_mem", name: "Redis Memory", type: "memory" as const, status: "idle" as const, metrics: { latency: "8ms", calls: 2 } },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar
        workspaces={workspaces}
        projects={projects}
        currentWorkspaceId="ws_default"
        currentProjectId={projectId || "proj_solas"}
        onSelectWorkspace={() => {}}
        onCreateProject={() => {}}
        onCreateWorkspace={() => {}}
      />

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/15 z-10">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-wider font-mono">
              TRACE MONITORING & OBSERVABILITY
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all",
                refreshing && "animate-spin"
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="h-8 border-l border-border mx-1" />
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5 status-dot-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ENGINE ONLINE
            </span>
          </div>
        </header>

        {/* Dashboard Dashboard Grid & Topology */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key metrics grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card/40 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-primary" />
                Total Swarm Executions
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono tracking-tight">{totalTracesCount}</span>
                <span className="text-xs text-muted-foreground">runs</span>
              </div>
            </div>

            <div className="bg-card/40 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                Error Rate
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={cn(
                  "text-2xl font-bold font-mono tracking-tight",
                  errorRate > 0 ? "text-rose-500 glow-text-rose" : "text-emerald-500"
                )}>
                  {errorRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">failures</span>
              </div>
            </div>

            <div className="bg-card/40 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-orange-400" />
                Avg Latency
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono tracking-tight">{formatDuration(avgDuration)}</span>
                <span className="text-xs text-muted-foreground">response time</span>
              </div>
            </div>

            <div className="bg-card/40 border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                Accrued Swarm Cost
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">{formatCost(totalCostAccumulated)}</span>
                <span className="text-xs text-muted-foreground">tokens + api</span>
              </div>
            </div>
          </div>

          {/* Interactive Swarm Wire-Flow Topology */}
          <WireFlow nodes={topologyNodes} onNodeClick={(nodeId) => console.log("Clicked:", nodeId)} />

          {/* Search & Traces Table */}
          <div className="bg-card/30 border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                  Trace Execution Log
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search traces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 w-60"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center border border-border bg-card/40 rounded-md p-0.5">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono rounded",
                      statusFilter === "ALL" ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setStatusFilter("OK")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono rounded",
                      statusFilter === "OK" ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setStatusFilter("ERROR")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono rounded",
                      statusFilter === "ERROR" ? "bg-rose-500/10 text-rose-400" : "text-muted-foreground"
                    )}
                  >
                    ERRORS
                  </button>
                </div>
              </div>
            </div>

            {/* Traces List Table */}
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <th className="p-3">Status</th>
                    <th className="p-3">Trace Name</th>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Tokens</th>
                    <th className="p-3">Cost</th>
                    <th className="p-3">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          Loading trace list...
                        </div>
                      </td>
                    </tr>
                  ) : filteredTraces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No traces matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTraces.map((trace) => {
                      const isSelected = selectedTraceId === trace.id;
                      return (
                        <tr
                          key={trace.id}
                          onClick={() => setSelectedTraceId(isSelected ? null : trace.id)}
                          className={cn(
                            "hover:bg-muted/40 cursor-pointer transition-colors border-l-2",
                            isSelected
                              ? "bg-primary/5 border-l-primary"
                              : trace.status === "ERROR"
                              ? "border-l-rose-500"
                              : "border-l-transparent"
                          )}
                        >
                          <td className="p-3">
                            {trace.status === "ERROR" ? (
                              <span className="flex items-center gap-1 text-rose-500 font-mono text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded w-max border border-rose-500/20">
                                <XCircle className="h-3 w-3" /> ERROR
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-500 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded w-max border border-emerald-500/20">
                                <CheckCircle className="h-3 w-3" /> OK
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-medium">
                            <div className="flex flex-col">
                              <span>{trace.name}</span>
                              <span className="text-[9px] text-muted-foreground">{trace.id}</span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground font-mono">{trace.agent_name}</td>
                          <td className="p-3 font-mono">{formatDuration(trace.duration_ms)}</td>
                          <td className="p-3 font-mono text-muted-foreground">{trace.total_tokens.toLocaleString()}</td>
                          <td className="p-3 font-mono text-emerald-400">{formatCost(trace.total_cost)}</td>
                          <td className="p-3 text-muted-foreground font-mono">{formatDateTime(trace.start_time)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer - Span Tree Details */}
      {selectedTraceId && (
        <div className="w-[450px] border-l border-border bg-card/95 glass-panel h-screen flex flex-col z-20 slide-in-right relative">
          {/* Drawer Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-muted-foreground">Inspect Trace</span>
              <span className="text-xs font-bold font-mono tracking-tight text-foreground truncate max-w-[280px]">
                {selectedTraceDetails?.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedTraceId(null)}
              className="text-xs font-mono bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded"
            >
              CLOSE
            </button>
          </div>

          {/* Drawer Body - Nested Spans */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Execution Tree
            </h4>

            <div className="space-y-2">
              {spans.map((span) => (
                <div
                  key={span.span_id}
                  onClick={() => setSelectedSpan(span)}
                  className={cn(
                    "border border-border/80 rounded-lg p-3 hover:border-primary/40 cursor-pointer transition-all",
                    selectedSpan?.span_id === span.span_id && "border-primary/60 bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-foreground">{span.name}</span>
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded",
                      span.status === "ERROR" ? "bg-rose-500/10 text-rose-400" : "bg-muted text-muted-foreground"
                    )}>
                      {span.span_kind}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mt-2">
                    <span>{formatDuration(span.duration_ms)}</span>
                    <span className="text-emerald-400">{formatCost(span.cost)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Span I/O Inspection */}
            {selectedSpan && (
              <div className="border border-border bg-card/65 rounded-lg p-3.5 space-y-3 mt-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <span className="text-xs font-mono font-bold text-primary">Span Details</span>
                  {selectedSpan.model_name && (
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {selectedSpan.model_name}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Input JSON:</span>
                    <pre className="mt-1 p-2 bg-muted/30 rounded border border-border/40 text-[10px] max-h-24 overflow-y-auto">
                      {selectedSpan.input}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Output JSON:</span>
                    <pre className="mt-1 p-2 bg-muted/30 rounded border border-border/40 text-[10px] max-h-24 overflow-y-auto">
                      {selectedSpan.output}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Demo data generators to ensure robust plug-and-play visual state
function getDemoTraces(): Trace[] {
  return [
    {
      id: "trace_9f2b8a1c",
      name: "Weather query agent run",
      start_time: new Date(Date.now() - 360000).toISOString(),
      duration_ms: 1840,
      total_cost: 0.0084,
      total_tokens: 3820,
      status: "OK",
      agent_name: "Weather Swarm Router",
      span_count: 5,
      error_count: 0
    },
    {
      id: "trace_2d8f7e3a",
      name: "Fetch weather current temperature",
      start_time: new Date(Date.now() - 720000).toISOString(),
      duration_ms: 450,
      total_cost: 0.0003,
      total_tokens: 120,
      status: "ERROR",
      agent_name: "Weather API Tool",
      span_count: 3,
      error_count: 1
    },
    {
      id: "trace_5c9a1b8f",
      name: "Determine outfit recommendations",
      start_time: new Date(Date.now() - 1080000).toISOString(),
      duration_ms: 2150,
      total_cost: 0.0142,
      total_tokens: 5800,
      status: "OK",
      agent_name: "Outfit Recommendation Swarm",
      span_count: 8,
      error_count: 0
    }
  ];
}

function getDemoSpans(traceId: string): SpanNode[] {
  if (traceId === "trace_2d8f7e3a") {
    return [
      {
        span_id: "span_1",
        name: "Route Weather Tool",
        span_kind: "ROUTER",
        status: "OK",
        duration_ms: 120,
        cost: 0.0001,
        input: JSON.stringify({ query: "current temperature NYC" }),
        output: JSON.stringify({ action: "call_weather_api" })
      },
      {
        span_id: "span_2",
        name: "Call Weather API",
        span_kind: "TOOL",
        status: "ERROR",
        duration_ms: 330,
        cost: 0.0002,
        input: JSON.stringify({ lat: 40.7128, lon: -74.0060 }),
        output: JSON.stringify({ error: "API timeout. Host unreachable." })
      }
    ];
  }
  
  return [
    {
      span_id: "span_1",
      name: "Parse User Request",
      span_kind: "LLM",
      status: "OK",
      duration_ms: 850,
      cost: 0.0042,
      model_name: "gpt-4o",
      input: JSON.stringify({ message: "What should I wear today in London?" }),
      output: JSON.stringify({ query: "weather London", intent: "recommendation" })
    },
    {
      span_id: "span_2",
      name: "Call API Tool",
      span_kind: "TOOL",
      status: "OK",
      duration_ms: 310,
      cost: 0.0,
      input: JSON.stringify({ location: "London" }),
      output: JSON.stringify({ temp: "18C", condition: "Drizzle" })
    },
    {
      span_id: "span_3",
      name: "Generate Outfit Suggestion",
      span_kind: "LLM",
      status: "OK",
      duration_ms: 680,
      cost: 0.0042,
      model_name: "gpt-4o",
      input: JSON.stringify({ temp: "18C", condition: "Drizzle" }),
      output: JSON.stringify({ recommendation: "Wear a light jacket and carry an umbrella." })
    }
  ];
}

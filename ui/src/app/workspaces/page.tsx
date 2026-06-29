"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowRight,
  Settings,
  Users,
  FolderOpen,
  LogOut,
  Sparkles,
  Activity
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  _count?: {
    projects: number;
    members: number;
  };
}

export default function WorkspacesListPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsSlug, setNewWsSlug] = useState("");

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      } else {
        setWorkspaces(getDemoWorkspaces());
      }
    } catch {
      setWorkspaces(getDemoWorkspaces());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewWsName(val);
    // Auto-generate clean URL slug
    setNewWsSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !newWsSlug.trim()) return;

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWsName, slug: newWsSlug }),
      });

      if (res.ok) {
        toast.success("Workspace successfully created!");
        fetchWorkspaces();
        setIsModalOpen(false);
        setNewWsName("");
        setNewWsSlug("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create workspace");
      }
    } catch {
      // Demo fallback implementation for UI autonomy
      const newWs: Workspace = {
        id: `ws_${Date.now()}`,
        name: newWsName,
        slug: newWsSlug,
        plan: "community",
        _count: { projects: 0, members: 1 },
      };
      setWorkspaces([...workspaces, newWs]);
      toast.success("Workspace created (Demo Mode)");
      setIsModalOpen(false);
      setNewWsName("");
      setNewWsSlug("");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Background graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.08),transparent_50%)]" />

      {/* Header bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/15 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-rose-600 text-white font-bold">
            S
          </div>
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Solas Trace
          </span>
        </div>
        <button
          onClick={() => {
            window.location.href = "/auth/sign-in";
          }}
          className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
        >
          <LogOut className="h-3.5 w-3.5" /> Log Out
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-8 z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-foreground">
              Select Workspace
            </h1>
            <p className="text-xs text-muted-foreground">
              Select or create a workspace to view your project execution runs
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-foreground hover:bg-primary/90 text-white text-xs font-mono px-3.5 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> CREATE WORKSPACE
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full animate-ping"></span>
              Loading workspaces...
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="border border-border/80 border-dashed rounded-2xl p-12 text-center bg-card/10 space-y-4">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-xs font-mono font-bold uppercase text-foreground">
                No Workspaces Found
              </h3>
              <p className="text-xs text-muted-foreground">
                Create your first workspace to start integrating open-source agent monitors.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono px-4 py-2 rounded border border-primary/20 transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-card/30 border border-border rounded-xl p-5 flex flex-col justify-between h-44 hover:border-primary/20 transition-all hover:translate-y-[-2px] relative overflow-hidden group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold font-mono text-foreground truncate max-w-[150px]">
                      {ws.name}
                    </h3>
                    <span className="text-[8px] font-mono uppercase bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                      {ws.plan}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    /{ws.slug}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-border/60 pt-4">
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderOpen className="h-3.5 w-3.5" />
                      {ws._count?.projects || 0} Projects
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {ws._count?.members || 1} Members
                    </span>
                  </div>

                  <Link
                    href={`/projects/proj_solas/traces`}
                    className="h-7 w-7 rounded-full bg-muted/60 hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="h-12 border-t border-border/40 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
        SOLAS TRACE SYSTEM © 2026. ALL RIGHTS RESERVED.
      </footer>

      {/* Creation Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase text-foreground">
                Create Workspace
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-mono hover:underline text-muted-foreground hover:text-foreground"
              >
                CANCEL
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Swarm Team"
                  value={newWsName}
                  onChange={handleNameChange}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">
                  Workspace Slug URL
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[10px] font-mono text-muted-foreground select-none">
                    solas.trace/
                  </span>
                  <input
                    type="text"
                    value={newWsSlug}
                    onChange={(e) => setNewWsSlug(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-muted/30 pl-24 pr-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-foreground hover:bg-primary/90 text-white text-xs font-mono px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  SAVE WORKSPACE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getDemoWorkspaces(): Workspace[] {
  return [
    {
      id: "ws_default",
      name: "Acme AI Swarm",
      slug: "acme-ai",
      plan: "pro",
      _count: { projects: 3, members: 8 }
    },
    {
      id: "ws_analytics",
      name: "Weather Agent Lab",
      slug: "weather-lab",
      plan: "community",
      _count: { projects: 1, members: 2 }
    }
  ];
}

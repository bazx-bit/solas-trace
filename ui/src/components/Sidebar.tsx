"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Workflow,
  Eye,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Users,
  Key,
  ShieldCheck,
  Bell,
  Code2,
  Terminal,
  Activity,
  LogOut,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaces: Array<{ id: string; name: string; slug: string }>;
  projects: Array<{ id: string; name: string; color: string }>;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  onSelectWorkspace: (id: string) => void;
  onCreateProject: () => void;
  onCreateWorkspace: () => void;
}

export default function Sidebar({
  workspaces = [],
  projects = [],
  currentWorkspaceId,
  currentProjectId,
  onSelectWorkspace,
  onCreateProject,
  onCreateWorkspace,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const selectedWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <div
      className={cn(
        "flex flex-col h-screen glass-panel border-r border-border transition-all duration-300 relative z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header / Logo */}
      <div className="flex h-16 items-center px-4 justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-rose-600 text-white font-bold shadow-lg shadow-primary/20">
            <span className="text-lg">S</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight tracking-wider bg-gradient-to-r from-foreground to-rose-300 bg-clip-text text-transparent">
                SOLAS TRACE
              </span>
              <span className="text-[10px] text-muted-foreground/80 tracking-widest font-mono">
                OBSERVABILITY
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-md transition-transform"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace Selection Section */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-2 text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase">
              Workspace
            </span>
          )}
          {workspaces.length > 0 ? (
            <div className="relative">
              <select
                value={currentWorkspaceId || ""}
                onChange={(e) => onSelectWorkspace(e.target.value)}
                className={cn(
                  "w-full rounded-md border border-border bg-muted/40 py-2 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50",
                  collapsed && "opacity-0 pointer-events-none"
                )}
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id} className="bg-card text-foreground">
                    {w.name}
                  </option>
                ))}
              </select>
              {collapsed && selectedWorkspace && (
                <div
                  title={selectedWorkspace.name}
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 text-xs font-semibold uppercase"
                >
                  {selectedWorkspace.name.substring(0, 2)}
                </div>
              )}
            </div>
          ) : (
            !collapsed && (
              <button
                onClick={onCreateWorkspace}
                className="w-full text-left px-2.5 py-2 text-xs text-primary hover:underline"
              >
                + Create Workspace
              </button>
            )
          )}
        </div>

        {/* Project Section */}
        {currentWorkspaceId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              {!collapsed && (
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                  Projects
                </span>
              )}
              {!collapsed && (
                <button
                  onClick={onCreateProject}
                  className="text-[10px] font-mono text-primary hover:text-primary-foreground hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors"
                >
                  + Add
                </button>
              )}
            </div>
            <div className="space-y-1">
              {projects.map((proj) => {
                const isActive = proj.id === currentProjectId;
                return (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}/traces`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-250",
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_12px_rgba(244,63,94,0.1)]"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    <FolderOpen
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: proj.color }}
                    />
                    {!collapsed && <span className="truncate">{proj.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Scope Pages */}
        {currentProjectId && (
          <div className="space-y-1.5">
            {!collapsed && (
              <span className="px-2 text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                Observability
              </span>
            )}
            <Link
              href={`/projects/${currentProjectId}/traces`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/traces")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Workflow className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Trace Monitor</span>}
            </Link>

            <Link
              href={`/projects/${currentProjectId}/detectors`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/detectors")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>LLM Detectors</span>}
            </Link>

            <Link
              href={`/projects/${currentProjectId}/analytics`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/analytics")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Activity className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Metrics & Insights</span>}
            </Link>

            <Link
              href={`/projects/${currentProjectId}/settings`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.endsWith("/settings")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Project Config</span>}
            </Link>
          </div>
        )}

        {/* Workspace Scope Configuration */}
        {currentWorkspaceId && !currentProjectId && (
          <div className="space-y-1.5">
            {!collapsed && (
              <span className="px-2 text-[10px] font-mono tracking-widest text-muted-foreground/60 uppercase">
                Workspace Admin
              </span>
            )}
            <Link
              href={`/workspaces/${currentWorkspaceId}/members`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/members")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Members & Roles</span>}
            </Link>
            <Link
              href={`/workspaces/${currentWorkspaceId}/keys`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/keys")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Key className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Model Providers</span>}
            </Link>
            <Link
              href={`/workspaces/${currentWorkspaceId}/audit`}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                pathname.includes("/audit")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>Audit Logging</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Footer Profile & Options */}
      <div className="p-3 border-t border-border mt-auto">
        <button
          onClick={() => {
            window.location.href = "/auth/sign-in";
          }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Cpu, AlertTriangle, CheckCircle, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentNode {
  id: string;
  name: string;
  type: "orchestrator" | "llm" | "tool" | "router" | "memory";
  status: "active" | "warning" | "error" | "idle";
  details?: string;
  metrics?: {
    latency: string;
    tokens?: number;
    calls: number;
  };
}

interface WireFlowProps {
  nodes: AgentNode[];
  onNodeClick?: (nodeId: string) => void;
}

export default function WireFlow({ nodes = [], onNodeClick }: WireFlowProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Layout parameters for placing nodes in a dynamic visual flow
  const width = 800;
  const height = 450;
  const centerX = width / 2;
  const centerY = height / 2;

  // Render nodes relative to the center orchestrator
  const getCoordinates = (index: number, total: number) => {
    if (total <= 1) return { x: centerX, y: centerY };
    const angle = (index * 2 * Math.PI) / (total - 1) - Math.PI / 2;
    const radius = 220; // circular radius
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const orchestrator = nodes.find((n) => n.type === "orchestrator") || {
    id: "core",
    name: "Solas Engine",
    type: "orchestrator" as const,
    status: "active" as const,
    metrics: { latency: "12ms", calls: 120 },
  };

  const children = nodes.filter((n) => n.id !== orchestrator.id);

  return (
    <div className="relative w-full h-[480px] bg-card/25 border border-border rounded-xl overflow-hidden glass-card-glow p-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.15),rgba(255,255,255,0))]" />
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="absolute top-4 left-4 z-10">
        <h4 className="text-xs font-mono font-semibold tracking-wider text-primary uppercase flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 animate-pulse text-orange-400" />
          Interactive Swarm Topology
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Click nodes to inspect execution spans
        </p>
      </div>

      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="relative z-10">
        <defs>
          {/* Gradients for dynamic glowing wires */}
          <linearGradient id="active-wire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="warning-wire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="error-wire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* Wires (Connecting paths) */}
        {children.map((node, index) => {
          const coords = getCoordinates(index, children.length + 1);
          
          // Generate a smooth cubic bezier curve from center node to child
          const pathD = `M ${centerX} ${centerY} C ${centerX + (coords.x - centerX) / 2} ${centerY}, ${centerX} ${coords.y}, ${coords.x} ${coords.y}`;
          
          const isNodeHovered = hoveredNode === node.id || hoveredNode === orchestrator.id;
          const status = node.status;
          
          let strokeColor = "rgba(255, 255, 255, 0.08)";
          let strokeWidth = 2;
          let glowClass = "";

          if (status === "active") {
            strokeColor = "url(#active-wire)";
            strokeWidth = 2.5;
            glowClass = "wire-active";
          } else if (status === "warning") {
            strokeColor = "url(#warning-wire)";
            strokeWidth = 2.5;
            glowClass = "wire-active";
          } else if (status === "error") {
            strokeColor = "url(#error-wire)";
            strokeWidth = 3;
            glowClass = "wire-active";
          }

          return (
            <g key={`wire-${node.id}`}>
              {/* Underlying thicker glow wire on hover */}
              {isNodeHovered && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={status === "error" ? "#ef4444" : "#f43f5e"}
                  strokeWidth={strokeWidth + 4}
                  strokeOpacity="0.15"
                  className="transition-all duration-300"
                />
              )}

              {/* Main flow wire */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className={cn(
                  "transition-all duration-300",
                  glowClass,
                  hoveredNode && !isNodeHovered && "opacity-25"
                )}
                style={{
                  // Set custom glow properties based on state
                  "--glow-color": status === "error" ? "#ef4444" : status === "warning" ? "#eab308" : "#f97316"
                } as React.CSSProperties}
              />

              {/* Glowing data flow pulses along the path */}
              {status === "active" && (
                <circle r="3" fill="#ffffff" className="wire-pulse-animation">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} />
                </circle>
              )}
            </g>
          );
        })}

        {/* Center Orchestrator Node */}
        <g
          transform={`translate(${centerX - 40}, ${centerY - 30})`}
          className="cursor-pointer group"
          onMouseEnter={() => setHoveredNode(orchestrator.id)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={() => onNodeClick?.(orchestrator.id)}
        >
          {/* Node shadow/glow */}
          <rect
            width="80"
            height="60"
            rx="8"
            fill="rgba(20, 20, 20, 0.85)"
            stroke="url(#active-wire)"
            strokeWidth="2"
            className="group-hover:stroke-primary transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          />
          <foreignObject width="80" height="60">
            <div className="flex flex-col items-center justify-center h-full p-1 text-center">
              <Cpu className="h-5.5 w-5.5 text-primary animate-pulse" />
              <span className="text-[10px] font-mono font-bold mt-1 text-foreground">
                {orchestrator.name}
              </span>
              <span className="text-[8px] text-muted-foreground font-mono">
                {orchestrator.metrics?.latency}
              </span>
            </div>
          </foreignObject>
        </g>

        {/* Child Agent Nodes */}
        {children.map((node, index) => {
          const coords = getCoordinates(index, children.length + 1);
          const isHovered = hoveredNode === node.id;
          
          let nodeStroke = "rgba(255,255,255,0.1)";
          let iconColor = "text-muted-foreground";

          if (node.status === "active") {
            nodeStroke = "#f43f5e";
            iconColor = "text-primary";
          } else if (node.status === "warning") {
            nodeStroke = "#f97316";
            iconColor = "text-orange-400";
          } else if (node.status === "error") {
            nodeStroke = "#ef4444";
            iconColor = "text-red-500";
          }

          return (
            <g
              key={node.id}
              transform={`translate(${coords.x - 45}, ${coords.y - 30})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick?.(node.id)}
            >
              {/* Outer border shape */}
              <rect
                width="90"
                height="60"
                rx="6"
                fill="rgba(15, 15, 15, 0.9)"
                stroke={nodeStroke}
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="transition-all duration-300"
                style={{
                  filter: isHovered || node.status === "error" 
                    ? `drop-shadow(0 0 8px ${nodeStroke}44)` 
                    : "none"
                }}
              />
              
              <foreignObject width="90" height="60">
                <div className="flex flex-col items-center justify-between h-full p-2">
                  <div className="flex items-center gap-1.5 w-full justify-center">
                    {node.status === "error" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-bounce" />
                    ) : node.status === "active" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Play className="h-3 w-3 text-orange-400" />
                    )}
                    <span className="text-[9px] font-mono font-semibold truncate text-foreground/90">
                      {node.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between w-full text-[8px] font-mono text-muted-foreground/80 mt-1 border-t border-border/40 pt-1">
                    <span>Calls: {node.metrics?.calls}</span>
                    <span>{node.metrics?.latency}</span>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Styled animation styles */}
      <style jsx global>{`
        @keyframes flowMotion {
          to {
            stroke-dashoffset: -20;
          }
        }
        .wire-pulse-animation {
          animation: pulseGlow 1s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
          from { r: 2.5; opacity: 0.7; }
          to { r: 4; opacity: 1; filter: drop-shadow(0 0 3px #fff); }
        }
      `}</style>
    </div>
  );
}

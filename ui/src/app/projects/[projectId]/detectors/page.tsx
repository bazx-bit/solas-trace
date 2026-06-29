"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Eye,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  HelpCircle,
  Wrench,
  CheckSquare,
  AlertTriangle,
  Play,
  FileCode,
  Sparkles,
  Settings
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface Detector {
  id: string;
  name: string;
  template: string;
  prompt: string;
  sampleRate: number;
  enabled: boolean;
  enableRca: boolean;
  detectionModel: string;
  severity: "low" | "medium" | "high" | "critical";
}

const TEMPLATES = [
  {
    name: "Failure Detector",
    id: "failure",
    desc: "Identifies system trace errors, crashes, and exceptions in execution outputs.",
    icon: AlertTriangle,
    color: "text-red-500 bg-red-500/10",
    defaultPrompt: "Analyze the tool outputs and LLM responses. Determine if any runtime crashes, unhandled errors, API failures, or syntax violations occurred.",
  },
  {
    name: "Hallucination Evaluator",
    id: "hallucination",
    desc: "Checks LLM statements against input context documents to spot factual fabrication.",
    icon: Shield,
    color: "text-purple-500 bg-purple-500/10",
    defaultPrompt: "Evaluate if the LLM output makes assertions that are not backed up or supported by the provided source documents/context.",
  },
  {
    name: "Task Completion Gauge",
    id: "task",
    desc: "Evaluates whether the agent successfully accomplished the user's primary instruction.",
    icon: CheckSquare,
    color: "text-emerald-500 bg-emerald-500/10",
    defaultPrompt: "Given the initial prompt and the final agent response, verify if the goal has been fully met without logical omissions.",
  },
  {
    name: "Safety & Alignment Guard",
    id: "safety",
    desc: "Flags toxicity, jailbreak attempts, prompt injection, and output leakage.",
    icon: HelpCircle,
    color: "text-rose-500 bg-rose-500/10",
    defaultPrompt: "Scan input queries and outputs for compliance violations, prompt injections, credentials leak, or harmful instructions.",
  },
];

export default function DetectorsConfigPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [detectors, setDetectors] = useState<Detector[]>([
    {
      id: "det_1",
      name: "Core Exception Scanner",
      template: "failure",
      prompt: "Analyze outputs for runtime crashes.",
      sampleRate: 100,
      enabled: true,
      enableRca: true,
      detectionModel: "gpt-4o-mini",
      severity: "high",
    },
    {
      id: "det_2",
      name: "RAG Factual Alignment Check",
      template: "hallucination",
      prompt: "Verify statements against retrieval context.",
      sampleRate: 25,
      enabled: false,
      enableRca: true,
      detectionModel: "gpt-4o",
      severity: "medium",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDetName, setNewDetName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("failure");
  const [detPrompt, setDetPrompt] = useState(TEMPLATES[0].defaultPrompt);
  const [sampleRate, setSampleRate] = useState(25);
  const [detectionModel, setDetectionModel] = useState("gpt-4o-mini");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const templ = TEMPLATES.find((t) => t.id === id);
    if (templ) {
      setDetPrompt(templ.defaultPrompt);
    }
  };

  const handleAddDetector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetName.trim()) return;

    const newDetector: Detector = {
      id: `det_${Date.now()}`,
      name: newDetName,
      template: selectedTemplateId,
      prompt: detPrompt,
      sampleRate,
      enabled: true,
      enableRca: true,
      detectionModel,
      severity,
    };

    setDetectors([...detectors, newDetector]);
    setIsModalOpen(false);
    // Reset state
    setNewDetName("");
  };

  const toggleDetector = (id: string) => {
    setDetectors(
      detectors.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const deleteDetector = (id: string) => {
    setDetectors(detectors.filter((d) => d.id !== id));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        workspaces={[{ id: "ws_default", name: "Default Swarm", slug: "default" }]}
        projects={[{ id: projectId || "proj_solas", name: "Weather Swarm Engine", color: "#f97316" }]}
        currentWorkspaceId="ws_default"
        currentProjectId={projectId || "proj_solas"}
        onSelectWorkspace={() => {}}
        onCreateProject={() => {}}
        onCreateWorkspace={() => {}}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/15 z-10">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-wider font-mono">
              LLM EVALUATORS & DETECTORS
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-foreground hover:bg-primary/90 text-white text-xs font-mono px-3.5 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> CREATE DETECTOR
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Info */}
          <div className="p-4 rounded-xl border border-border bg-card/15 flex items-start gap-4">
            <Sparkles className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold font-mono text-foreground uppercase">
                LLM-As-A-Judge Evaluators
              </h4>
              <p className="text-xs text-muted-foreground">
                Set up automated judges that inspect your agentic traces in the background. If a failure or misalignment is identified, Solas will trigger alerts and launch Root Cause Analysis (RCA) dynamically.
              </p>
            </div>
          </div>

          {/* Detectors List Grid */}
          <div className="grid grid-cols-2 gap-4">
            {detectors.map((det) => {
              const templInfo = TEMPLATES.find((t) => t.id === det.template) || TEMPLATES[0];
              const IconComp = templInfo.icon;

              return (
                <div
                  key={det.id}
                  className={cn(
                    "bg-card/30 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-primary/20 transition-colors",
                    !det.enabled && "opacity-60"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", templInfo.color)}>
                        <IconComp className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold font-mono text-foreground">{det.name}</h3>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">
                          Template: {det.template}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDetector(det.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {det.enabled ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteDetector(det.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {det.prompt}
                  </p>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[10px] font-mono text-muted-foreground">
                    <span>Model: {det.detectionModel}</span>
                    <span>Sample Rate: {det.sampleRate}%</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] uppercase",
                      det.severity === "high" || det.severity === "critical"
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-orange-500/10 text-orange-400"
                    )}>
                      {det.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Creation Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase text-foreground">
                Configure New Evaluator
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-mono hover:underline text-muted-foreground hover:text-foreground"
              >
                CANCEL
              </button>
            </div>

            <form onSubmit={handleAddDetector} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">
                  Detector Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Factual Hallucination Evaluator"
                  value={newDetName}
                  onChange={(e) => setNewDetName(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">
                  Select Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleTemplateChange(t.id)}
                      className={cn(
                        "border border-border/80 rounded-lg p-2.5 cursor-pointer hover:border-primary/30 transition-all text-left",
                        selectedTemplateId === t.id && "border-primary bg-primary/5"
                      )}
                    >
                      <span className="text-xs font-bold font-mono text-foreground block">
                        {t.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 block leading-tight">
                        {t.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prompt Evaluator */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">
                  Evaluator Instruction (Prompt)
                </label>
                <textarea
                  value={detPrompt}
                  onChange={(e) => setDetPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-muted/30 p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Sample Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sampleRate}
                    onChange={(e) => setSampleRate(parseInt(e.target.value))}
                    className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Detection Model
                  </label>
                  <select
                    value={detectionModel}
                    onChange={(e) => setDetectionModel(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-muted/30 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-border bg-muted/30 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-foreground hover:bg-primary/90 text-white text-xs font-mono px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  SAVE EVALUATOR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

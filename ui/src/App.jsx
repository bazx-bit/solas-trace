import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Search,
  Terminal,
  Code,
  Cpu,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Clock,
  DollarSign,
  Eye,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  Send,
  Zap
} from 'lucide-react';
import WireFlow from './WireFlow';

// No mock data — this is a production UI.
// All data comes from the Solas Trace Rust backend at /api/*


export default function App() {
  const [traces, setTraces] = useState([]);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [selectedSpan, setSelectedSpan] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxPrompt, setSandboxPrompt] = useState("");
  const [sandboxResult, setSandboxResult] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [generatingRca, setGeneratingRca] = useState(false);
  const [activeTab, setActiveTab] = useState("observability");
  const [loading, setLoading] = useState(true);

  // Fetch traces from Rust backend API
  useEffect(() => {
    setLoading(true);
    fetch('/api/traces')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setTraces(data);
          setSelectedTraceId(data[0].trace_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch trace details when selectedTraceId changes
  useEffect(() => {
    if (!selectedTraceId) return;
    fetch(`/api/traces/${selectedTraceId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSelectedTrace(data);
          const rootSpan = (data.spans || []).find(s => s.parent_span_id === null);
          setSelectedSpan(rootSpan || (data.spans || [])[0] || null);
        }
      })
      .catch(() => {});
  }, [selectedTraceId]);


  // Handle replaying a node in the Sandbox
  const handleReplay = async () => {
    if (!selectedSpan) return;
    setReplaying(true);
    setSandboxResult("");

    try {
      const response = await fetch(`/api/spans/${selectedSpan.span_id}/replay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updated_input: sandboxPrompt })
      });
      
      const data = await response.json();
      setSandboxResult(JSON.stringify(data, null, 2));

      // If replay was successful, let's refresh the details panel to show updated content
      if (response.ok && (data.status === "success" || data.status === "success_mock")) {
        const detailsRes = await fetch(`/api/traces/${selectedTraceId}`);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          setSelectedTrace(detailsData);
          const updatedSpan = detailsData.spans.find(s => s.span_id === selectedSpan.span_id);
          if (updatedSpan) {
            setSelectedSpan(updatedSpan);
          }
        }
      }
    } catch (err) {
      setSandboxResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setReplaying(false);
    }
  };

  // Run LLM-as-a-judge Trace Evaluation
  const handleEvaluate = async () => {
    if (!selectedTraceId) return;
    setEvaluating(true);
    try {
      const response = await fetch(`/api/traces/${selectedTraceId}/evaluate`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Evaluation completed!\nStatus: ${result.status}\nDetector: ${result.detector_name || 'N/A'}\nSummary: ${result.summary}`);
        // Reload details to capture the new findings
        const detailsRes = await fetch(`/api/traces/${selectedTraceId}`);
        if (detailsRes.ok) {
          setSelectedTrace(await detailsRes.json());
        }
      } else {
        alert("Evaluation request failed.");
      }
    } catch (err) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Generate Self-Healing Root Cause Analysis (RCA) report
  const handleGenerateRca = async () => {
    if (!selectedTraceId) return;
    setGeneratingRca(true);
    try {
      const response = await fetch(`/api/traces/${selectedTraceId}/rca`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        // Reload details to capture the new rca_report
        const detailsRes = await fetch(`/api/traces/${selectedTraceId}`);
        if (detailsRes.ok) {
          setSelectedTrace(await detailsRes.json());
        }
      } else {
        alert("RCA generation request failed.");
      }
    } catch (err) {
      alert(`RCA generation failed: ${err.message}`);
    } finally {
      setGeneratingRca(false);
    }
  };

  // Filter traces by search query
  const filteredTraces = traces.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.trace_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0c10' }}>
      
      {/* 1. Header Bar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 24px', 
        height: '60px', 
        borderBottom: '1px solid rgba(255,120,50,0.08)',
        background: 'rgba(10, 12, 16, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ff6b2c, #ff4d00)', 
            padding: '7px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center',
            boxShadow: '0 0 20px rgba(255,107,44,0.35)'
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              SOLAS <span style={{ color: '#ff6b2c' }}>TRACE</span>
            </h1>
            <p style={{ margin: 0, fontSize: '10px', color: '#555c6a', letterSpacing: '1px', textTransform: 'uppercase' }}>Agent Flow Monitor</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '2px', background: '#12151c', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,120,50,0.06)' }}>
          {['observability','detectors'].map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px', border: 'none',
                background: activeTab === tab ? 'linear-gradient(135deg, #ff6b2c, #ff4d00)' : 'transparent',
                color: activeTab === tab ? 'white' : '#8a919e',
                borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px',
                boxShadow: activeTab === tab ? '0 0 12px rgba(255,107,44,0.2)' : 'none'
              }}
            >
              {tab === 'observability' ? 'Dashboard' : 'Detectors'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,230,118,0.06)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(0,230,118,0.15)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e676', boxShadow: '0 0 8px rgba(0,230,118,0.5)', animation: 'pulse 2s infinite' }}></div>
            <span style={{ fontSize: '11px', color: '#00e676', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>ONLINE</span>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Trace Runs List */}
        <aside style={{ 
          width: '300px', 
          borderRight: '1px solid rgba(255,120,50,0.06)', 
          display: 'flex', 
          flexDirection: 'column', 
          background: '#0c0e14' 
        }}>
          {/* Search box */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#12151c', border: '1px solid rgba(255,120,50,0.06)', padding: '8px 12px', borderRadius: '8px' }}>
              <Search size={16} color="#6b7280" />
              <input 
                type="text" 
                placeholder="Search traces..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Trace Runs List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <h2 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>Recent Runs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTraces.map((trace) => {
                const isSelected = trace.trace_id === selectedTraceId;
                const statusColor = trace.status === "OK" ? '#10b981' : trace.status === "WARNING" ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={trace.trace_id}
                    onClick={() => setSelectedTraceId(trace.trace_id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid rgba(255,107,44,0.4)' : '1px solid rgba(255,255,255,0.03)',
                      background: isSelected ? 'rgba(255,107,44,0.06)' : 'rgba(18,21,28,0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      boxShadow: isSelected ? '0 0 20px rgba(255,107,44,0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#ff8a50' : '#eaedf2' }}>{trace.name}</span>
                      <span style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        backgroundColor: `${statusColor}22`, 
                        color: statusColor, 
                        border: `1px solid ${statusColor}44`,
                        fontWeight: 700 
                      }}>{trace.status}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        <span>{new Date(trace.start_time).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, color: '#f3f4f6' }}>
                        <DollarSign size={11} color="#10b981" />
                        <span style={{ color: '#10b981' }}>{trace.total_cost.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {activeTab === "observability" ? (
          <>
            {/* Center Area: Visual Trace Execution Tree (DAG) */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Trace Stats Panel */}
              {selectedTrace && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: 'rgba(12, 18, 34, 0.5)', 
                  border: '1px solid rgba(255,255,255,0.04)' 
                }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{selectedTrace.name}</h2>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>ID: {selectedTrace.trace_id}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <button
                      onClick={handleEvaluate}
                      disabled={evaluating}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)'}
                    >
                      <Sparkles size={13} />
                      {evaluating ? 'Running Evals...' : 'Evaluate Trace'}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Total Cost</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#10b981' }}>${selectedTrace.total_cost.toFixed(4)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Spans Ingested</p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{selectedTrace.spans.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AGENT FLOW - Interactive Wire Diagram */}
              <div style={{ 
                flex: 1, 
                borderRadius: '16px', 
                background: 'rgba(12, 14, 20, 0.6)', 
                border: '1px solid rgba(255,120,50,0.06)',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <h3 style={{ fontSize: '22px', color: '#eaedf2', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  AGENT<br/>FLOW
                </h3>
                <p style={{ fontSize: '11px', color: '#555c6a', marginBottom: '20px' }}>Live wire connections to traced agents</p>

                {selectedTrace && (
                  <WireFlow
                    spans={selectedTrace.spans}
                    selectedSpan={selectedSpan}
                    onSelectSpan={setSelectedSpan}
                  />
                )}
              </div>

              {/* Warnings / Evals Summary */}
              {selectedTrace && selectedTrace.findings.length > 0 && (
                <div style={{ 
                  borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <AlertTriangle size={18} color="#ef4444" style={{ marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>Detector Alerts Triggered</h4>
                    {selectedTrace.findings.map(f => (
                      <p key={f.finding_id} style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                        <strong>{f.detector_name}:</strong> {f.summary}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Root Cause Analysis (RCA) Report Panel */}
              {selectedTrace && selectedTrace.status === "ERROR" && (
                <div style={{
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={18} color="#06b6d4" />
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#06b6d4', fontWeight: 700 }}>Self-Healing Root Cause Analysis</h4>
                    </div>
                    {!selectedTrace.rca_report && (
                      <button
                        onClick={handleGenerateRca}
                        disabled={generatingRca}
                        style={{
                          backgroundColor: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: '#06b6d4',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.12)'}
                      >
                        <Sparkles size={12} style={{ animation: generatingRca ? 'spin 1.5s linear infinite' : 'none' }} />
                        {generatingRca ? 'Diagnosing...' : 'Generate RCA Report'}
                      </button>
                    )}
                  </div>

                  {generatingRca && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af', fontSize: '13px', padding: '10px 0' }}>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Running deep AST and log trace analysis to locate failure root cause...</span>
                    </div>
                  )}

                  {selectedTrace.rca_report && (
                    <div style={{ 
                      background: '#04070f', 
                      padding: '16px', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255,255,255,0.03)',
                      maxHeight: '350px',
                      overflowY: 'auto'
                    }}>
                      <div 
                        style={{ 
                          fontSize: '13px', 
                          color: '#d1d5db', 
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace'
                        }}
                      >
                        {selectedTrace.rca_report}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Right Side: Step Details & Sandbox Panel */}
            <aside style={{ 
              width: '450px', 
              borderLeft: '1px solid rgba(255,255,255,0.06)', 
              background: '#080d1a',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              {selectedSpan ? (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{selectedSpan.name}</h3>
                      <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>Span ID: {selectedSpan.span_id}</p>
                    </div>
                    {selectedSpan.status === "ERROR" && (
                      <button 
                        onClick={() => {
                          setSandboxPrompt(selectedSpan.input || "");
                          setSandboxOpen(true);
                        }}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Sparkles size={12} />
                        Self-Heal Node
                      </button>
                    )}
                  </div>

                  {/* Node Metadata Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#141c30', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Cost</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>${selectedSpan.cost.toFixed(4)}</span>
                    </div>
                    <div style={{ background: '#141c30', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Prompt Tokens</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{selectedSpan.input_tokens}</span>
                    </div>
                    <div style={{ background: '#141c30', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Completion Tokens</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{selectedSpan.output_tokens}</span>
                    </div>
                  </div>

                  {/* Input / Prompt */}
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Input Prompt</h4>
                    <pre className="code-block" style={{ maxHeight: '180px' }}>{selectedSpan.input || "No input logged."}</pre>
                  </div>

                  {/* Output / Response */}
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      Output Response
                      {selectedSpan.status_message && (
                        <span style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertCircle size={10} />
                          {selectedSpan.status_message}
                        </span>
                      )}
                    </h4>
                    <pre className="code-block" style={{ 
                      maxHeight: '220px', 
                      borderColor: selectedSpan.status === 'ERROR' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedSpan.status === 'ERROR' ? '#fca5a5' : '#f3f4f6'
                    }}>
                      {selectedSpan.output || "No output."}
                    </pre>
                  </div>

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', gap: '10px' }}>
                  <Database size={28} />
                  <span>Select a node to inspect step data</span>
                </div>
              )}
            </aside>
          </>
        ) : (
          /* Tab: Evals & Findings Panel */
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>AI Evals & Real-Time Findings</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
              The system scans incoming traces using LLM-as-a-judge & rules detectors to capture anomalous behaviors, infinite loops, high cost outputs, or data leakage.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(12, 18, 34, 0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  Active Detectors
                </h3>
                <ul style={{ paddingLeft: '16px', fontSize: '13px', color: '#9ca3af', lineHeight: '2' }}>
                  <li>Infinite Loop & Repetitive Action Detector (Rules-Based)</li>
                  <li>Insufficent OpenAI Quota Alert (Status Code Checker)</li>
                  <li>Dialect Compatibility & Deprecation Inspector (LLM-as-a-Judge)</li>
                  <li>PII/Sensitive Data Leakage Scraper (Regex Filter)</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(12, 18, 34, 0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Activity size={16} color="#06b6d4" />
                  Eval Metrics Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#141c30', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Total Traces Checked</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, display: 'block' }}>124</span>
                  </div>
                  <div style={{ background: '#141c30', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Flagged Findings</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, display: 'block', color: '#f59e0b' }}>3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. Interactive Sandbox Self-Healing Drawer Overlay */}
      {sandboxOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '550px',
          background: '#0a0f1d',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#06b6d4" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Self-Healing Sandbox Playground</h3>
            </div>
            <button 
              onClick={() => setSandboxOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '18px', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Sandbox Prompt Editor (Side-by-Side Diff)</span>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 14px 0' }}>
                Compare original failed prompt with your modifications before replaying.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#ef4444', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Original Prompt (Read-only)</label>
                  <pre style={{
                    margin: 0,
                    height: '180px',
                    background: 'rgba(239, 68, 68, 0.02)',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '10px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedSpan ? selectedSpan.input : "No input."}
                  </pre>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#06b6d4', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Edit Prompt (Modify below)</label>
                  <textarea
                    value={sandboxPrompt}
                    onChange={(e) => setSandboxPrompt(e.target.value)}
                    style={{
                      width: '100%',
                      height: '180px',
                      background: '#04070f',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      padding: '10px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleReplay}
              disabled={replaying}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: replaying ? 0.7 : 1
              }}
            >
              {replaying ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
              {replaying ? 'Running Replay Simulation...' : 'Replay Prompt in Sandbox'}
            </button>

            {/* Replay Result */}
            {sandboxResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 600 }}>Replay Status: Success</span>
                <pre className="code-block" style={{ maxHeight: '250px' }}>
                  {sandboxResult}
                </pre>
                
                {/* Apply Code Fix Mock */}
                <button
                  onClick={() => {
                    alert("Mock webhook sent: Prompt successfully exported and saved to local source file!");
                    setSandboxOpen(false);
                  }}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={14} />
                  Export & Apply Code Fix
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

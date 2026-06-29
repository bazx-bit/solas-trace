import React from 'react';

// Generates SVG wire paths from the OUTPUT node to each agent port
function WireFlow({ spans = [], selectedSpan, onSelectSpan }) {
  if (!spans.length) return null;

  const portSpacing = 72;
  const startY = 40;
  const svgHeight = Math.max(spans.length * portSpacing + 80, 300);
  const svgWidth = 520;
  const outputX = 30;
  const outputY = svgHeight / 2;
  const portX = svgWidth - 30;

  const getWireColor = (status) => {
    if (status === 'ERROR') return { stroke: '#3a3d44', glow: 'none', dim: true };
    if (status === 'WARNING') return { stroke: '#ff8a50', glow: '0 0 6px rgba(255,138,80,0.6)', dim: false };
    return { stroke: '#ff6b2c', glow: '0 0 8px rgba(255,107,44,0.7)', dim: false };
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: svgHeight }}>
      {/* OUTPUT Block */}
      <div style={{
        position: 'absolute', left: 0, top: outputY - 30,
        background: 'linear-gradient(135deg, #ff6b2c, #ff4d00)',
        padding: '12px 22px', borderRadius: '10px', zIndex: 2,
        boxShadow: '0 0 25px rgba(255,107,44,0.4), 0 0 60px rgba(255,77,0,0.15)',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'subtleFloat 4s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>TRACE</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>ENGINE</span>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>⚡</div>
      </div>

      {/* SVG Wires */}
      <svg width={svgWidth} height={svgHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <filter id="glowOrange">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowRed">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {spans.map((span, i) => {
          const portY = startY + i * portSpacing + 20;
          const wire = getWireColor(span.status);
          const isActive = selectedSpan && selectedSpan.span_id === span.span_id;
          const cx1 = outputX + 180;
          const cy1 = outputY;
          const cx2 = portX - 120;
          const cy2 = portY;
          const path = `M ${outputX + 165} ${outputY} C ${cx1 + 60} ${cy1}, ${cx2 - 40} ${cy2}, ${portX - 100} ${portY}`;

          return (
            <g key={span.span_id}>
              {/* Background thick wire */}
              <path d={path} fill="none" stroke={wire.dim ? '#1e2028' : 'rgba(255,107,44,0.08)'}
                strokeWidth={wire.dim ? 4 : 6} strokeLinecap="round" />
              {/* Main wire */}
              <path d={path} fill="none" stroke={wire.stroke}
                strokeWidth={isActive ? 3.5 : 2.5} strokeLinecap="round"
                filter={wire.dim ? 'none' : (isActive ? 'url(#glowOrange)' : 'none')}
                style={{
                  strokeDasharray: wire.dim ? '6 4' : 'none',
                  animation: wire.dim ? 'none' : 'wireFlow 1.5s linear infinite',
                  strokeDashoffset: 0,
                  ...(wire.dim ? {} : { strokeDasharray: '10 10' })
                }}
              />
              {/* Port dot */}
              <circle cx={portX - 100} cy={portY} r={isActive ? 7 : 5}
                fill={wire.dim ? '#2a2d35' : wire.stroke}
                filter={wire.dim ? 'none' : 'url(#glowOrange)'}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => onSelectSpan(span)}
              />
            </g>
          );
        })}
      </svg>

      {/* Agent Port Labels (right side) */}
      {spans.map((span, i) => {
        const portY = startY + i * portSpacing;
        const wire = getWireColor(span.status);
        const isActive = selectedSpan && selectedSpan.span_id === span.span_id;
        const kindIcon = span.span_kind === 'Agent' ? '🤖' : span.span_kind === 'Tool' ? '🔧' : '💬';

        return (
          <div key={span.span_id + '-label'} onClick={() => onSelectSpan(span)} style={{
            position: 'absolute', right: 0, top: portY,
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', padding: '8px 14px', borderRadius: '10px',
            background: isActive ? 'rgba(255,107,44,0.08)' : 'rgba(18,21,28,0.6)',
            border: isActive ? '1px solid rgba(255,107,44,0.3)' : '1px solid rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)', transition: 'all 0.3s',
            boxShadow: isActive ? '0 0 20px rgba(255,107,44,0.15)' : 'none',
            minWidth: 180,
          }}>
            <span style={{ fontSize: 18 }}>{kindIcon}</span>
            <div>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: wire.dim ? '#555c6a' : (isActive ? '#ff8a50' : '#eaedf2'),
              }}>{span.name}</div>
              <div style={{ fontSize: 10, color: '#555c6a', fontFamily: 'JetBrains Mono, monospace' }}>
                {span.model || span.span_kind}
              </div>
            </div>
            {/* Status indicator dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%', marginLeft: 'auto',
              background: wire.dim ? '#2a2d35' : wire.stroke,
              boxShadow: wire.dim ? 'none' : `0 0 8px ${wire.stroke}`,
              animation: wire.dim ? 'none' : 'pulse 2s infinite',
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default WireFlow;

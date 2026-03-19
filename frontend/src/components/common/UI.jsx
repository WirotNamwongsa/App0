// src/components/common/UI.js
import React from 'react';

// BottomNav
export const BottomNav = ({ items, active, onSelect }) => (
  <nav style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(15,36,64,0.97)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    paddingBottom: 'env(safe-area-inset-bottom)',
  }}>
    {items.map(item => (
      <button
        key={item.key}
        onClick={() => onSelect(item.key)}
        style={{
          flex: 1, background: 'none', color: active === item.key ? '#d4a017' : '#64748b',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: '10px 4px', fontSize: '0.7rem', fontWeight: 500,
          borderTop: active === item.key ? '2px solid #d4a017' : '2px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    ))}
  </nav>
);

// Card
export const Card = ({ children, style }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', padding: 16,
    ...style,
  }}>{children}</div>
);

// Button
export const Button = ({ children, variant = 'primary', onClick, disabled, style, size = 'md' }) => {
  const variants = {
    primary: { background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff' },
    gold: { background: 'linear-gradient(135deg,#d4a017,#b8860b)', color: '#000' },
    danger: { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' },
    ghost: { background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border)' },
    navy: { background: 'linear-gradient(135deg,#1e3a5f,#0f2440)', color: '#fff' },
  };
  const sizes = {
    sm: { padding: '8px 14px', fontSize: '0.85rem', minHeight: 36 },
    md: { padding: '12px 20px', fontSize: '0.95rem', minHeight: 48 },
    lg: { padding: '14px 28px', fontSize: '1.05rem', minHeight: 52 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, width: '100%', transition: 'all 0.2s',
        ...variants[variant], ...sizes[size], ...style,
      }}
    >{children}</button>
  );
};

// Badge
export const Badge = ({ children, color = 'teal' }) => {
  const colors = {
    teal: { bg: 'rgba(13,148,136,0.2)', text: '#14b8a6' },
    gold: { bg: 'rgba(212,160,23,0.2)', text: '#d4a017' },
    green: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e' },
    red: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
    gray: { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8' },
  };
  const c = colors[color] || colors.teal;
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 6,
      padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600,
    }}>{children}</span>
  );
};

// Progress bar
export const ProgressBar = ({ value, max, color = '#0d9488' }) => {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div style={{
        height: 8, background: 'rgba(255,255,255,0.08)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>{value}/{max}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
};

// PageHeader
export const PageHeader = ({ title, subtitle, onBack, action }) => (
  <header style={{
    padding: '16px 20px',
    background: 'rgba(15,36,64,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'sticky', top: 0, zIndex: 50,
  }}>
    {onBack && (
      <button onClick={onBack} style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
        borderRadius: 8, width: 36, height: 36, color: 'var(--text)',
        fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>←</button>
    )}
    <div style={{ flex: 1 }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
    </div>
    {action}
  </header>
);

// StatusIcon
export const StatusIcon = ({ done }) => (
  <span style={{ fontSize: '1.1rem' }}>{done ? '✅' : '⬜'}</span>
);

// Loading spinner
export const Spinner = ({ size = 24 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `3px solid rgba(212,160,23,0.2)`,
    borderTopColor: '#d4a017',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  }} />
);

// Empty state
export const EmptyState = ({ icon, title, description }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '3rem', marginBottom: 16 }}>{icon || '📭'}</div>
    <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</p>
    {description && <p style={{ fontSize: '0.88rem' }}>{description}</p>}
  </div>
);

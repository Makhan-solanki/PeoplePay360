'use client';

import React, { useState } from 'react';

/**
 * Minimal, dependency-free SVG charts for the Payroll dashboard.
 * Single-series marks use one hue (never a rainbow per-category); multi-state
 * marks (status split) use the app's existing status colors so identity matches
 * the StatusBadge used everywhere else.
 */

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  formatValue: (v: number) => string;
  color?: string;
  height?: number;
}

export function BarChart({ data, formatValue, color = '#2563eb', height = 180 }: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 24;
  const gap = 28;
  const chartWidth = data.length * (barWidth + gap) + gap;
  const plotHeight = height - 28;

  if (data.length === 0) {
    return <div className="text-xs text-slate-400 text-center py-10">No data for this selection.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 220)} height={height} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * (plotHeight - 24));
          const x = gap + i * (barWidth + gap);
          const y = plotHeight - barHeight;
          const isHovered = hover === i;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className={isHovered ? 'fill-slate-900' : 'fill-slate-500'}
                fontSize="10"
                fontWeight={isHovered ? 700 : 500}
              >
                {formatValue(d.value)}
              </text>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={isHovered ? 1 : 0.85}
              />
              <rect x={x} y={plotHeight - 1} width={barWidth} height={1} fill="#e2e8f0" />
              <text x={x + barWidth / 2} y={plotHeight + 16} textAnchor="middle" className="fill-slate-500" fontSize="10">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LinePoint[];
  formatValue: (v: number) => string;
  color?: string;
  height?: number;
}

export function LineChart({ data, formatValue, color = '#2563eb', height = 180 }: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) {
    return <div className="text-xs text-slate-400 text-center py-10">No data for this selection.</div>;
  }

  const width = Math.max(280, data.length * 70);
  const plotHeight = height - 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const stepX = (width - 40) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = 20 + i * stepX;
    const y = plotHeight - ((d.value - min) / (max - min || 1)) * (plotHeight - 16);
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <div className="overflow-x-auto relative">
      <svg width={width} height={height} role="img" aria-label="Line chart">
        <line x1={16} y1={plotHeight} x2={width - 16} y2={plotHeight} stroke="#e2e8f0" strokeWidth={1} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" style={{ cursor: 'pointer' }} />
            <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 4} fill={color} stroke="#fff" strokeWidth={2} />
            <text x={p.x} y={plotHeight + 16} textAnchor="middle" className="fill-slate-500" fontSize="10">
              {p.label}
            </text>
          </g>
        ))}
        <text x={last.x} y={last.y - 12} textAnchor="middle" className="fill-slate-900" fontSize="11" fontWeight={700}>
          {formatValue(last.value)}
        </text>
        {hover !== null && hover !== points.length - 1 && (
          <text x={points[hover].x} y={points[hover].y - 12} textAnchor="middle" className="fill-slate-900" fontSize="11" fontWeight={700}>
            {formatValue(points[hover].value)}
          </text>
        )}
      </svg>
    </div>
  );
}

interface StatusSegment {
  label: string;
  value: number;
  color: string;
}

export function StatusSplitBar({ segments }: { segments: StatusSegment[] }) {
  const total = Math.max(1, segments.reduce((sum, s) => sum + s.value, 0));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex h-6 rounded-lg overflow-hidden">
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                width: `${pct}%`,
                backgroundColor: s.color,
                marginRight: i < segments.length - 1 ? 2 : 0,
                opacity: hover === null || hover === i ? 1 : 0.6,
              }}
              title={`${s.label}: ${s.value}`}
              className="transition-opacity first:rounded-l-lg last:rounded-r-lg"
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label} <span className="font-semibold text-slate-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

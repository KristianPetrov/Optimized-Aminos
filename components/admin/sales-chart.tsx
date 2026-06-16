"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export type SalesPoint = {
  /** ISO day, e.g. "2026-06-11" */
  date: string;
  /** Short label, e.g. "Jun 11" */
  label: string;
  revenueCents: number;
  orders: number;
};

const W = 920;
const H = 280;
const PAD = { top: 16, right: 8, bottom: 28, left: 56 };

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxRevenue = Math.max(...data.map((d) => d.revenueCents), 100);
  // Round the axis max up to a clean dollar value.
  const axisMax = Math.ceil(maxRevenue / 100 / 50) * 50 * 100 || 5000;

  const slot = innerW / data.length;
  const barW = Math.max(4, Math.min(28, slot * 0.62));

  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (cents: number) => PAD.top + innerH * (1 - cents / axisMax);

  const gridLines = [0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Daily revenue chart"
      >
        <defs>
          <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8c879" />
            <stop offset="100%" stopColor="#bb8e3a" />
          </linearGradient>
        </defs>

        {/* Grid + y-axis labels */}
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(axisMax * g)}
              y2={y(axisMax * g)}
              stroke="rgba(255,255,255,0.06)"
            />
            <text
              x={PAD.left - 8}
              y={y(axisMax * g) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#5b6577"
            >
              ${Math.round((axisMax * g) / 100).toLocaleString()}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.12)"
        />

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(
            d.revenueCents > 0 ? 2 : 0,
            innerH * (d.revenueCents / axisMax),
          );
          return (
            <g key={d.date}>
              {/* Invisible hover target covering the full column */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <rect
                x={x(i) - barW / 2}
                y={PAD.top + innerH - barH}
                width={barW}
                height={barH}
                rx={3}
                fill="url(#barGold)"
                opacity={hover === null || hover === i ? 1 : 0.35}
                style={{ transition: "opacity 120ms", pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.date}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#5b6577"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>

      {/* Tooltip */}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-lg border border-line bg-ink px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <p className="whitespace-nowrap text-faint">{hovered.label}</p>
          <p className="mt-0.5 whitespace-nowrap font-semibold text-gold">
            {formatPrice(hovered.revenueCents)}
          </p>
          <p className="whitespace-nowrap text-mist">
            {hovered.orders} {hovered.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}
    </div>
  );
}

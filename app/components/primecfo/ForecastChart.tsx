"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { addDays, format, parseISO, startOfDay, subDays } from "date-fns";
import type { ForecastSeriesPoint } from "@/lib/api/client";
import type { HistoricCashPoint } from "@/lib/forecast/historicTrail";

export type { HistoricCashPoint };

const NEG_ALERT = "#c0392b";
const BEST = "#2A9D8F";
const EXPECTED = "#1B5E4B";
const WORST = "#c0392b";
const HISTORY = "#64748b";
const AXIS_MUTED = "#475569";
const HISTORY_DAYS = 14;

type ChartRow = {
  ts: number;
  history?: number;
  expected?: number;
  best?: number;
  worst?: number;
};

function formatAxisTick(n: number): string {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatAxisDate(ts: number, todayTs: number): string {
  if (ts === todayTs) return "Today";
  return format(new Date(ts), "MMM d");
}

function offsetToTs(asOf: string, dayOffset: number): number {
  return addDays(startOfDay(parseISO(asOf)), dayOffset).getTime();
}

type ForecastChartProps = {
  series: ForecastSeriesPoint[];
  horizonDays: number;
  showScenarios: boolean;
  asOf: string;
  historic?: HistoricCashPoint[];
  shortfall?: { amount: number; dayOffset: number } | null;
  methodologyHint?: string;
};

const ForecastChart: React.FC<ForecastChartProps> = ({
  series,
  horizonDays,
  showScenarios,
  asOf,
  historic = [],
  shortfall = null,
  methodologyHint,
}) => {
  const [height, setHeight] = useState(280);

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 768) setHeight(200);
      else if (w < 1024) setHeight(240);
      else setHeight(280);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const { chartRows, xMin, xMax, todayTs, axisTicks } = useMemo(() => {
    const today = startOfDay(parseISO(asOf));
    const todayMs = today.getTime();
    const showHistory = historic.length > 0;
    const minTs = showHistory ? subDays(today, HISTORY_DAYS).getTime() : todayMs;
    const maxTs = addDays(today, horizonDays).getTime();

    const byTs = new Map<number, ChartRow>();

    for (const h of historic) {
      if (h.ts < minTs || h.ts > todayMs) continue;
      byTs.set(h.ts, { ts: h.ts, history: h.cash });
    }

    const sortedSeries = [...series]
      .filter((p) => p.dayOffset >= 0 && p.dayOffset <= horizonDays)
      .sort((a, b) => a.dayOffset - b.dayOffset);

    for (const p of sortedSeries) {
      const ts = offsetToTs(asOf, p.dayOffset);
      const existing = byTs.get(ts) ?? { ts };
      if (ts >= todayMs) {
        existing.expected = p.expected;
        if (showScenarios) {
          existing.best = p.optimistic;
          existing.worst = p.conservative;
        }
      }
      byTs.set(ts, existing);
    }

    const todayRow = byTs.get(todayMs) ?? { ts: todayMs };
    const atToday = sortedSeries.find((p) => p.dayOffset === 0);
    if (atToday) {
      todayRow.expected = atToday.expected;
      if (showScenarios) {
        todayRow.best = atToday.optimistic;
        todayRow.worst = atToday.conservative;
      }
    }
    if (todayRow.history == null && atToday) {
      todayRow.history = atToday.expected;
    }
    byTs.set(todayMs, todayRow);

    const rows = [...byTs.values()].sort((a, b) => a.ts - b.ts);

    const ticks = new Set<number>([minTs, todayMs, maxTs]);
    let cursor = addDays(today, 7);
    while (cursor.getTime() <= maxTs) {
      ticks.add(cursor.getTime());
      cursor = addDays(cursor, 7);
    }

    return {
      chartRows: rows,
      xMin: minTs,
      xMax: maxTs,
      todayTs: todayMs,
      axisTicks: [...ticks].sort((a, b) => a - b),
    };
  }, [asOf, historic, horizonDays, series, showScenarios]);

  const vals = chartRows.flatMap((r) =>
    [r.history, r.expected, r.best, r.worst].filter((x): x is number => typeof x === "number")
  );
  const maxVal = vals.length ? Math.max(...vals) : 0;
  const minVal = vals.length ? Math.min(...vals) : 0;
  const pad = Math.max(Math.abs(maxVal - Math.min(minVal, 0)) * 0.1, 500);
  const yMin = Math.min(0, minVal) - (minVal < 0 ? pad : 0);
  const yMax = Math.max(maxVal + pad, pad);

  const showHistory = historic.length > 0;
  const lastExpected = chartRows.filter((r) => r.ts >= todayTs).at(-1)?.expected;

  const shortfallLabel =
    shortfall && shortfall.amount > 0
      ? format(addDays(startOfDay(parseISO(asOf)), shortfall.dayOffset), "MMM d")
      : null;

  return (
    <div className="w-full mt-4">
      {shortfall && shortfall.amount > 0 ? (
        <p className="text-xs font-medium mb-2" style={{ color: NEG_ALERT }}>
          Worst case: projected shortfall of {formatMoney(shortfall.amount)} around {shortfallLabel}.
        </p>
      ) : lastExpected != null && lastExpected < 0 ? (
        <p className="text-xs font-medium mb-2" style={{ color: NEG_ALERT }}>
          Projected cash dips below zero within this horizon — review payables timing and near-term
          inflows.
        </p>
      ) : null}
      <div style={{ width: "100%", height }} className="touch-pan-x">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e7e3" />
            <XAxis
              type="number"
              dataKey="ts"
              domain={[xMin, xMax]}
              ticks={axisTicks}
              tick={{ fontSize: 11, fill: AXIS_MUTED }}
              tickFormatter={(ts) => formatAxisDate(Number(ts), todayTs)}
            />
            <YAxis
              tickFormatter={formatAxisTick}
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: AXIS_MUTED }}
            />
            <Tooltip
              formatter={(value: number | string, name: string) => [formatMoney(Number(value)), name]}
              labelFormatter={(ts) => format(new Date(Number(ts)), "MMM d, yyyy")}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <ReferenceLine
              x={todayTs}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Today",
                position: "top",
                fill: AXIS_MUTED,
                fontSize: 11,
              }}
            />
            {showHistory ? (
              <Line
                type="monotone"
                dataKey="history"
                name="Recent trail"
                stroke={HISTORY}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            {showScenarios ? (
              <Line
                type="monotone"
                dataKey="best"
                name="Best case"
                stroke={BEST}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="expected"
              name="Expected"
              stroke={EXPECTED}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            {showScenarios ? (
              <Line
                type="monotone"
                dataKey="worst"
                name="Worst case"
                stroke={WORST}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {methodologyHint ? (
        <p className="text-[11px] text-slate-600 mt-2 leading-snug" title={methodologyHint}>
          {methodologyHint}
        </p>
      ) : null}
    </div>
  );
};

export default ForecastChart;

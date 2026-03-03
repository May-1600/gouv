'use client'

import { Html } from '@react-three/drei'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { RoomIndicator } from '@/types/room'

interface DataPanelProps {
  indicator: RoomIndicator
  eventDate: string
  position: [number, number, number]
}

export function DataPanel({ indicator, eventDate, position }: DataPanelProps) {
  const chartData = indicator.data.map((d) => ({
    date: d.date.slice(0, 7),
    value: d.value,
    fullDate: d.date,
  }))

  return (
    <Html
      position={position}
      transform
      distanceFactor={8}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="glass-panel w-[380px] p-5"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Header */}
        <div className="mb-3 flex items-baseline justify-between">
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-title)', color: indicator.color }}
          >
            {indicator.label}
          </h3>
          <span className="text-xs text-gray-400">{indicator.unit}</span>
        </div>

        {/* Chart */}
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} ${indicator.unit}`, indicator.label]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <ReferenceLine
                x={eventDate.slice(0, 7)}
                stroke={indicator.color}
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: '\u25BC',
                  position: 'top',
                  fill: indicator.color,
                  fontSize: 14,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={indicator.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: indicator.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Impact description */}
        {indicator.impactDescription && (
          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            {indicator.impactDescription}
          </p>
        )}
      </div>
    </Html>
  )
}

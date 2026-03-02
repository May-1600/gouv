// lib/three/era.ts

export const START_YEAR = 2017
export const END_YEAR = 2026
export const YEAR_SPAN = END_YEAR - START_YEAR // 9

export type EraName = 'optimism' | 'crisis' | 'recovery' | 'tension' | 'present'

export interface EraConfig {
  name: EraName
  fogColor: string
  groundColor: string
  skyColor: string
  accentColor: string
  lightIntensity: number
  fogDensity: number
  terrainAmplitude: number
}

const ERA_CONFIGS: Record<EraName, EraConfig> = {
  optimism: {
    name: 'optimism',
    fogColor: '#e8f5e9',
    groundColor: '#a5d6a7',
    skyColor: '#bbdefb',
    accentColor: '#4ade80',
    lightIntensity: 1.4,
    fogDensity: 0.008,
    terrainAmplitude: 0.3,
  },
  crisis: {
    name: 'crisis',
    fogColor: '#90a4ae',
    groundColor: '#78909c',
    skyColor: '#607d8b',
    accentColor: '#64748b',
    lightIntensity: 0.7,
    fogDensity: 0.025,
    terrainAmplitude: 1.2,
  },
  recovery: {
    name: 'recovery',
    fogColor: '#e3f2fd',
    groundColor: '#90caf9',
    skyColor: '#bbdefb',
    accentColor: '#60a5fa',
    lightIntensity: 1.1,
    fogDensity: 0.012,
    terrainAmplitude: 0.5,
  },
  tension: {
    name: 'tension',
    fogColor: '#fff3e0',
    groundColor: '#ffcc80',
    skyColor: '#ffe0b2',
    accentColor: '#f97316',
    lightIntensity: 1.2,
    fogDensity: 0.015,
    terrainAmplitude: 0.8,
  },
  present: {
    name: 'present',
    fogColor: '#ede7f6',
    groundColor: '#b39ddb',
    skyColor: '#d1c4e9',
    accentColor: '#a78bfa',
    lightIntensity: 1.0,
    fogDensity: 0.01,
    terrainAmplitude: 0.4,
  },
}

function getEraName(year: number): EraName {
  if (year <= 2019) return 'optimism'
  if (year <= 2020) return 'crisis'
  if (year <= 2022) return 'recovery'
  if (year <= 2024) return 'tension'
  return 'present'
}

export function yearToScrollOffset(year: number): number {
  return Math.max(0, Math.min(1, (year - START_YEAR) / YEAR_SPAN))
}

export function scrollOffsetToYear(offset: number): number {
  return Math.floor(START_YEAR + Math.max(0, Math.min(1, offset)) * YEAR_SPAN)
}

export function getEraConfig(year: number): EraConfig {
  return ERA_CONFIGS[getEraName(year)]
}

export function getAllEras(): EraConfig[] {
  return Object.values(ERA_CONFIGS)
}

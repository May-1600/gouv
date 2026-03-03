export interface RoomStyle {
  floorColor: string
  wallColor: string
  accentColor: string
  ambientIntensity: number
}

const ROOM_STYLES: Record<string, RoomStyle> = {
  fiscalite: {
    floorColor: '#fef3c7',
    wallColor: '#fffbeb',
    accentColor: '#f59e0b',
    ambientIntensity: 0.7,
  },
  crise: {
    floorColor: '#e2e8f0',
    wallColor: '#f1f5f9',
    accentColor: '#ef4444',
    ambientIntensity: 0.5,
  },
  reforme: {
    floorColor: '#ede9fe',
    wallColor: '#f5f3ff',
    accentColor: '#8b5cf6',
    ambientIntensity: 0.65,
  },
  social: {
    floorColor: '#fff7ed',
    wallColor: '#fffbeb',
    accentColor: '#f97316',
    ambientIntensity: 0.65,
  },
  emploi: {
    floorColor: '#dbeafe',
    wallColor: '#eff6ff',
    accentColor: '#3b82f6',
    ambientIntensity: 0.6,
  },
}

const DEFAULT_STYLE: RoomStyle = {
  floorColor: '#f0ede6',
  wallColor: '#fafaf9',
  accentColor: '#a78bfa',
  ambientIntensity: 0.6,
}

export function getRoomStyle(category: string | null): RoomStyle {
  if (!category) return DEFAULT_STYLE
  return ROOM_STYLES[category] ?? DEFAULT_STYLE
}

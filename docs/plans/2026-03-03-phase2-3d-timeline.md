# Phase 2: 3D Timeline Rail — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the scroll-driven 3D timeline rail where a camera advances through a procedural low-poly landscape from 2017 to 2026, with year markers, event markers, and era-driven atmosphere.

**Architecture:** ScrollControls from Drei drives `scroll.offset` (0→1), which maps to 2017→2026. A CatmullRomCurve3 defines the camera path. The terrain, lighting, fog, and colors are pure functions of the current year. Zustand syncs scroll progress between the 3D scene and DOM overlay (timeline sidebar). All visual components are client-only (`'use client'`). Testable logic (era palettes, path math, terrain generation) is extracted into pure `lib/three/` utilities and TDD'd.

**Tech Stack:** Next.js 16, React Three Fiber v9, @react-three/drei ^10, Three.js ^0.183, Zustand 5, simplex-noise, Tailwind v4, Vitest

**Reference docs:**
- Design: `docs/plans/2026-03-02-macron-data-narrative-design.md`
- UI/UX: `docs/plans/2026-03-02-ui-ux-spec.md`
- Phase 1: `docs/plans/2026-03-02-phase1-data-pipeline.md`

---

## Task 1: Install Dependencies & Font Setup

**Files:**
- Modify: `package.json` (add `simplex-noise`)
- Modify: `app/layout.tsx` (replace Geist with Outfit + Inter)
- Modify: `app/globals.css` (add design tokens for Clay Render style)

**Step 1: Install simplex-noise**

Run: `npm install simplex-noise`
Expected: Package added to dependencies.

**Step 2: Replace fonts in layout.tsx**

Replace `Geist` and `Geist_Mono` with `Outfit` and `Inter` from `next/font/google`.

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Chrono-Macron — Les mandats en données',
  description:
    'Exploration interactive et visuelle des mandats présidentiels 2017-2027 à travers les données publiques françaises.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${outfit.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

**Step 3: Update globals.css with design tokens**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: #f0ede6;
  --foreground: #1a1a2e;
  --font-title: var(--font-outfit);
  --font-body: var(--font-inter);

  /* Glassmorphism tokens */
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-blur: 12px;

  /* Era accent colors (used in DOM overlay) */
  --era-optimism: #4ade80;
  --era-crisis: #64748b;
  --era-recovery: #60a5fa;
  --era-tension: #f97316;
  --era-present: #a78bfa;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-body);
  --font-mono: var(--font-inter);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body), system-ui, sans-serif;
  overflow: hidden; /* Canvas takes full viewport */
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-title), system-ui, sans-serif;
}

/* Glassmorphism utility class */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
```

**Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds. Fonts loaded. No errors.

**Step 5: Commit**

```bash
git add package.json package-lock.json app/layout.tsx app/globals.css
git commit -m "feat(phase2): add Outfit/Inter fonts, design tokens, simplex-noise dep"
```

---

## Task 2: Era Configuration Utilities (TDD)

These pure functions define the visual atmosphere for each era. They're the "brain" of the visual system — everything else (terrain color, fog, lighting, sky) reads from these.

**Files:**
- Create: `lib/three/era.ts`
- Create: `lib/three/__tests__/era.test.ts`

**Step 1: Write the failing tests**

```ts
// lib/three/__tests__/era.test.ts
import { describe, it, expect } from 'vitest'
import { getEraConfig, yearToScrollOffset, scrollOffsetToYear } from '../era'

describe('yearToScrollOffset', () => {
  it('maps 2017 to 0', () => {
    expect(yearToScrollOffset(2017)).toBe(0)
  })

  it('maps 2026 to 1', () => {
    expect(yearToScrollOffset(2026)).toBe(1)
  })

  it('maps 2020 to ~0.333', () => {
    expect(yearToScrollOffset(2020)).toBeCloseTo(3 / 9, 3)
  })

  it('clamps below 2017 to 0', () => {
    expect(yearToScrollOffset(2010)).toBe(0)
  })

  it('clamps above 2026 to 1', () => {
    expect(yearToScrollOffset(2030)).toBe(1)
  })
})

describe('scrollOffsetToYear', () => {
  it('maps 0 to 2017', () => {
    expect(scrollOffsetToYear(0)).toBe(2017)
  })

  it('maps 1 to 2026', () => {
    expect(scrollOffsetToYear(1)).toBe(2026)
  })

  it('maps 0.5 to 2021 (floor)', () => {
    expect(scrollOffsetToYear(0.5)).toBe(2021)
  })
})

describe('getEraConfig', () => {
  it('returns optimism era for 2017', () => {
    const era = getEraConfig(2017)
    expect(era.name).toBe('optimism')
    expect(era.fogColor).toBeDefined()
    expect(era.groundColor).toBeDefined()
    expect(era.skyColor).toBeDefined()
    expect(era.lightIntensity).toBeGreaterThan(0)
    expect(era.fogDensity).toBeGreaterThan(0)
  })

  it('returns crisis era for 2020', () => {
    const era = getEraConfig(2020)
    expect(era.name).toBe('crisis')
  })

  it('returns recovery era for 2021', () => {
    const era = getEraConfig(2021)
    expect(era.name).toBe('recovery')
  })

  it('returns tension era for 2023', () => {
    const era = getEraConfig(2023)
    expect(era.name).toBe('tension')
  })

  it('returns present era for 2025', () => {
    const era = getEraConfig(2025)
    expect(era.name).toBe('present')
  })

  it('interpolates between eras for fractional years', () => {
    const a = getEraConfig(2019)
    const b = getEraConfig(2020)
    // Just verify they return different configs
    expect(a.name).not.toBe(b.name)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/three/__tests__/era.test.ts`
Expected: FAIL — module `../era` not found.

**Step 3: Implement era.ts**

```ts
// lib/three/era.ts

export const START_YEAR = 2017
export const END_YEAR = 2026
export const YEAR_SPAN = END_YEAR - START_YEAR // 9

export type EraName = 'optimism' | 'crisis' | 'recovery' | 'tension' | 'present'

export interface EraConfig {
  name: EraName
  fogColor: string       // hex color for Three.js fog
  groundColor: string    // hex for terrain base
  skyColor: string       // hex for sky tint
  accentColor: string    // hex for markers/highlights
  lightIntensity: number // directional light intensity
  fogDensity: number     // exponential fog density
  terrainAmplitude: number // noise displacement multiplier
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

/** Year → era name mapping */
function getEraName(year: number): EraName {
  if (year <= 2019) return 'optimism'
  if (year <= 2020) return 'crisis'
  if (year <= 2022) return 'recovery'
  if (year <= 2024) return 'tension'
  return 'present'
}

/** Convert a year (2017-2026) to scroll offset (0-1). Clamps. */
export function yearToScrollOffset(year: number): number {
  return Math.max(0, Math.min(1, (year - START_YEAR) / YEAR_SPAN))
}

/** Convert scroll offset (0-1) to a year (2017-2026). Floors. */
export function scrollOffsetToYear(offset: number): number {
  return Math.floor(START_YEAR + Math.max(0, Math.min(1, offset)) * YEAR_SPAN)
}

/** Get the full era config for a given year. */
export function getEraConfig(year: number): EraConfig {
  return ERA_CONFIGS[getEraName(year)]
}

/** Get era config for all 5 eras (used for preloading / legend). */
export function getAllEras(): EraConfig[] {
  return Object.values(ERA_CONFIGS)
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/three/__tests__/era.test.ts`
Expected: All 11 tests PASS.

**Step 5: Commit**

```bash
git add lib/three/era.ts lib/three/__tests__/era.test.ts
git commit -m "feat(phase2): add era config utilities with tests"
```

---

## Task 3: Camera Path Utilities (TDD)

A pure function that, given a scroll offset (0→1), returns a camera position and lookAt target along a CatmullRomCurve3. This is the geometric "rail" the camera rides.

**Files:**
- Create: `lib/three/camera-path.ts`
- Create: `lib/three/__tests__/camera-path.test.ts`

**Step 1: Write the failing tests**

```ts
// lib/three/__tests__/camera-path.test.ts
import { describe, it, expect } from 'vitest'
import {
  getCameraPosition,
  getLookAtTarget,
  getPathPoints,
  PATH_LENGTH,
  CAMERA_HEIGHT,
} from '../camera-path'

describe('PATH_LENGTH', () => {
  it('is 100 units', () => {
    expect(PATH_LENGTH).toBe(100)
  })
})

describe('CAMERA_HEIGHT', () => {
  it('is 3 units', () => {
    expect(CAMERA_HEIGHT).toBe(3)
  })
})

describe('getPathPoints', () => {
  it('returns an array of Vector3-like objects', () => {
    const points = getPathPoints()
    expect(points.length).toBeGreaterThan(2)
    expect(points[0]).toHaveProperty('x')
    expect(points[0]).toHaveProperty('y')
    expect(points[0]).toHaveProperty('z')
  })

  it('starts near x=0 and ends near x=PATH_LENGTH', () => {
    const points = getPathPoints()
    expect(points[0].x).toBeCloseTo(0, 0)
    expect(points[points.length - 1].x).toBeCloseTo(PATH_LENGTH, 0)
  })
})

describe('getCameraPosition', () => {
  it('returns position at start when offset=0', () => {
    const pos = getCameraPosition(0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeCloseTo(CAMERA_HEIGHT, 0)
  })

  it('returns position at end when offset=1', () => {
    const pos = getCameraPosition(1)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
    expect(pos.y).toBeCloseTo(CAMERA_HEIGHT, 0)
  })

  it('returns intermediate position at offset=0.5', () => {
    const pos = getCameraPosition(0.5)
    expect(pos.x).toBeGreaterThan(0)
    expect(pos.x).toBeLessThan(PATH_LENGTH)
  })

  it('clamps offset below 0', () => {
    const pos = getCameraPosition(-0.5)
    expect(pos.x).toBeCloseTo(0, 0)
  })

  it('clamps offset above 1', () => {
    const pos = getCameraPosition(1.5)
    expect(pos.x).toBeCloseTo(PATH_LENGTH, 0)
  })
})

describe('getLookAtTarget', () => {
  it('is always ahead of camera position', () => {
    const pos = getCameraPosition(0.3)
    const target = getLookAtTarget(0.3)
    expect(target.x).toBeGreaterThan(pos.x)
  })

  it('at end, looks slightly forward', () => {
    const target = getLookAtTarget(1)
    expect(target.x).toBeGreaterThanOrEqual(PATH_LENGTH)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/three/__tests__/camera-path.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement camera-path.ts**

```ts
// lib/three/camera-path.ts
import * as THREE from 'three'

export const PATH_LENGTH = 100
export const CAMERA_HEIGHT = 3
const LOOK_AHEAD = 0.02 // 2% ahead on the curve

/**
 * Define the control points for the camera rail.
 * Gentle S-curve along x-axis with slight z-wobble for visual interest.
 */
const CONTROL_POINTS = [
  new THREE.Vector3(0, CAMERA_HEIGHT, 0),
  new THREE.Vector3(20, CAMERA_HEIGHT, 1.5),
  new THREE.Vector3(40, CAMERA_HEIGHT + 0.5, -1),
  new THREE.Vector3(55, CAMERA_HEIGHT, 1),
  new THREE.Vector3(70, CAMERA_HEIGHT - 0.3, -0.5),
  new THREE.Vector3(85, CAMERA_HEIGHT + 0.2, 0.8),
  new THREE.Vector3(100, CAMERA_HEIGHT, 0),
]

const curve = new THREE.CatmullRomCurve3(CONTROL_POINTS, false, 'catmullrom', 0.5)

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Get the raw path control points (for debugging / visualization). */
export function getPathPoints(): THREE.Vector3[] {
  return curve.getPoints(50)
}

/** Get camera world position for a given scroll offset (0-1). */
export function getCameraPosition(offset: number): THREE.Vector3 {
  return curve.getPointAt(clamp01(offset))
}

/** Get the lookAt target for the camera at a given offset. Looks slightly ahead. */
export function getLookAtTarget(offset: number): THREE.Vector3 {
  const aheadOffset = clamp01(offset + LOOK_AHEAD)
  // At the very end, just look further along x
  if (offset >= 1 - LOOK_AHEAD) {
    const pos = curve.getPointAt(1)
    return new THREE.Vector3(pos.x + 5, pos.y - 0.5, pos.z)
  }
  const target = curve.getPointAt(aheadOffset)
  target.y -= 0.5 // look slightly downward at the path
  return target
}

/** Convert a year (2017-2026) to x-position on the path. */
export function yearToPathX(year: number): number {
  return ((year - 2017) / 9) * PATH_LENGTH
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/three/__tests__/camera-path.test.ts`
Expected: All 10 tests PASS.

**Step 5: Commit**

```bash
git add lib/three/camera-path.ts lib/three/__tests__/camera-path.test.ts
git commit -m "feat(phase2): add camera path CatmullRom utilities with tests"
```

---

## Task 4: Terrain Generation Utility (TDD)

Pure function that generates vertex positions and colors for a low-poly terrain mesh. Uses simplex noise for height displacement. The amplitude and color come from the era config.

**Files:**
- Create: `lib/three/terrain-gen.ts`
- Create: `lib/three/__tests__/terrain-gen.test.ts`

**Step 1: Write the failing tests**

```ts
// lib/three/__tests__/terrain-gen.test.ts
import { describe, it, expect } from 'vitest'
import { generateTerrainVertices, TERRAIN_WIDTH, TERRAIN_SEGMENTS } from '../terrain-gen'

describe('generateTerrainVertices', () => {
  it('returns a Float32Array of positions', () => {
    const result = generateTerrainVertices(0.5)
    expect(result.positions).toBeInstanceOf(Float32Array)
  })

  it('returns correct number of vertices', () => {
    const result = generateTerrainVertices(0.5)
    // A plane with (segX+1) * (segZ+1) vertices, each with 3 components
    const expectedCount = (TERRAIN_SEGMENTS + 1) * (TERRAIN_SEGMENTS + 1) * 3
    expect(result.positions.length).toBe(expectedCount)
  })

  it('applies noise displacement to y values', () => {
    const result = generateTerrainVertices(1.0)
    // With amplitude > 0, at least some y values should differ from 0
    const yValues: number[] = []
    for (let i = 1; i < result.positions.length; i += 3) {
      yValues.push(result.positions[i])
    }
    const hasDisplacement = yValues.some((y) => Math.abs(y) > 0.01)
    expect(hasDisplacement).toBe(true)
  })

  it('produces flat terrain when amplitude is 0', () => {
    const result = generateTerrainVertices(0)
    for (let i = 1; i < result.positions.length; i += 3) {
      expect(Math.abs(result.positions[i])).toBeLessThan(0.001)
    }
  })

  it('returns a colors array of same vertex count', () => {
    const result = generateTerrainVertices(0.5, '#a5d6a7')
    expect(result.colors).toBeInstanceOf(Float32Array)
    expect(result.colors.length).toBe(result.positions.length)
  })
})

describe('TERRAIN_WIDTH', () => {
  it('is at least 20 units wide', () => {
    expect(TERRAIN_WIDTH).toBeGreaterThanOrEqual(20)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/three/__tests__/terrain-gen.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement terrain-gen.ts**

```ts
// lib/three/terrain-gen.ts
import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

export const TERRAIN_WIDTH = 30   // z-axis width (path is in the center ~4 units)
export const TERRAIN_SEGMENTS = 64 // segments per axis of the PlaneGeometry

const noise2D = createNoise2D()

/**
 * Generate displaced vertex positions and per-vertex colors for a terrain chunk.
 *
 * @param amplitude - Height displacement multiplier (from era config)
 * @param baseColorHex - Base hex color for the ground (from era config)
 * @param offsetX - x-offset for the noise seed (allows tiling chunks)
 * @returns positions and colors as Float32Arrays, ready for BufferGeometry
 */
export function generateTerrainVertices(
  amplitude: number,
  baseColorHex: string = '#a5d6a7',
  offsetX: number = 0
): { positions: Float32Array; colors: Float32Array } {
  const verticesPerSide = TERRAIN_SEGMENTS + 1
  const count = verticesPerSide * verticesPerSide
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const baseColor = new THREE.Color(baseColorHex)
  const darkVariant = baseColor.clone().multiplyScalar(0.7)
  const lightVariant = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.3)

  const halfWidth = TERRAIN_WIDTH / 2
  const stepX = TERRAIN_WIDTH / TERRAIN_SEGMENTS
  const stepZ = TERRAIN_WIDTH / TERRAIN_SEGMENTS

  let idx = 0
  for (let iz = 0; iz < verticesPerSide; iz++) {
    for (let ix = 0; ix < verticesPerSide; ix++) {
      const x = ix * stepX - halfWidth + offsetX
      const z = iz * stepZ - halfWidth

      // Multi-octave noise for natural look
      const n1 = noise2D(x * 0.05, z * 0.05) * 1.0
      const n2 = noise2D(x * 0.1, z * 0.1) * 0.5
      const n3 = noise2D(x * 0.2, z * 0.2) * 0.25
      const height = (n1 + n2 + n3) * amplitude

      // Flatten the path corridor (center 4 units along z)
      const distFromCenter = Math.abs(z)
      const pathFalloff = distFromCenter < 2 ? 0 : Math.min(1, (distFromCenter - 2) / 3)

      positions[idx * 3] = x
      positions[idx * 3 + 1] = height * pathFalloff
      positions[idx * 3 + 2] = z

      // Color: darker in valleys, lighter on peaks
      const t = (height * pathFalloff + amplitude) / (2 * Math.max(amplitude, 0.001))
      const vertexColor = darkVariant.clone().lerp(lightVariant, Math.max(0, Math.min(1, t)))
      colors[idx * 3] = vertexColor.r
      colors[idx * 3 + 1] = vertexColor.g
      colors[idx * 3 + 2] = vertexColor.b

      idx++
    }
  }

  return { positions, colors }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/three/__tests__/terrain-gen.test.ts`
Expected: All 6 tests PASS.

**Step 5: Commit**

```bash
git add lib/three/terrain-gen.ts lib/three/__tests__/terrain-gen.test.ts
git commit -m "feat(phase2): add terrain generation with simplex noise, tests"
```

---

## Task 5: Three.js Types

Shared TypeScript interfaces for 3D component props.

**Files:**
- Create: `types/three.ts`

**Step 1: Create types/three.ts**

```ts
// types/three.ts
import type { EraConfig } from '@/lib/three/era'

/** Props for components that react to scroll progress */
export interface ScrollDrivenProps {
  scrollOffset: number // 0-1
}

/** Props for the Terrain component */
export interface TerrainProps {
  chunkX: number      // x-offset for this terrain chunk
  era: EraConfig
}

/** Props for year/event markers */
export interface MarkerProps {
  position: [number, number, number]
  label: string
  color?: string
  onClick?: () => void
}

/** Props for event markers (extends MarkerProps with event data) */
export interface EventMarkerProps extends MarkerProps {
  eventId: string
  category: string
}

/** Props for the Atmosphere component */
export interface AtmosphereProps {
  era: EraConfig
}
```

**Step 2: Commit**

```bash
git add types/three.ts
git commit -m "feat(phase2): add Three.js component type definitions"
```

---

## Task 6: CanvasErrorBoundary & LoadingScreen

Error boundary catches WebGL crashes and shows a fallback. LoadingScreen shows during Suspense.

**Files:**
- Create: `components/three/canvas/CanvasErrorBoundary.tsx`
- Create: `components/three/canvas/LoadingScreen.tsx`

**Step 1: Create CanvasErrorBoundary**

This must be a class component (React error boundaries can't be hooks).

```tsx
// components/three/canvas/CanvasErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)]">
          <div className="glass-panel max-w-md p-8 text-center">
            <h2 className="mb-4 text-xl font-semibold" style={{ fontFamily: 'var(--font-title)' }}>
              Expérience 3D indisponible
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Votre navigateur ne supporte pas WebGL ou une erreur est survenue.
            </p>
            <p className="text-xs text-gray-400">
              {this.state.error?.message}
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Step 2: Create LoadingScreen**

```tsx
// components/three/canvas/LoadingScreen.tsx
'use client'

import { useProgress } from '@react-three/drei'

export function LoadingScreen() {
  const { progress } = useProgress()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]">
      <div className="glass-panel w-80 p-8 text-center">
        <h2
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          Chrono-Macron
        </h2>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[var(--era-optimism)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          Chargement du monde… {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/three/canvas/CanvasErrorBoundary.tsx components/three/canvas/LoadingScreen.tsx
git commit -m "feat(phase2): add CanvasErrorBoundary and LoadingScreen"
```

---

## Task 7: MainCanvas Component

The root 3D component. Wraps `<Canvas>` with error boundary and Suspense.

**Files:**
- Create: `components/three/canvas/MainCanvas.tsx`

**Step 1: Create MainCanvas**

```tsx
// components/three/canvas/MainCanvas.tsx
'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { LoadingScreen } from './LoadingScreen'
import { Timeline } from '@/components/three/world/Timeline'

export function MainCanvas() {
  return (
    <CanvasErrorBoundary>
      <div className="fixed inset-0">
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            camera={{ fov: 60, near: 0.1, far: 200, position: [0, 3, 0] }}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
          >
            <Timeline />
          </Canvas>
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  )
}
```

> **Note:** This file will produce a build error until Task 9 creates `Timeline.tsx`. That's expected — we'll commit them together.

**Step 2: Do NOT commit yet** — wait for Task 9 (Timeline).

---

## Task 8: Experience Page Route

The `/experience` route that hosts the 3D canvas.

**Files:**
- Create: `app/experience/page.tsx`

**Step 1: Create the experience page**

```tsx
// app/experience/page.tsx
'use client'

import { MainCanvas } from '@/components/three/canvas/MainCanvas'
import { TimelineSidebar } from '@/components/ui/TimelineSidebar'
import { DataLoader } from '@/components/three/canvas/DataLoader'

export default function ExperiencePage() {
  return (
    <>
      <DataLoader />
      <MainCanvas />
      <TimelineSidebar />
    </>
  )
}
```

> **Note:** `TimelineSidebar` and `DataLoader` don't exist yet — they're Tasks 12 and 13. This file will error until then. We create it now to show the full wiring but commit it with the integration task.

**Step 2: Do NOT commit yet** — wait for integration task.

---

## Task 9: Timeline — ScrollControls + CameraRig

The core scroll-driven experience. ScrollControls wraps the scene. CameraRig reads `scroll.offset` in `useFrame` and positions the camera along the CatmullRomCurve3.

**Files:**
- Create: `components/three/world/Timeline.tsx`
- Create: `components/three/world/CameraRig.tsx`

**Step 1: Create CameraRig**

This component lives *inside* `<ScrollControls>` and drives the camera every frame.

```tsx
// components/three/world/CameraRig.tsx
'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { getCameraPosition, getLookAtTarget } from '@/lib/three/camera-path'
import { useAppStore } from '@/lib/store'

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()
  const setScrollProgress = useAppStore((s) => s.setScrollProgress)

  useFrame(() => {
    const offset = scroll.offset

    // Update camera position along the rail
    const pos = getCameraPosition(offset)
    camera.position.copy(pos)

    // Look slightly ahead on the curve
    const target = getLookAtTarget(offset)
    camera.lookAt(target)

    // Sync to Zustand store (currentYear derived automatically)
    setScrollProgress(offset)
  })

  return null
}
```

**Step 2: Create Timeline**

```tsx
// components/three/world/Timeline.tsx
'use client'

import { ScrollControls } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { Terrain } from './Terrain'
import { YearMarkers } from './YearMarkers'
import { EventMarkers } from './EventMarkers'
import { Atmosphere } from './Atmosphere'

/**
 * The main scroll-driven timeline.
 * pages=10 gives us ~1 page per year (2017-2026).
 * damping=0.15 gives smooth deceleration.
 */
export function Timeline() {
  return (
    <ScrollControls pages={10} damping={0.15}>
      <CameraRig />
      <Terrain />
      <YearMarkers />
      <EventMarkers />
      <Atmosphere />
    </ScrollControls>
  )
}
```

> **Note:** Terrain, YearMarkers, EventMarkers, and Atmosphere don't exist yet — created in Tasks 10-12. Commit all world components together.

**Step 3: Do NOT commit yet** — wait for Tasks 10-12.

---

## Task 10: Terrain Component

Renders terrain chunks along the path. Each chunk covers ~25 units of the x-axis. The era config for each chunk determines its amplitude and color.

**Files:**
- Create: `components/three/world/Terrain.tsx`

**Step 1: Create Terrain.tsx**

```tsx
// components/three/world/Terrain.tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { generateTerrainVertices, TERRAIN_WIDTH, TERRAIN_SEGMENTS } from '@/lib/three/terrain-gen'
import { getEraConfig, scrollOffsetToYear } from '@/lib/three/era'
import { PATH_LENGTH } from '@/lib/three/camera-path'

const CHUNK_SIZE = 25 // x-units per terrain chunk
const CHUNK_COUNT = Math.ceil(PATH_LENGTH / CHUNK_SIZE) // 4 chunks

function TerrainChunk({ chunkIndex }: { chunkIndex: number }) {
  const offsetX = chunkIndex * CHUNK_SIZE
  // Map chunk center to a year to pick the era
  const centerX = offsetX + CHUNK_SIZE / 2
  const progress = centerX / PATH_LENGTH
  const year = scrollOffsetToYear(progress)
  const era = getEraConfig(year)

  const geometry = useMemo(() => {
    const { positions, colors } = generateTerrainVertices(
      era.terrainAmplitude,
      era.groundColor,
      offsetX
    )

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Generate indices for the grid
    const indices: number[] = []
    const verticesPerSide = TERRAIN_SEGMENTS + 1
    for (let iz = 0; iz < TERRAIN_SEGMENTS; iz++) {
      for (let ix = 0; ix < TERRAIN_SEGMENTS; ix++) {
        const a = iz * verticesPerSide + ix
        const b = a + 1
        const c = a + verticesPerSide
        const d = c + 1
        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return geo
  }, [era.terrainAmplitude, era.groundColor, offsetX])

  return (
    <mesh
      geometry={geometry}
      position={[offsetX + CHUNK_SIZE / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  )
}

export function Terrain() {
  return (
    <group>
      {Array.from({ length: CHUNK_COUNT }, (_, i) => (
        <TerrainChunk key={i} chunkIndex={i} />
      ))}
    </group>
  )
}
```

**Step 2: Do NOT commit yet** — wait for the other world components.

---

## Task 11: YearMarkers & EventMarkers

**Files:**
- Create: `components/three/world/YearMarkers.tsx`
- Create: `components/three/world/EventMarkers.tsx`

**Step 1: Create YearMarkers**

Floating text labels at each year position along the path.

```tsx
// components/three/world/YearMarkers.tsx
'use client'

import { Text } from '@react-three/drei'
import { yearToPathX } from '@/lib/three/camera-path'
import { START_YEAR, END_YEAR } from '@/lib/three/era'

export function YearMarkers() {
  const years = Array.from(
    { length: END_YEAR - START_YEAR + 1 },
    (_, i) => START_YEAR + i
  )

  return (
    <group>
      {years.map((year) => (
        <Text
          key={year}
          position={[yearToPathX(year), 0.2, -3.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.8}
          color="#1a1a2e"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Outfit-SemiBold.ttf"
          fillOpacity={0.6}
        >
          {String(year)}
        </Text>
      ))}
    </group>
  )
}
```

> **Font note:** We need to download Outfit-SemiBold.ttf to `public/fonts/`. Step 3 below handles this. If the font fails to load, `<Text>` falls back to a default sans-serif.

**Step 2: Create EventMarkers**

Glowing sphere markers at each event date. Clicking enters the room (Phase 3).

```tsx
// components/three/world/EventMarkers.tsx
'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { yearToPathX } from '@/lib/three/camera-path'
import { useAppStore } from '@/lib/store'

const CATEGORY_COLORS: Record<string, string> = {
  fiscalite: '#f59e0b',
  emploi: '#3b82f6',
  crise: '#ef4444',
  reforme: '#8b5cf6',
  social: '#f97316',
  international: '#06b6d4',
}

function EventMarker({
  eventId,
  date,
  title,
  category,
}: {
  eventId: string
  date: string
  title: string
  category: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const enterRoom = useAppStore((s) => s.enterRoom)

  const year = new Date(date).getFullYear()
  const monthFraction = new Date(date).getMonth() / 12
  const x = yearToPathX(year + monthFraction)
  const color = CATEGORY_COLORS[category] || '#a78bfa'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Gentle hover float
    meshRef.current.position.y = 1.5 + Math.sin(clock.elapsedTime * 2) * 0.1
    meshRef.current.scale.setScalar(hovered ? 1.3 : 1)
  })

  return (
    <group position={[x, 0, 0]}>
      <mesh
        ref={meshRef}
        position={[0, 1.5, 0]}
        onClick={() => enterRoom(eventId)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Label below the marker */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.25}
        color="#1a1a2e"
        anchorX="center"
        anchorY="top"
        maxWidth={3}
      >
        {title}
      </Text>
    </group>
  )
}

export function EventMarkers() {
  const events = useAppStore((s) => s.events)

  return (
    <group>
      {events.map((event) => (
        <EventMarker
          key={event.id}
          eventId={event.id}
          date={event.date}
          title={event.title}
          category={event.category ?? 'reforme'}
        />
      ))}
    </group>
  )
}
```

**Step 3: Download Outfit font to public**

Run:
```bash
mkdir -p public/fonts
curl -L "https://fonts.google.com/download?family=Outfit" -o /tmp/outfit.zip && unzip -o /tmp/outfit.zip -d /tmp/outfit && cp /tmp/outfit/static/Outfit-SemiBold.ttf public/fonts/
```

If this fails (Google Fonts download URL can change), fallback: `<Text>` renders fine with the default system font. We can also use `drei`'s default troika font and skip the custom font file. Either way works — the important thing is the text appears.

**Step 4: Do NOT commit yet** — wait for Atmosphere (Task 12).

---

## Task 12: Atmosphere Component

Sky, fog, and directional lighting that change based on the current year/era.

**Files:**
- Create: `components/three/world/Atmosphere.tsx`

**Step 1: Create Atmosphere.tsx**

```tsx
// components/three/world/Atmosphere.tsx
'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { getEraConfig } from '@/lib/three/era'

export function Atmosphere() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const currentYear = useAppStore((s) => s.currentYear)
  const { scene } = useThree()

  useFrame(() => {
    const era = getEraConfig(currentYear)

    // Update fog
    scene.fog = new THREE.FogExp2(era.fogColor, era.fogDensity)
    scene.background = new THREE.Color(era.skyColor)

    // Update directional light
    if (lightRef.current) {
      lightRef.current.intensity = era.lightIntensity
    }
  })

  return (
    <>
      {/* Ambient fill light */}
      <ambientLight intensity={0.4} />

      {/* Main directional light (sun) */}
      <directionalLight
        ref={lightRef}
        position={[50, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Sky dome */}
      <Sky
        distance={450000}
        sunPosition={[100, 40, 50]}
        inclination={0.5}
        azimuth={0.25}
      />
    </>
  )
}
```

**Step 2: Commit all world components together**

```bash
git add \
  components/three/canvas/MainCanvas.tsx \
  components/three/world/Timeline.tsx \
  components/three/world/CameraRig.tsx \
  components/three/world/Terrain.tsx \
  components/three/world/YearMarkers.tsx \
  components/three/world/EventMarkers.tsx \
  components/three/world/Atmosphere.tsx \
  public/fonts/
git commit -m "feat(phase2): add 3D timeline scene — ScrollControls, terrain, markers, atmosphere"
```

---

## Task 13: Timeline Sidebar (DOM Overlay)

Vertical bar on the right side of the screen. Shows the current year. Draggable cursor to jump through time.

**Files:**
- Create: `components/ui/TimelineSidebar.tsx`

**Step 1: Create TimelineSidebar**

```tsx
// components/ui/TimelineSidebar.tsx
'use client'

import { useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { START_YEAR, END_YEAR } from '@/lib/three/era'

const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)

export function TimelineSidebar() {
  const currentYear = useAppStore((s) => s.currentYear)
  const scrollProgress = useAppStore((s) => s.scrollProgress)
  const navigation = useAppStore((s) => s.navigation)
  const trackRef = useRef<HTMLDivElement>(null)

  // Hide sidebar when inside a room
  if (navigation === 'room') return null

  const cursorPercent = scrollProgress * 100

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const y = (e.clientY - rect.top) / rect.height
      // We can't directly set scroll position from outside ScrollControls,
      // but we expose the target year for visual feedback.
      // Full scroll control integration is a Phase 4 enhancement.
      console.log('Jump to year:', Math.floor(START_YEAR + y * (END_YEAR - START_YEAR)))
    },
    []
  )

  return (
    <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2" style={{ height: '60vh' }}>
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-full w-1 cursor-pointer rounded-full bg-white/30"
        onClick={handleTrackClick}
      >
        {/* Cursor */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-[top] duration-200 ease-out"
          style={{ top: `${cursorPercent}%` }}
        >
          <div className="glass-panel flex h-8 items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            {currentYear}
          </div>
        </div>

        {/* Year ticks */}
        {YEARS.map((year) => {
          const percent = ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100
          return (
            <div
              key={year}
              className="absolute left-1/2 h-0.5 w-3 -translate-x-1/2 bg-white/40"
              style={{ top: `${percent}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ui/TimelineSidebar.tsx
git commit -m "feat(phase2): add timeline sidebar with year cursor overlay"
```

---

## Task 14: DataLoader Component

Fetches indicators and events from the API on mount and populates the Zustand store. Renders nothing — pure side-effect component.

**Files:**
- Create: `components/three/canvas/DataLoader.tsx`

**Step 1: Create DataLoader**

```tsx
// components/three/canvas/DataLoader.tsx
'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

const INDICATOR_NAMES = ['pib', 'chomage', 'inflation_ipc']

export function DataLoader() {
  const setIndicators = useAppStore((s) => s.setIndicators)
  const setEvents = useAppStore((s) => s.setEvents)
  const setLoading = useAppStore((s) => s.setLoading)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Fetch all indicators in parallel
        const indicatorPromises = INDICATOR_NAMES.map(async (name) => {
          const res = await fetch(
            `/api/indicators?name=${name}&country=FR&start=2017-01-01&end=2026-12-31`
          )
          if (!res.ok) throw new Error(`Failed to fetch ${name}`)
          const data = await res.json()
          return { name, data }
        })

        // Fetch events
        const eventsPromise = fetch('/api/indicators?type=events').then((r) => {
          if (!r.ok) throw new Error('Failed to fetch events')
          return r.json()
        })

        const [indicators, events] = await Promise.all([
          Promise.all(indicatorPromises),
          eventsPromise,
        ])

        // Populate store
        for (const { name, data } of indicators) {
          setIndicators(name, data)
        }
        setEvents(events)
      } catch (err) {
        console.error('DataLoader error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setIndicators, setEvents, setLoading])

  return null
}
```

**Step 2: Commit**

```bash
git add components/three/canvas/DataLoader.tsx
git commit -m "feat(phase2): add DataLoader component for API data fetching"
```

---

## Task 15: Wire Experience Page & Integration Verification

Now all components exist. Wire them into the experience page, verify the build, and test manually.

**Files:**
- Finalize: `app/experience/page.tsx` (already created in Task 8)
- Modify: `app/page.tsx` (add link to /experience)

**Step 1: Verify experience page wiring**

The file created in Task 8 should already import `MainCanvas`, `TimelineSidebar`, and `DataLoader`. Verify it's correct:

```tsx
// app/experience/page.tsx
'use client'

import { MainCanvas } from '@/components/three/canvas/MainCanvas'
import { TimelineSidebar } from '@/components/ui/TimelineSidebar'
import { DataLoader } from '@/components/three/canvas/DataLoader'

export default function ExperiencePage() {
  return (
    <>
      <DataLoader />
      <MainCanvas />
      <TimelineSidebar />
    </>
  )
}
```

**Step 2: Add a link from the homepage**

Modify `app/page.tsx` — replace the default Next.js scaffold with a simple landing that links to `/experience`:

```tsx
// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1
        className="text-5xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-title)' }}
      >
        Chrono-Macron
      </h1>
      <p className="max-w-lg text-center text-lg text-gray-600">
        Explorez les mandats présidentiels 2017–2027 à travers les données publiques
        françaises, dans un paysage 3D interactif.
      </p>
      <Link
        href="/experience"
        className="glass-panel px-8 py-4 text-lg font-semibold transition-transform hover:scale-105"
        style={{ fontFamily: 'var(--font-title)' }}
      >
        Entrer dans l'expérience →
      </Link>
    </main>
  )
}
```

**Step 3: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass (era, camera-path, terrain-gen, transformers).

**Step 4: Run build**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 5: Manual smoke test**

Run: `npx next dev`
1. Open `http://localhost:3000` → should see the landing page with "Entrer dans l'expérience" link
2. Click the link → should navigate to `/experience`
3. The 3D canvas should render with:
   - A procedural terrain visible
   - Camera moves forward when scrolling
   - Year markers visible along the path
   - Event markers (glowing dodecahedrons) at event positions
   - Atmosphere (sky, fog, lighting) changes as you scroll through eras
   - Timeline sidebar on the right with year cursor
4. Console should show DataLoader fetching indicators and events

**Step 6: Commit everything**

```bash
git add app/experience/page.tsx app/page.tsx app/page.test.tsx
git commit -m "feat(phase2): wire experience page, landing page, integration complete"
```

**Step 7: Final verification commit**

Run: `npx vitest run && npx next build`
Expected: All tests pass, build succeeds.

```bash
git add -A
git commit -m "chore(phase2): Phase 2 complete — 3D timeline rail with scroll navigation"
```

---

## Checklist Summary

| # | Component | Type | Testable? |
|---|-----------|------|-----------|
| 1 | Fonts + CSS tokens | Config | Build check |
| 2 | `lib/three/era.ts` | Pure utility | ✅ 11 unit tests |
| 3 | `lib/three/camera-path.ts` | Pure utility | ✅ 10 unit tests |
| 4 | `lib/three/terrain-gen.ts` | Pure utility | ✅ 6 unit tests |
| 5 | `types/three.ts` | Types | TypeScript check |
| 6 | `CanvasErrorBoundary` + `LoadingScreen` | UI | Visual |
| 7 | `MainCanvas` | R3F wrapper | Visual |
| 8 | `app/experience/page.tsx` | Page route | Visual |
| 9 | `Timeline` + `CameraRig` | R3F scene | Visual |
| 10 | `Terrain` | R3F mesh | Visual |
| 11 | `YearMarkers` + `EventMarkers` | R3F meshes | Visual |
| 12 | `Atmosphere` | R3F lighting | Visual |
| 13 | `TimelineSidebar` | DOM overlay | Visual |
| 14 | `DataLoader` | Side-effect | API check |
| 15 | Integration | Wiring | Build + manual |

**Total: 15 tasks, 27 unit tests, ~12 new files**

---

## Known Limitations (Phase 2 scope)

These are explicitly **deferred to Phase 3/4**:

1. **Terrain chunk LOD / disposal** — all 4 chunks are always rendered. For 100 units this is fine.
2. **Event room entry** — `enterRoom()` is called but Phase 2 doesn't render rooms. The store state changes but nothing happens visually yet.
3. **Timeline sidebar scroll-jump** — clicking the sidebar logs the target year but can't programmatically set ScrollControls offset (Drei limitation). Phase 4 will use a ref workaround.
4. **Mobile joystick** — not needed on the timeline rail (scroll works natively). Added in Phase 3 for rooms.
5. **Accessible fallback** — the landing page is SSR but `/experience` requires WebGL. ErrorBoundary is the fallback for now.
6. **Font file download** — if the Outfit TTF download fails, `<Text>` uses the default troika font. Acceptable for Phase 2.

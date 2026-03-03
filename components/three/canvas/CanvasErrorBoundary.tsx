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

'use client'

import React, { createContext, useContext } from 'react'
import { useAppState } from '@/hooks/useAppState'

type AppStateContextType = ReturnType<typeof useAppState>

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const appState = useAppState()

  return <AppStateContext.Provider value={appState}>{children}</AppStateContext.Provider>
}

export function useAppStateContext() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppStateContext must be used within an AppStateProvider')
  }
  return context
}

'use client'

import { useCallback, useReducer } from 'react'

const MAX_HISTORY = 30

interface HistoryState<T> {
  value: T
  past: T[]
  future: T[]
}

type HistoryAction<T> =
  | { type: 'SET'; updater: T | ((prev: T) => T) }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; value: T }

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'SET': {
      const prev = state.value
      const next = typeof action.updater === 'function' ? (action.updater as (p: T) => T)(prev) : action.updater
      if (next === prev) return state
      return {
        value: next,
        past: [...state.past.slice(-(MAX_HISTORY - 1)), prev],
        future: [],
      }
    }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return { value: previous, past: state.past.slice(0, -1), future: [state.value, ...state.future].slice(0, MAX_HISTORY) }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return { value: next, past: [...state.past, state.value].slice(-MAX_HISTORY), future: state.future.slice(1) }
    }
    case 'RESET':
      return { value: action.value, past: [], future: [] }
    default:
      return state
  }
}

export function useGradeHistory<T>(initialValue: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, { value: initialValue, past: [], future: [] } as HistoryState<T>)

  const setValue = useCallback((updater: T | ((prev: T) => T)) => {
    dispatch({ type: 'SET', updater })
  }, [])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const reset = useCallback((value: T) => dispatch({ type: 'RESET', value }), [])

  return {
    value: state.value,
    setValue,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyCount: state.past.length,
  }
}
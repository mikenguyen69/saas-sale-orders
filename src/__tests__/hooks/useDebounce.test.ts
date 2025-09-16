import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

// Mock timers
jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    expect(result.current).toBe('initial')

    // Change the value
    rerender({ value: 'updated', delay: 500 })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time by 250ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Value should still be the same
    expect(result.current).toBe('initial')

    // Fast-forward time by another 250ms (completing the delay)
    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Now the value should be updated
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    // Change value multiple times rapidly
    rerender({ value: 'first', delay: 500 })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'second', delay: 500 })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender({ value: 'final', delay: 500 })

    // Value should still be initial
    expect(result.current).toBe('initial')

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should have the final value
    expect(result.current).toBe('final')
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 1000 },
    })

    rerender({ value: 'updated', delay: 1000 })

    // Should not update after 500ms
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')

    // Should update after 1000ms total
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })

  it('should work with different data types', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: { count: 0 }, delay: 300 },
    })

    expect(result.current).toEqual({ count: 0 })

    rerender({ value: { count: 1 }, delay: 300 })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toEqual({ count: 1 })
  })
})

import { useCallback, useEffect, useRef, useState } from 'react'
import { ToastContext } from './toastContext.js'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, tone = 'success') => {
    const id = ++nextId.current
    setToasts((current) => [...current, { id, message, tone }])
    timers.current.set(id, window.setTimeout(() => dismiss(id), 4500))
  }, [dismiss])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  return <ToastContext.Provider value={{ notify }}>
    {children}
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-4 text-sm shadow-lg ${toast.tone === 'error' ? 'border-rose-200 bg-white text-rose-800' : 'border-emerald-200 bg-white text-emerald-800'}`}>
        <span>{toast.message}</span>
        <button type="button" onClick={() => dismiss(toast.id)} className="-mr-1 -mt-1 rounded p-1 text-current hover:bg-black/5 focus-visible:outline" aria-label="Dismiss notification">×</button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

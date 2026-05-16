import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext({ push: () => {} })

let _idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((kind, title, body) => {
    const id = ++_idCounter
    setToasts((t) => [...t, { id, kind, title, body }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const api = {
    push,
    success: (t, b) => push('success', t, b),
    error: (t, b) => push('error', t, b),
    info: (t, b) => push('info', t, b),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div className="toast-icon">
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="toast-title">{t.title}</div>
              {t.body && <div className="toast-body">{t.body}</div>}
            </div>
            <button className="toast-close" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

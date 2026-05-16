import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size }) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex justify-between items-center mb-16">
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="close">✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

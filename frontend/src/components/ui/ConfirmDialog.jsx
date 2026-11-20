import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ title, description, confirmLabel = 'Delete', busy = false, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!dialog.open) dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onCancel() }} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/45">
    <div className="p-6">
      <h2 id="confirm-dialog-title" className="text-lg font-semibold">{title}</h2>
      <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
        <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">{busy ? 'Deleting…' : confirmLabel}</button>
      </div>
    </div>
  </dialog>
}

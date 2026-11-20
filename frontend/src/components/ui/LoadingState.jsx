export default function LoadingState({ label = 'Loading…', className = '' }) {
  return <div className={`flex items-center justify-center gap-3 p-8 text-sm text-slate-600 ${className}`} role="status" aria-live="polite">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 motion-reduce:animate-none" aria-hidden="true" />
    <span>{label}</span>
  </div>
}

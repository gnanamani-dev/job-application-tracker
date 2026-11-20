import { useEffect } from 'react'
import { NavLink } from 'react-router'
import NavIcon from './NavIcon.jsx'

const links = [
  { to: '/', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/applications', label: 'Applications', icon: 'briefcase' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
]

export default function Sidebar({ open, onNavigate }) {
  useEffect(() => {
    if (!open) return undefined
    function closeOnEscape(event) { if (event.key === 'Escape') onNavigate() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onNavigate])

  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" aria-label="Close navigation" onClick={onNavigate} />}
      <aside id="primary-navigation" aria-label="Primary navigation" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform duration-200 lg:visible lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">C</div>
          <div><p className="font-semibold tracking-tight text-slate-900">Careerly</p><p className="text-xs text-slate-500">Job search workspace</p></div>
        </div>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><NavIcon name={link.icon} />{link.label}</NavLink>)}
        </nav>
        <div className="mt-auto rounded-2xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">A little progress adds up</p><p className="mt-1 text-xs leading-5 text-slate-500">Keep your applications organized and your next step clear.</p><div className="mt-4 h-1.5 rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-blue-500" /></div></div>
      </aside>
    </>
  )
}

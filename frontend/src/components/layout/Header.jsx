import NavIcon from './NavIcon.jsx'
import { useAppContext } from '../../context/useAppContext.js'
import { clearTokens } from '../../api/client.js'
import { useToast } from '../../context/useToast.js'

export default function Header({ onMenuClick, menuOpen = false }) {
  const { state, dispatch } = useAppContext()
  const username = state.auth.user?.username || 'Account'
  const notify = useToast()
  function logout() {
    clearTokens()
    dispatch({ type: 'auth/logout' })
    notify('You have signed out.', 'success')
  }
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenuClick} aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={menuOpen}><NavIcon name="menu" /></button><div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex"><span>Workspace</span><span>/</span><span className="font-medium text-slate-700">My job search</span></div></div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:gap-3 sm:pl-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-xs font-bold uppercase text-amber-800">{username.slice(0, 2)}</div><div className="hidden sm:block"><p className="text-sm font-semibold leading-4 text-slate-800">{username}</p><button onClick={logout} className="mt-1 text-xs text-blue-600 hover:text-blue-800">Sign out</button></div><button onClick={logout} className="text-xs font-medium text-blue-600 sm:hidden" aria-label="Sign out">Exit</button></div>
      </div>
    </header>
  )
}

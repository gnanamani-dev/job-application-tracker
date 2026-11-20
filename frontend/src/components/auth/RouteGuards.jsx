import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppContext } from '../../context/useAppContext.js'
import LoadingState from '../ui/LoadingState.jsx'

function AuthLoading() {
  return <div className="grid min-h-screen place-items-center"><LoadingState label="Restoring your session…" /></div>
}

export function ProtectedRoute() {
  const { state } = useAppContext()
  const location = useLocation()
  if (state.auth.status === 'loading') return <AuthLoading />
  return state.auth.user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function GuestRoute() {
  const { state } = useAppContext()
  if (state.auth.status === 'loading') return <AuthLoading />
  return state.auth.user ? <Navigate to="/" replace /> : <Outlet />
}

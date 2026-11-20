import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { authApi, getApiErrorMessage } from '../api/services.js'
import { clearTokens, saveTokens } from '../api/client.js'
import { useAppContext } from '../context/useAppContext.js'
import { useToast } from '../context/useToast.js'

function AuthShell({ title, subtitle, children, footer }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"><div className="mb-7 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-bold text-white">C</span><span className="font-semibold text-slate-900">Careerly</span></div><h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p>{children}<p className="mt-6 text-center text-sm text-slate-500">{footer}</p></section></main>
}

function Field({ label, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input {...props} className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
}

export function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { dispatch } = useAppContext()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const tokens = await authApi.login(form)
      saveTokens(tokens)
      const user = await authApi.currentUser()
      dispatch({ type: 'auth/ready', payload: user })
      notify('You are signed in.', 'success')
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) { clearTokens(); setError(getApiErrorMessage(requestError)) } finally { setBusy(false) }
  }
  return <AuthShell title="Welcome back" subtitle="Sign in to continue tracking your job search." footer={<>New here? <Link className="font-semibold text-blue-600" to="/register">Create an account</Link></>}><form onSubmit={submit} className="mt-7 space-y-4"><Field label="Username" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /><Field label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<button disabled={busy} className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button></form></AuthShell>
}

export function RegistrationPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { dispatch } = useAppContext()
  const notify = useToast()
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    if (form.password !== form.password_confirmation) { setError('The passwords do not match.'); setBusy(false); return }
    try {
      await authApi.register(form)
      const tokens = await authApi.login({ username: form.username, password: form.password })
      saveTokens(tokens)
      const user = await authApi.currentUser()
      dispatch({ type: 'auth/ready', payload: user })
      notify('Your account is ready.', 'success')
      navigate('/', { replace: true })
    } catch (requestError) { clearTokens(); setError(getApiErrorMessage(requestError)) } finally { setBusy(false) }
  }
  return <AuthShell title="Create your account" subtitle="Keep your opportunities organized in one place." footer={<>Already registered? <Link className="font-semibold text-blue-600" to="/login">Sign in</Link></>}><form onSubmit={submit} className="mt-7 space-y-4"><Field label="Username" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /><Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><Field label="Confirm password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<button disabled={busy} className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button></form></AuthShell>
}

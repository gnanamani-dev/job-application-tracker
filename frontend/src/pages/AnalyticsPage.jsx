import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardApi, getApiErrorMessage } from '../api/services.js'
import PageHeading from '../components/ui/PageHeading.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'

function RateCard({ label, value, explanation }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-900">{value}%</p><p className="mt-2 text-xs leading-5 text-slate-500">{explanation}</p></article>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    dashboardApi.analytics().then((data) => { if (active) setAnalytics(data) })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const months = (analytics?.monthly_trends || []).map((item) => ({ ...item, label: new Date(item.year, item.month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) }))
  return <>
    <PageHeading eyebrow="Your job search" title="Analytics" description="Understand your application activity using your saved job search data." />
    {error && <p className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{error}</p>}
    {loading ? <div className="rounded-2xl bg-white"><LoadingState label="Loading analytics…" /></div> : <>
      <div className="grid gap-4 sm:grid-cols-2"><RateCard label="Interview rate" value={analytics?.interview_rate ?? 0} explanation="Current Interview and Technical Round applications divided by all applications." /><RateCard label="Offer rate" value={analytics?.offer_rate ?? 0} explanation="Current Offer applications divided by all applications." /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-slate-900">Applications by status</h2><p className="mt-1 text-sm text-slate-500">Current number of applications at each stage</p>{analytics?.applications_by_status?.some((item) => item.count > 0) ? <div className="mt-5 h-72 w-full" role="img" aria-label="Bar chart showing applications by status"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.applications_by_status} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Applications" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="mt-8 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Add applications to see your status distribution.</p>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-slate-900">Monthly application trends</h2><p className="mt-1 text-sm text-slate-500">Applications grouped by the month you applied</p>{months.length ? <div className="mt-5 h-72 w-full" role="img" aria-label="Line chart showing monthly application trends"><ResponsiveContainer width="100%" height="100%"><LineChart data={months} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="application_count" name="Applications" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div> : <p className="mt-8 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Monthly activity will appear after you add applications.</p>}</section>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">Rates use each application’s current status because the tracker does not store status history. When you have no applications, both rates are 0%.</p>
    </>}
  </>
}

import { Link } from 'react-router'

export default function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f6f7fb] px-6 text-center"><div><p className="text-sm font-semibold text-blue-600">404</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1><p className="mt-3 text-slate-500">The page you’re looking for doesn’t exist.</p><Link to="/" className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Back to overview</Link></div></main>
}

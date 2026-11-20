import { useState } from 'react'
import { Outlet } from 'react-router'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)
  return <div className="min-h-screen bg-[#f6f7fb]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:shadow">Skip to main content</a><Sidebar open={sidebarOpen} onNavigate={closeSidebar} /><div className="min-h-screen lg:pl-64"><Header menuOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(true)} /><main id="main-content" tabIndex="-1" className="mx-auto max-w-[1440px] px-4 py-7 outline-none sm:px-8 sm:py-9"><Outlet /></main></div></div>
}

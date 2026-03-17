import React from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  sidebarProps: React.ComponentProps<typeof Sidebar>
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebarProps, children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar {...sidebarProps} />
      <main className="ml-72 flex-1 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout

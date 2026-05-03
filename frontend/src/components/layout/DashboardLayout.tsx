import React from 'react'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/stores/useAuthStore'

interface DashboardLayoutProps {
  sidebarProps: any // Use any for simplicity in merging
  children: React.ReactNode
  blur?: boolean
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebarProps, children, blur }) => {
  const { user } = useAuthStore()
  
  const mergedSidebarProps = {
    ...sidebarProps,
    user: user ? {
      name: user.fullName,
      role: user.role?.name?.replace('ROLE_', '') || 'User',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`
    } : undefined
  }

  return (
    <div className="flex min-h-screen">
      <div className={`transition-all duration-500 ${blur ? 'blur-md pointer-events-none' : ''}`}>
        <Sidebar {...mergedSidebarProps} />
      </div>
      <main className={`ml-72 flex-1 flex flex-col min-h-screen animate-fade-in transition-all duration-500 ${blur ? 'blur-md pointer-events-none' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout

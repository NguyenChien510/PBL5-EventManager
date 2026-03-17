import React from 'react'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'locked' | 'editing' | 'approved'
  label?: string
  className?: string
}

const statusStyles: Record<string, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  active: { bg: '', text: 'text-green-600', dot: 'bg-green-500', defaultLabel: 'Hoạt động' },
  approved: { bg: '', text: 'text-green-600', dot: 'bg-green-500', defaultLabel: 'Đã duyệt' },
  pending: { bg: '', text: 'text-orange-500', dot: 'bg-orange-500 animate-pulse', defaultLabel: 'Chờ duyệt' },
  editing: { bg: '', text: 'text-blue-500', dot: 'bg-blue-500', defaultLabel: 'Đang sửa lại' },
  rejected: { bg: '', text: 'text-red-500', dot: 'bg-red-500', defaultLabel: 'Bị từ chối' },
  locked: { bg: '', text: 'text-red-500', dot: 'bg-red-500', defaultLabel: 'Bị khóa' },
  inactive: { bg: '', text: 'text-slate-400', dot: 'bg-slate-400', defaultLabel: 'Không hoạt động' },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const style = statusStyles[status] || statusStyles.inactive

  return (
    <span className={`flex items-center gap-1.5 ${style.text} font-bold text-xs uppercase tracking-tight ${className}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {label || style.defaultLabel}
    </span>
  )
}

export default StatusBadge

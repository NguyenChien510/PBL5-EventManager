import React from 'react'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'locked' | 'approved' | 'upcoming' | 'sold_out' | 'ended' | 'cancelled'
  label?: string
  className?: string
}

const statusStyles: Record<string, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', defaultLabel: 'Hoạt động' },
  approved: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', defaultLabel: 'Đã duyệt' },
  upcoming: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', defaultLabel: 'Sắp diễn ra' },
  pending: { bg: 'bg-orange-50', text: 'text-orange-500', dot: 'bg-orange-500 animate-pulse', defaultLabel: 'Chờ duyệt' },
  rejected: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500', defaultLabel: 'Bị từ chối' },
  locked: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-500', defaultLabel: 'Bị khóa' },
  inactive: { bg: 'bg-slate-50', text: 'text-slate-400', dot: 'bg-slate-400', defaultLabel: 'Không hoạt động' },
  sold_out: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', defaultLabel: 'Hết vé' },
  ended: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', defaultLabel: 'Đã kết thúc' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', defaultLabel: 'Đã hủy' },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'inactive'
  const style = statusStyles[normalizedStatus]

  // Smart fallback: If status is not in mapping, use raw status string and default gray style
  const displayText = label || style?.defaultLabel || status || 'N/A'
  const textClass = style?.text || 'text-slate-600'
  const bgClass = style?.bg || 'bg-slate-50'
  const dotClass = style?.dot || 'bg-slate-400'

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${bgClass} ${textClass} font-black text-[10px] uppercase tracking-wider border border-current/10 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass} shadow-sm`} />
      {displayText}
    </span>
  )
}

export default StatusBadge

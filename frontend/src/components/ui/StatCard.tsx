import React from 'react'
import Icon from './Icon'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  iconBg?: string
  iconColor?: string
  trend?: { value: string; positive: boolean }
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  trend,
  className = '',
}) => {
  return (
    <div className={`bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between ${className}`}>
      <div className="space-y-1">
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        {trend && (
          <p className={`text-xs font-bold flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            <Icon name={trend.positive ? 'trending_up' : 'trending_down'} size="sm" />
            {trend.value}
          </p>
        )}
      </div>
      <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center`}>
        <Icon name={icon} className={`${iconColor} text-3xl`} />
      </div>
    </div>
  )
}

export default StatCard

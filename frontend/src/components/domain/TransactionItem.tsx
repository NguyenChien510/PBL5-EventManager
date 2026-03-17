import React from 'react'
import Icon from '../ui/Icon'

interface TransactionItemProps {
  icon: string
  title: string
  date: string
  amount: string
  positive: boolean
}

const TransactionItem: React.FC<TransactionItemProps> = ({ icon, title, date, amount, positive }) => {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="icon-3d-mini">
          <Icon name={icon} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-500">{date}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
        {positive ? '+' : '-'}{amount}
      </span>
    </div>
  )
}

export default TransactionItem

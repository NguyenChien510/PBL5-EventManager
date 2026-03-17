import React from 'react'
import Icon from '../ui/Icon'

interface TicketCardProps {
  image: string
  title: string
  ticketId: string
  date: string
  seat: string
  location: string
  type: 'Premium' | 'Standard' | 'VIP'
  status: 'active' | 'pending' | 'used'
  onViewDetail?: () => void
}

const typeStyles = {
  Premium: 'bg-primary/10 text-primary',
  Standard: 'bg-slate-100 text-slate-500',
  VIP: 'bg-yellow-50 text-yellow-600',
}

const TicketCard: React.FC<TicketCardProps> = ({
  image,
  title,
  ticketId,
  date,
  seat,
  location,
  type,
  status,
  onViewDetail,
}) => {
  const isDisabled = status === 'used'

  return (
    <div className="section-card flex flex-col md:flex-row items-center p-5 gap-6 group hover:border-primary/30 transition-all duration-300">
      <div className="w-full md:w-32 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden shrink-0">
        <img
          alt={title}
          className={`w-full h-full object-cover ${isDisabled ? 'grayscale opacity-60' : ''}`}
          src={image}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${typeStyles[type]}`}>
            {type}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">{ticketId}</span>
        </div>
        <h4 className="text-lg font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
          {title}
        </h4>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" size="sm" className="text-slate-400" />
            <span className="text-sm text-slate-600 font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="event_seat" size="sm" className="text-slate-400" />
            <span className="text-sm text-slate-600 font-medium">{seat}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="location_on" size="sm" className="text-slate-400" />
            <span className="text-sm text-slate-600 font-medium">{location}</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 w-full md:w-auto">
        {status === 'active' ? (
          <button
            onClick={onViewDetail}
            className="w-full md:w-auto btn-primary flex items-center justify-center gap-2"
          >
            <Icon name="qr_code_2" size="sm" />
            Chi tiết vé
          </button>
        ) : status === 'pending' ? (
          <button className="w-full md:w-auto px-6 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-lg cursor-not-allowed">
            Chờ mở vé
          </button>
        ) : (
          <button className="w-full md:w-auto px-6 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-lg cursor-not-allowed">
            Đã sử dụng
          </button>
        )}
      </div>
    </div>
  )
}

export default TicketCard

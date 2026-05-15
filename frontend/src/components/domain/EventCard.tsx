import React from 'react'
import Icon from '../ui/Icon'

interface EventCardProps {
  image: string
  title: string
  date: string
  time: string
  location: string
  price: string
  category?: string
  categoryColor?: string
  rating?: number
  ticketsLeft?: number
  totalTickets?: number
  onBuyClick?: () => void
}

const EventCard: React.FC<EventCardProps> = ({
  image,
  title,
  date,
  time,
  location,
  price,
  category,
  categoryColor = 'bg-primary/10 text-primary',
  rating,
  ticketsLeft,
  totalTickets,
  onBuyClick,
}) => {
  const ticketPercent = ticketsLeft && totalTickets ? ((totalTickets - ticketsLeft) / totalTickets) * 100 : 0

  return (
    <div className="event-card group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        {category && (
          <span
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${!categoryColor?.startsWith('#') ? categoryColor : 'text-white'}`}
            style={categoryColor?.startsWith('#') ? { backgroundColor: categoryColor } : {}}
          >
            {category}
          </span>
        )}


        {rating && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
            <Icon name="star" size="sm" className="text-yellow-400" filled />
            {rating}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-tight">{title}</h3>

        <div className="space-y-1.5 mb-3 flex-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Icon name="calendar_today" size="xs" className="text-primary" />
            <span className="font-medium">{date} • {time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Icon name="location_on" size="xs" className="text-primary" />
            <span className="truncate font-medium">{location}</span>
          </div>
        </div>

        {/* Ticket availability */}
        {ticketsLeft !== undefined && totalTickets && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500">Còn {ticketsLeft} vé</span>
              <span className="font-bold text-primary">{Math.round(ticketPercent)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ticketPercent}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none mb-0.5">Từ</p>
            <p className="text-[14px] font-black text-primary leading-snug break-words">{price}</p>
          </div>
          <button
            onClick={onBuyClick}
            className="px-3.5 py-2 bg-primary hover:bg-blue-600 text-white text-[11px] font-black rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.35)] flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 group-hover:scale-[1.02]"
          >
            <Icon name="confirmation_number" size="xs" />
            Mua vé
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventCard

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
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Icon name="calendar_today" size="sm" className="text-primary" />
            <span>{date} • {time}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Icon name="location_on" size="sm" className="text-primary" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Ticket availability */}
        {ticketsLeft !== undefined && totalTickets && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Còn {ticketsLeft} vé</span>
              <span className="font-bold text-primary">{Math.round(ticketPercent)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ticketPercent}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Từ</p>
            <p className="text-lg font-extrabold text-primary">{price}</p>
          </div>
          <button
            onClick={onBuyClick}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
          >
            <Icon name="confirmation_number" size="sm" />
            Mua vé
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventCard

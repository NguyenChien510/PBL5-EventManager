import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'
import { apiClient } from '../utils/axios'

const sidebarConfig = userSidebarConfig

const UserHistory = () => {
  const navigate = useNavigate()
  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, commentsRes] = await Promise.all([
          apiClient.get('/tickets/my'),
          apiClient.get('/comments/my')
        ])

        const checkedInTickets = ticketsRes.data.filter((t: any) => t.status === 'checked_in' || t.status === 'CHECKED_IN' || t.status === 'used')
        const myComments = commentsRes.data

        // Group by eventId
        const eventMap = new Map()
        checkedInTickets.forEach((t: any) => {
          const eId = t.eventId
          if (!eventMap.has(eId)) {
            const comment = myComments.find((c: any) => c.eventId === eId)
            eventMap.set(eId, {
              title: t.title,
              date: t.date,
              location: t.location,
              image: t.image,
              rated: !!comment,
              rating: comment?.rating || 0,
              review: comment?.content || '',
              eventId: eId
            })
          }
        })

        setHistoryEvents(Array.from(eventMap.values()))
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Sự kiện đã tham gia" subtitle="Lịch sử tham dự sự kiện" />
      <div className="p-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {historyEvents.length > 0 ? historyEvents.map((event, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-6 hover:shadow-md transition-all">
                <img src={event.image} alt={event.title} className="w-32 h-24 rounded-xl object-cover shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Icon name="calendar_today" size="sm" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Icon name="location_on" size="sm" /> {event.location}</span>
                  </div>
                  {event.rated ? (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, s) => (
                          <Icon key={s} name="star" size="sm" className={s < event.rating ? 'text-yellow-400' : 'text-slate-200'} filled />
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 italic">"{event.review}"</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, s) => (
                          <button key={s} className="text-slate-200 hover:text-yellow-400 transition-colors">
                            <Icon name="star" size="sm" />
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => navigate(`/reviews?eventId=${event.eventId}`)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Viết đánh giá
                      </button>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">Đã tham gia</span>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Icon name="event_available" className="text-slate-300 text-5xl mb-4 mx-auto" />
                <p className="text-slate-500 font-bold">Bạn chưa tham gia sự kiện nào.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default UserHistory

import { Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'

const sidebarConfig = userSidebarConfig

const historyEvents = [
  {
    title: 'Rock Festival Vietnam 2024',
    date: '15 Th09, 2024',
    location: 'SVĐ Mỹ Đình, Hà Nội',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    rated: true,
    rating: 5,
    review: 'Tuyệt vời! Âm thanh đỉnh cao, sân khấu hoành tráng.',
  },
  {
    title: 'TEDx Hà Nội 2024',
    date: '01 Th08, 2024',
    location: 'Nhà hát lớn Hà Nội',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    rated: false,
    rating: 0,
    review: '',
  },
]

const UserHistory = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Sự kiện đã tham gia" subtitle="Lịch sử tham dự sự kiện" />
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          {historyEvents.map((event, i) => (
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
                    <button className="text-xs font-bold text-primary hover:underline">Viết đánh giá</button>
                  </div>
                )}
              </div>
              <div className="shrink-0">
                <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">Đã tham gia</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UserHistory

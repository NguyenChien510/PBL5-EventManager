import { Icon, Avatar } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant', brandSub: 'Organizer Hub', brandIcon: 'event_available',
  sections: [{ links: [
    { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
    { to: '/organizer/feedback', label: 'Phản hồi', icon: 'rate_review' },
  ]}],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const reviews = [
  { name: 'Nguyễn Minh Khoa', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3oNjRKUaraU_NODDJZvWtFAnbxhbWeHMkDA_cxVKeoY2xkitK8HmVPJqJefRYJEUXVuUPKPirEu0CaQYryBLCMUPPIUvnpRY-ZFYoC0at1PYDINVMaFtFGy1JyHVP7UV-43-zQZgRiXxVrUGaaweX3Y2to3siTHMmPS5waguUn2GbjKQdKvpr5EuKriYBIOpFporWMh3Ww-F_1KeFTUcvFFR_LRoohxwitl4-RtT8IECfeZwFEaC3wnAJMoPJjWU5H7EeNIQeoA', rating: 5, event: 'Concert Year End', date: '3 ngày trước', text: 'Sự kiện tuyệt vời! Âm thanh và ánh sáng đỉnh cao, MC dẫn chuyện hay. Sẽ quay lại lần sau!', reply: '' },
  { name: 'Trần Thu Hà', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGFr9U36M42SlEPp4bm2BKx5OMqjRofYUGXglR0gTiDnoOLtn_VjatmT8IAg5doXGWEZX3kMpapWZTdqXXYzHWKeiXcS8c6Z3GOQPj_s0fYx1TZCvVdClhtifuphmVw7MBHUTefNTKELy22Bezs0cJR-EzuqOnNNi3j40MD-ZIizbhAnI0wzMNqZ2mfk4ypthH-EuCoE2Snn1cNXgPmz2kmodYA9O7oW1FeKfyISui_xsoyDC6m8LrZOiuHTwxSGMpuezwDtnGCAg', rating: 4, event: 'AI Summit', date: '1 tuần trước', text: 'Nội dung rất hay, speaker chất lượng. Tuy nhiên hệ thống check-in hơi chậm.', reply: 'Cảm ơn bạn! Chúng tôi sẽ cải thiện check-in lần sau.' },
  { name: 'Phạm Đức Anh', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4nSqQqXttvqISmUA-Hti29vdc0r0HR7vMXAQSMWFh_h3ZMBlKkCCE_XbHFujqvuuUY-gUiN32QOZsuxXYuynd4YUWxvFFhVuht6apdcsGWJG5m4O92ZI1ckJNMwlMK7p0Wq1YvEnvesHEsciItPizN99r36Ug631akzB_Ky2k-8y64gfwZjHHfdizDi4Xew_8dAZwjT9k1knMp-5rNUlWUl6sTgeEMn3_RADhcUAW3suyoS1igklheLCdwpV7Equ8WD-ZmZ2O9LA', rating: 3, event: 'Workshop UX', date: '2 tuần trước', text: 'Workshop ổn nhưng phòng hơi nhỏ và đông quá. Cần chia nhóm nhỏ hơn.', reply: '' },
]

const OrganizerFeedback = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Phản hồi Khách mời" subtitle="Quản lý đánh giá và phản hồi" />
      <div className="p-8 space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-extrabold text-yellow-500">4.5</span>
            </div>
            <div>
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4].map((i) => <Icon key={i} name="star" size="sm" className="text-yellow-400" filled />)}
                <Icon name="star_half" size="sm" className="text-yellow-400" filled />
              </div>
              <p className="text-sm text-slate-500 font-medium">245 đánh giá tổng cộng</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-sm font-bold text-slate-500 mb-3">Phân bố đánh giá</h4>
            {[5,4,3,2,1].map((star) => (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs w-4 font-bold">{star}</span>
                <Icon name="star" size="sm" className="text-yellow-400" filled />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 3}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8">{star === 5 ? '60%' : star === 4 ? '25%' : star === 3 ? '10%' : '3%'}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-sm font-bold text-slate-500 mb-3">Chưa phản hồi</h4>
            <p className="text-3xl font-extrabold text-primary mb-1">12</p>
            <p className="text-sm text-slate-500">đánh giá cần trả lời</p>
            <button className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">Xem ngay</button>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <Avatar src={review.avatar} size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-sm">{review.name}</h4>
                      <p className="text-xs text-slate-400">{review.event} • {review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, s) => (
                        <Icon key={s} name="star" size="sm" className={s < review.rating ? 'text-yellow-400' : 'text-slate-200'} filled />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{review.text}</p>
                  {review.reply ? (
                    <div className="ml-6 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                      <p className="text-xs font-bold text-primary mb-1">Phản hồi của bạn:</p>
                      <p className="text-sm text-slate-600">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input type="text" placeholder="Viết phản hồi..." className="flex-1 input-field text-sm" />
                      <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">Gửi</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerFeedback

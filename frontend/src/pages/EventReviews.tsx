import { Link } from 'react-router-dom'
import { Icon, Avatar } from '../components/ui'

const emotions = [
  { emoji: '😠', label: 'Tệ', hoverColor: 'hover:bg-red-100' },
  { emoji: '😕', label: 'Tạm', hoverColor: 'hover:bg-orange-100' },
  { emoji: '😊', label: 'Tuyệt', hoverColor: '', active: true },
  { emoji: '🤩', label: 'Rất đỉnh', hoverColor: 'hover:bg-green-100' },
  { emoji: '🔥', label: 'Cháy hết mình', hoverColor: 'hover:bg-pink-100' },
]

const communityStats = [
  { label: 'Không khí', value: 95 },
  { label: 'Tổ chức', value: 88 },
  { label: 'Giá trị', value: 92 },
]

const reviews = [
  {
    name: 'Minh Anh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1fSuX4EIgTbNoMZv2nBiouar0whSnT32YxLwEdm_2MAP1PPDiWBjQLW-5WvhyySpRy2W39IZod37qJtT5pf-4Q_7tARBBeHCn1Hfp-cRFpac9Z5XpkoKk7oboJ6121CNjAMq3zB8xTNJFVtfeu33h-RumBYRPU6R7TElt_kcF24rQYtPK5cRCg__KB3DPboCcvNl523iYd4olQkUoOhVhx20DT_bEaHz7SOURH7TUYa1bdwDEhygi5ptdW4aDQ0hoBwD9r2jQWkU',
    rating: 5,
    text: '"Sự kiện quá tuyệt vời! Âm thanh và ánh sáng thực sự bùng nổ. Chắc chắn sẽ tham gia lại vào năm sau."',
  },
  {
    name: 'Quốc Huy',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8k_p7sIJHUSAc6g34phKPn50q6Edr7Gkddwb4DbdaudqL6F7XGGucEsvo-KvDExNL8-wdHsXwoJ_hzP_W5l9d3XWZgFHAoZQ6FgiqsuSBghChP6NN3dP9cM5egvaqe89goxsVn2snQEeC205ZseQHZ8JzML8N1TJfbTt1nAN2AgoTuqzM_ecBMrk9l5QasaXsceHPOZC_surWQP-_t--te4Qfg7yMJFYmr8_0ka04GR6gbtvdKRgB4yl_1A-WYl-Ll0AeSRnoo8k',
    rating: 4,
    text: '"Đồ uống hơi đắt một chút nhưng không khí thì không thể chê vào đâu được. 10 điểm cho ban tổ chức!"',
  },
]

const EventReviews = () => {
  return (
    <div className="min-h-screen bg-background-light font-display">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-20 lg:px-40 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="confirmation_number" className="text-white text-sm" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">EventHub</h2>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/explore" className="text-sm font-semibold hover:text-primary transition-colors">Sự kiện</Link>
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Marketplace</a>
              <Link to="/tickets" className="text-sm font-semibold hover:text-primary transition-colors">Vé của tôi</Link>
              <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Cộng đồng</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-50 rounded-full px-4 py-2 items-center gap-2 border border-slate-200/60">
              <Icon name="search" className="text-gray-500" size="sm" />
              <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-40" placeholder="Tìm kiếm..." />
            </div>
            <button className="p-2 bg-slate-50 rounded-full hover:bg-primary/10 transition-colors">
              <Icon name="notifications" />
            </button>
            <Avatar
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2HRIli8yBxzlm0WBG4wP9gCMolQNvUCsc7v0BfgIkaQGbeuJORLJjCEBsSsFB39qd21e-9D7-U7uUWkovdcU6ZN-1vbea-zuDXh2i3BifAEE3c2aymsxrvTlMTVtSWrKSDGplV6WodFcP_bF71M6EL5g7RaUIFUV5qY3RFx9lUnDQLBdeTZHTYpKo9S4PH_4RScq6uIrV3RQsjtZP4lsEwtwH2-rDdSMpV0AakJ7iI40GsMWPE0N2PfyZAZuHfqbc8Vovt6SJJEM"
              size="md"
              ring
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 lg:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <Icon name="chevron_right" size="sm" className="text-xs" />
          <Link to="/history" className="hover:text-primary transition-colors">Sự kiện đã tham gia</Link>
          <Icon name="chevron_right" size="sm" className="text-xs" />
          <span className="text-primary font-bold">Đánh giá sự kiện</span>
        </nav>

        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Chia sẻ trải nghiệm của bạn</h1>
            <p className="text-lg text-gray-600">Cảm ơn bạn đã tham gia 'Neon Summer Festival 2024'. Ý kiến của bạn sẽ giúp cộng đồng và ban tổ chức tốt hơn.</p>
          </div>
          <button className="bg-white border border-gray-200 px-6 py-3 rounded-full font-bold shadow-sm hover:shadow-md transition-all">
            Xem chi tiết sự kiện
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Feedback Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Context */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-6 items-center">
              <div className="w-32 h-20 rounded-lg overflow-hidden shrink-0">
                <img alt="Event" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGolH6hGAM8hxXlZWNuz2sEnZemSRZLjXbc3-teTvED4RcZsaH_sXP8N-6T76BdLvmLk7dtls7NVf9cZiv0eR_0E_jbZTNhr2rtId1DB6_pawxr9EnGbj_dMKrVD-Vhhw3lkQJ6PKSc1pMeUaxoSoBWzfRUcWwfD_oJ2upyaFjAHrr8Pvaeq4iFkvYiUTVDSunDmtASbuNw4Sgznxwg4G_lr9bmdNg5zrrULK-8eS0qdvDJIT7n-vLYhwfEPAEHQBQtJaFZiMbTko" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full mb-1 inline-block">ĐÃ HOÀN THÀNH</span>
                <h3 className="text-xl font-bold">Neon Summer Festival 2024</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Icon name="calendar_today" size="sm" /> 15 tháng 8, 2024 • Ho Chi Minh City
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="space-y-10">
                {/* Emotion Rating */}
                <section className="text-center">
                  <h2 className="text-2xl font-bold mb-6">Không khí sự kiện thế nào?</h2>
                  <div className="flex justify-center gap-4 sm:gap-8">
                    {emotions.map((e) => (
                      <button key={e.label} className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                          e.active
                            ? 'bg-primary/20 text-4xl ring-4 ring-primary ring-offset-4'
                            : `bg-gray-100 ${e.hoverColor}`
                        }`}>{e.emoji}</div>
                        <span className={`text-xs font-bold ${e.active ? 'text-primary' : 'text-gray-500'}`}>{e.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Text */}
                <section>
                  <label className="block text-lg font-bold mb-3">Bạn muốn nhắn gửi gì thêm không? <span className="text-primary">*</span></label>
                  <textarea className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/50 text-base" placeholder="Hãy kể về kỷ niệm đáng nhớ nhất của bạn..." rows={4} />
                </section>

                {/* Media Upload */}
                <section>
                  <label className="block text-lg font-bold mb-3">Khoảnh khắc thực tế từ sự kiện</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors group">
                      <Icon name="add_a_photo" className="text-gray-400 group-hover:text-primary text-3xl" />
                      <span className="text-xs font-bold text-gray-400 mt-2">Tải ảnh lên</span>
                    </div>
                    <div className="aspect-square rounded-xl overflow-hidden relative group">
                      <img alt="Review photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVwFc_axfn3zhLbJ7fsJO-_XcGqCHeObKe9G_pDHyRm8jJMSH27T69jxhDavc0fmWwDxiXImbag2nO9Wc2nORnj_dFRZUaALc1EjHGwKXmswLsMl6UvwhfmXyFx4H_s06lybEUX4jChtNvPupsOrhaeoKU9zTJQxrpU0RzpITxzGQRISRJlU1H_fci66DwVdkQPcKbEeWLDR0cdPBX2b9h2qlN1xcH0CbqaZqBn4_qDaDEZYzu-rf8rFIfOZvJLdY_zYMAed2BWpU" />
                      <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="close" size="sm" />
                      </button>
                    </div>
                    <div className="aspect-square rounded-xl overflow-hidden relative group">
                      <img alt="Review photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPL21j2fidD-jNFGL9XSypgJYtpCtYSDU-ZOHZLWg0McWiDIa_DcafwXXC0vIbCphaTZYUvnjcwvgvkUMntIEOBSxYJ7VCjsNKOFuVfBa2E1tMRtVoLtmYVu5HYNw-Ld2q0GChsoCgKjP_8Vf9oLwVmZQT7GMtL1kkjmEzIHqBPTymuC_wfT4GE0_fLk5DQjCq6nNLTXOXkiGpH-MWF8FA_4CMgpspGI4aUc2t4CukXbkRNJv7bWPQxIFD1OnR0jtXPZJnkA93tV0" />
                      <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="close" size="sm" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Submit */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon name="workspace_premium" className="text-primary" />
                    <p>Bạn sẽ nhận được <span className="font-bold text-primary">50 Xu</span> sau khi đánh giá!</p>
                  </div>
                  <button className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-full font-extrabold text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all">
                    Gửi đánh giá ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Community */}
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-primary text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-xl font-bold mb-6">Cộng đồng nói gì?</h3>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-6xl font-black">4.8</span>
                <div>
                  <div className="flex text-yellow-400">
                    {[1,2,3,4].map((i) => <Icon key={i} name="star" filled />)}
                    <Icon name="star_half" className="text-white/50" filled />
                  </div>
                  <p className="text-sm font-medium text-white/80">Dựa trên 1,240 đánh giá</p>
                </div>
              </div>
              <div className="space-y-4">
                {communityStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>{stat.label}</span><span>{stat.value}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full" style={{ width: `${stat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Feed */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                Đánh giá gần đây
                <span className="text-xs text-primary hover:underline cursor-pointer">Tất cả</span>
              </h3>
              <div className="space-y-6">
                {reviews.map((review, i) => (
                  <div key={i} className={i < reviews.length - 1 ? 'border-b border-gray-100 pb-4' : ''}>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar src={review.avatar} size="sm" />
                      <div>
                        <p className="text-sm font-bold">{review.name}</p>
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }, (_, s) => (
                            <Icon key={s} name="star" size="sm" className={`text-xs ${s < review.rating ? '' : 'text-slate-200'}`} filled />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Banner */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <h4 className="font-bold text-indigo-900 mb-2">Tìm kiếm thêm trải nghiệm?</h4>
              <p className="text-sm text-indigo-700 mb-4">Khám phá các dịch vụ giải trí khác tại Marketplace của chúng tôi.</p>
              <button className="text-indigo-900 font-extrabold text-sm flex items-center gap-2 group">
                Đến Marketplace <Icon name="arrow_forward" size="sm" className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-gray-200 py-10 px-4 text-center">
        <p className="text-sm text-gray-500">© 2024 EventHub Ecosystem. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default EventReviews

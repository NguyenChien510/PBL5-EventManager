import { Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'

const sidebarConfig = {
  brandName: 'Vibrant', brandSub: 'Organizer Hub', brandIcon: 'event_available',
  sections: [
    { title: 'Dashboard', links: [
      { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
      { to: '/organizer/events', label: 'Sự kiện', icon: 'event' },
      { to: '/organizer/create', label: 'Tạo sự kiện', icon: 'add_circle' },
    ]},
  ],
  user: { name: 'Hoàng Nguyễn', role: 'Event Director' },
}

const OrganizerEventCreate = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Tạo Sự Kiện Mới" breadcrumb={['Sự kiện', 'Tạo sự kiện mới']} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Icon name="info" className="text-primary" /> Thông tin cơ bản
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Tên sự kiện *</label>
                  <input type="text" placeholder="Nhập tên sự kiện..." className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">Thể loại *</label>
                    <select className="input-field"><option>Chọn thể loại</option><option>Âm nhạc</option><option>Công nghệ</option><option>Nghệ thuật</option></select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">Tags</label>
                    <input type="text" placeholder="VD: concert, live, music" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Mô tả *</label>
                  <textarea placeholder="Mô tả chi tiết về sự kiện..." className="input-field min-h-[120px]" />
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Icon name="calendar_today" className="text-primary" /> Thời gian & Địa điểm
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Ngày bắt đầu</label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Ngày kết thúc</label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Giờ bắt đầu</label>
                  <input type="time" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 mb-2 block">Giờ kết thúc</label>
                  <input type="time" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Địa điểm *</label>
                <input type="text" placeholder="Tìm kiếm địa điểm..." className="input-field" />
              </div>
            </div>

            {/* Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Icon name="confirmation_number" className="text-primary" /> Loại vé & Giá
              </h3>
              <div className="space-y-4">
                {[
                  { type: 'Standard', price: '500.000', qty: '500' },
                  { type: 'VIP', price: '1.200.000', qty: '100' },
                ].map((ticket) => (
                  <div key={ticket.type} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <input defaultValue={ticket.type} className="input-field" placeholder="Loại vé" />
                      <input defaultValue={ticket.price} className="input-field" placeholder="Giá (VNĐ)" />
                      <input defaultValue={ticket.qty} className="input-field" placeholder="Số lượng" />
                    </div>
                    <button className="p-2 text-red-400 hover:text-red-600"><Icon name="delete" size="sm" /></button>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary text-sm font-bold hover:bg-primary/5 flex items-center justify-center gap-2">
                  <Icon name="add" size="sm" /> Thêm loại vé
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4">Ảnh bìa</h3>
              <div className="aspect-[16/9] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Icon name="cloud_upload" className="text-slate-300 text-4xl mb-2" />
                <p className="text-sm font-medium text-slate-400">Kéo thả hoặc click để upload</p>
                <p className="text-xs text-slate-300 mt-1">PNG, JPG tối đa 5MB</p>
              </div>
            </div>

            {/* Publish Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4">Trạng thái</h3>
              <select className="input-field mb-4">
                <option>Bản nháp</option>
                <option>Gửi duyệt</option>
                <option>Lên lịch đăng</option>
              </select>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50">Lưu nháp</button>
                <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-sm">Gửi duyệt</button>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="search" className="text-primary" size="sm" /> SEO
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Meta Title</label>
                  <input type="text" className="input-field" placeholder="Tiêu đề SEO..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Meta Description</label>
                  <textarea className="input-field" placeholder="Mô tả ngắn cho SEO..." rows={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerEventCreate

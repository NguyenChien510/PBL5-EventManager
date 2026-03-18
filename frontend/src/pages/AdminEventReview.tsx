import { Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { adminSidebarConfig } from '../config/adminSidebarConfig'

const sidebarConfig = adminSidebarConfig

const AdminEventReview = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Kiểm duyệt Chi tiết" breadcrumb={['Kiểm duyệt', 'Vibrant Summer Fest 2024']} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="aspect-[21/9] bg-slate-100 relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhrQCoJtEP5Ry2FtPg7fIKAvyMtac_QwaU5LX7pK5AWyz_EvZeSgGr8zlzflM6eHwgBY2Y-W1n0dT5oLtPm8y18PExMvAGGgmwVNIhm2x1Nqc88xDpfneYCC16Ms3c7S7yAcSHYFDlg7NYffD6V37rjaOFm9J9y2XulgSOZWiWDqT9N1_lR40oG8fcfH2tnUGDRmn8hLpqFl4WGbZUgbbB_Wh1XQK8gicjGStc76fLYqgKPjaoIXBM0ejcMfNAm_e4k26Oc8pc_14" alt="Event" className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">Chờ duyệt</span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Vibrant Summer Fest 2024</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { icon: 'person', label: 'Nhà tổ chức', value: 'EventMaster Team' },
                    { icon: 'category', label: 'Thể loại', value: 'Âm nhạc / Festival' },
                    { icon: 'calendar_today', label: 'Ngày', value: '10/05/2024 - 12/05/2024' },
                    { icon: 'location_on', label: 'Địa điểm', value: 'Công viên Tao Đàn, TP.HCM' },
                    { icon: 'groups', label: 'Sức chứa', value: '5,000 người' },
                    { icon: 'confirmation_number', label: 'Loại vé', value: '3 loại (Standard, VIP, Diamond)' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <Icon name={item.icon} className="text-primary" size="sm" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">{item.label}</p>
                        <p className="font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4">Mô tả sự kiện</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vibrant Summer Fest là lễ hội âm nhạc ngoài trời lớn nhất mùa hè 2024 tại TP.HCM. Với sự tham gia của hơn 20 nghệ sĩ hàng đầu Việt Nam và quốc tế, sự kiện hứa hẹn mang đến trải nghiệm âm nhạc, ẩm thực và nghệ thuật đa dạng.
              </p>
            </div>
          </div>

          {/* Moderation Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-t-4 border-t-primary">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="gavel" className="text-primary" /> Phê duyệt
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Nội dung phù hợp', checked: true },
                  { label: 'Ảnh bìa hợp lệ', checked: true },
                  { label: 'Giấy phép đầy đủ', checked: false },
                  { label: 'Giá vé hợp lý', checked: true },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded border-slate-300 text-primary accent-primary" />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-sm font-bold text-slate-600 mb-2 block">Ghi chú nội bộ</label>
                <textarea className="input-field" placeholder="Ghi chú cho team moderation..." rows={3} />
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-sm">
                  <Icon name="check_circle" size="sm" /> Phê duyệt
                </button>
                <button className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-sm">
                  <Icon name="edit" size="sm" /> Yêu cầu chỉnh sửa
                </button>
                <button className="w-full py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-sm">
                  <Icon name="block" size="sm" /> Từ chối
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Icon name="history" className="text-primary" size="sm" /> Lịch sử tương tác
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><Icon name="upload" className="text-blue-600" size="sm" /></div>
                  <div>
                    <p className="text-xs font-bold">EventMaster gửi yêu cầu</p>
                    <p className="text-[10px] text-slate-400">08/05/2024, 14:30</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"><Icon name="edit" className="text-orange-600" size="sm" /></div>
                  <div>
                    <p className="text-xs font-bold">Admin yêu cầu bổ sung giấy phép</p>
                    <p className="text-[10px] text-slate-400">09/05/2024, 09:15</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminEventReview

import { Icon } from '../components/ui'
import { DashboardLayout, PageHeader } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'

const sidebarConfig = organizerSidebarConfig

const OrganizerProfile = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Hồ sơ Doanh nghiệp" breadcrumb={['Cài đặt', 'Hồ sơ doanh nghiệp']} />
      <div className="p-8 space-y-8">
        {/* Company Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-primary to-blue-600 relative">
            <button className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1">
              <Icon name="edit" size="sm" /> Đổi ảnh bìa
            </button>
          </div>
          <div className="px-8 pb-6 -mt-12 flex items-end gap-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <Icon name="event_available" className="text-primary text-4xl" />
            </div>
            <div className="flex-1 pt-14">
              <h2 className="text-2xl font-bold">Vibrant Events Company</h2>
              <p className="text-sm text-slate-500">Công ty tổ chức sự kiện chuyên nghiệp</p>
            </div>
            <button className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm">
              <Icon name="save" size="sm" /> Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold flex items-center gap-2"><Icon name="business" className="text-primary" /> Thông tin doanh nghiệp</h3>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Tên công ty</label>
              <input type="text" defaultValue="Vibrant Events Company" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Mã số thuế</label>
              <input type="text" defaultValue="0312345678" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Email doanh nghiệp</label>
              <input type="email" defaultValue="contact@vibrantevents.vn" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Số điện thoại</label>
              <input type="tel" defaultValue="028-1234-5678" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 mb-2 block">Địa chỉ</label>
              <textarea defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM" className="input-field" rows={2} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="font-bold flex items-center gap-2"><Icon name="account_balance" className="text-primary" /> Thông tin thanh toán</h3>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Ngân hàng</label>
                <select className="input-field"><option>Vietcombank</option><option>Techcombank</option><option>BIDV</option></select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Số tài khoản</label>
                <input type="text" defaultValue="**** **** **** 5678" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Chủ tài khoản</label>
                <input type="text" defaultValue="CONG TY VIBRANT EVENTS" className="input-field" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="verified" className="text-primary" /> Trạng thái xác minh</h3>
              <div className="space-y-3">
                {[
                  { label: 'Giấy phép kinh doanh', done: true },
                  { label: 'Xác minh email', done: true },
                  { label: 'Xác minh số điện thoại', done: true },
                  { label: 'Xác minh tài khoản ngân hàng', done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <Icon name={item.done ? 'check_circle' : 'radio_button_unchecked'} className={item.done ? 'text-green-500' : 'text-slate-300'} filled={item.done} />
                    <span className={`text-sm ${item.done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerProfile

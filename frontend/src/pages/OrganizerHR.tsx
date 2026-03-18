import { Icon, Avatar } from '../components/ui'
import { DashboardLayout } from '../components/layout'
import { organizerSidebarConfig } from '../config/organizerSidebarConfig'

const sidebarConfig = organizerSidebarConfig

const staffMembers = [
  {
    name: 'Hoàng Nguyễn',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3oNjRKUaraU_NODDJZvWtFAnbxhbWeHMkDA_cxVKeoY2xkitK8HmVPJqJefRYJEUXVuUPKPirEu0CaQYryBLCMUPPIUvnpRY-ZFYoC0at1PYDINVMaFtFGy1JyHVP7UV-43-zQZgRiXxVrUGaaweX3Y2to3siTHMmPS5waguUn2GbjKQdKvpr5EuKriYBIOpFporWMh3Ww-F_1KeFTUcvFFR_LRoohxwitl4-RtT8IECfeZwFEaC3wnAJMoPJjWU5H7EeNIQeoA',
    busy: false,
  },
  {
    name: 'Lê Minh Tuấn',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGFr9U36M42SlEPp4bm2BKx5OMqjRofYUGXglR0gTiDnoOLtn_VjatmT8IAg5doXGWEZX3kMpapWZTdqXXYzHWKeiXcS8c6Z3GOQPj_s0fYx1TZCvVdClhtifuphmVw7MBHUTefNTKELy22Bezs0cJR-EzuqOnNNi3j40MD-ZIizbhAnI0wzMNqZ2mfk4ypthH-EuCoE2Snn1cNXgPmz2kmodYA9O7oW1FeKfyISui_xsoyDC6m8LrZOiuHTwxSGMpuezwDtnGCAg',
    busy: false,
  },
  {
    name: 'Quỳnh Anh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4nSqQqXttvqISmUA-Hti29vdc0r0HR7vMXAQSMWFh_h3ZMBlKkCCE_XbHFujqvuuUY-gUiN32QOZsuxXYuynd4YUWxvFFhVuht6apdcsGWJG5m4O92ZI1ckJNMwlMK7p0Wq1YvEnvesHEsciItPizN99r36Ug631akzB_Ky2k-8y64gfwZjHHfdizDi4Xew_8dAZwjT9k1knMp-5rNUlWUl6sTgeEMn3_RADhcUAW3suyoS1igklheLCdwpV7Equ8WD-ZmZ2O9LA',
    busy: true,
  },
]

interface RosterShift {
  title: string
  time: string
  color: 'sky' | 'red' | 'orange' | 'emerald' | 'purple' | 'indigo'
  conflict?: boolean
  strikethrough?: boolean
}

const colorMap = {
  sky: 'bg-sky-50 border-sky-400 text-sky-700',
  red: 'bg-red-50 border-red-500 text-red-700',
  orange: 'bg-orange-50 border-orange-400 text-orange-700',
  emerald: 'bg-emerald-50 border-emerald-400 text-emerald-700',
  purple: 'bg-purple-50 border-purple-400 text-purple-700',
  indigo: 'bg-indigo-50 border-indigo-400 text-indigo-700',
}

const RosterCard: React.FC<{ shift: RosterShift }> = ({ shift }) => (
  <div className={`roster-card ${colorMap[shift.color]} ${shift.conflict ? 'shadow-md' : ''} ${shift.strikethrough ? 'opacity-60' : ''}`}>
    {shift.conflict && (
      <div className="flex items-center gap-1 mb-1">
        <Icon name="error" size="sm" className="text-[14px]" />
        <p className="font-bold">Trùng lịch</p>
      </div>
    )}
    <p className={`font-bold ${shift.strikethrough ? 'line-through text-[10px]' : ''}`}>{shift.title}</p>
    {!shift.strikethrough && <p className="opacity-80">{shift.time}</p>}
  </div>
)

type WeekSchedule = (RosterShift | null)[]

interface StaffRow {
  name: string
  avatar: string
  schedule: WeekSchedule
  offDays?: number[]
}

const staffSchedule: StaffRow[] = [
  {
    name: 'Văn Khải',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcfb_mjN_7Y7AnBLTl9-PRxf6Yo4P3qvAdNuJ38DAkogqoRIAeXSrBnRre2wZVGI7TScqfu1eMPkxhFSuOc-nLtlBlxnpGeSLhh__6k82FIiHnpSQnNb6RPcF7D-rc0cmsWEq0qMywwZbKl8hAPfthzExM1Ns3FLZC6VYSoRaYRuJ9YiWWbrttIRWYjPv-gEb3zLTuF-X9NOmdbwvmvIHtk7jV8HpumVBw9MvyKH-mD899QoBWKo2YTs0n-YMTLAWu2tB57m20WDM',
    schedule: [
      { title: 'Gala Dinner', time: '08:00 - 17:00', color: 'sky' },
      { title: 'Setup Stage', time: '08:00 - 22:00', color: 'sky' },
      { title: 'Sky Hall A (Full day)', time: '', color: 'red', conflict: true },
      { title: 'Vận hành (AM)', time: '07:00 - 12:00', color: 'emerald' },
      null,
      { title: 'Tech Rehearsal', time: '13:00 - 23:00', color: 'purple' },
      null,
    ],
  },
  {
    name: 'Thu Hà',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUIyeR96zMUJuv1yyMVG0ZgfO-V459adywnLWhsSn2TuSNhn0QJcvwz0oNvTi7ZwrvIDTf2s_NVhEq-Mn5RrtSK95UvpNBBOgjXxNX4hhl7pLPwwHlEj87KH7bfcLDZbx9Pn5HwA-C6CgaeV0LG4O37mT73aRCtLW-Dv9ay2_L8CJkviJo-h5iQnWbojQ2ehIZOQMNBDfXdKyXAP6zGFMzjdvTI5OKUVIcr7NcSPCEjJ7nZ8P_P-pDu_BjzkLv04p3KN1oG0O0Af8',
    schedule: [
      null,
      null,
      null,
      { title: 'Thiết kế Visual', time: '09:00 - 18:00', color: 'indigo' },
      { title: 'Thiết kế Visual', time: '09:00 - 18:00', color: 'indigo' },
      null,
      null,
    ],
    offDays: [5, 6],
  },
  {
    name: 'Đại Nghĩa',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp1WrsLNkY7DfLOe581V_dsVvkNArO1vyWPgxW4cOq_6ityWq5kGgqSwqnr4HlE848FrP6IapxlsPVWaALcKgok9-Iel8pb0bi4oPk4QV56yuQe3c3AQ-KD1AjXKH3uTFkg_Nnyfw3ar2nbajouu4sC8kScxB0lBC4sxrg5B3aryKrM0JCt9VUcnKNB6o4P6k22BVZqnx9VdaBcm_7dYlW_OqtNekxbRAgPtc5g2t91erX_suDkwm3Ui-tl9iAOlB95uNKFHc1Irc',
    schedule: [
      null,
      { title: 'Setup Trucking', time: '22:00 - 04:00', color: 'orange' },
      { title: 'Show Run', time: '14:00 - 23:00', color: 'orange' },
      null, // placeholder slot
      null,
      null,
      null,
    ],
  },
]

const weekDays = [
  { label: 'Thứ 2', date: 23 },
  { label: 'Thứ 3', date: 24 },
  { label: 'Thứ 4', date: 25 },
  { label: 'Thứ 5', date: 26, isToday: true },
  { label: 'Thứ 6', date: 27 },
  { label: 'Thứ 7', date: 28 },
  { label: 'Chủ Nhật', date: 29, isWeekend: true },
]

const OrganizerHR = () => {
  return (
    <DashboardLayout sidebarProps={{
      ...sidebarConfig,
      children: (
        <div className="px-2 pt-6 space-y-4">
          <div className="px-4 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resources</div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
              <Icon name="drag_indicator" size="sm" /> Kéo thả nhân sự
            </p>
            <div className="space-y-2">
              {staffMembers.map((staff) => (
                <div
                  key={staff.name}
                  className={`flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200 cursor-move hover:border-primary transition-colors ${staff.busy ? 'opacity-50' : ''}`}
                >
                  <Avatar src={staff.avatar} size="xs" />
                  <span className={`text-xs font-medium ${staff.busy ? 'italic' : ''}`}>
                    {staff.name}{staff.busy ? ' (Busy)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    }}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Roster Planner</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <Icon name="event_available" size="sm" />
              <span>Lập kế hoạch Nhân sự &amp; Phân ca</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Week/Month toggle */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white transition-all">Tuần</button>
              <button className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-all rounded-lg">Tháng</button>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white rounded-lg text-slate-500 hover:bg-slate-50 border border-slate-100">
                <Icon name="chevron_left" />
              </button>
              <span className="text-sm font-bold px-2 whitespace-nowrap">23 Th10 - 29 Th10, 2023</span>
              <button className="p-2 bg-white rounded-lg text-slate-500 hover:bg-slate-50 border border-slate-100">
                <Icon name="chevron_right" />
              </button>
            </div>
            <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
              <Icon name="publish" />
              Xuất bản Lịch
            </button>
          </div>
        </header>

        {/* Alert banners */}
        <div className="flex gap-4">
          <div className="flex-1 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="warning" className="text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-900">Phát hiện xung đột lịch trình</p>
                <p className="text-xs text-amber-700">Nguyễn Văn Khải đang bị trùng ca tại 'Sky Hall A' và 'Triển lãm SECC'.</p>
              </div>
            </div>
            <button className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-lg">Xử lý ngay</button>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3">
            <Icon name="error_outline" className="text-rose-500" />
            <div>
              <p className="text-sm font-bold text-rose-900">Quá tải giờ làm</p>
              <p className="text-xs text-rose-700">3 nhân viên vượt 48h/tuần.</p>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header row */}
          <div className="calendar-grid bg-slate-50/50 border-b border-slate-200">
            <div className="p-4 border-r border-slate-200 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhân sự</span>
            </div>
            {weekDays.map((day) => (
              <div key={day.date} className="p-4 text-center border-r border-slate-200 last:border-r-0">
                <p className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-primary' : day.isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>
                  {day.label}
                </p>
                <p className={`text-xl font-bold ${day.isToday ? 'text-primary underline decoration-2 underline-offset-4' : day.isWeekend ? 'text-rose-500' : ''}`}>
                  {day.date}
                </p>
              </div>
            ))}
          </div>

          {/* Staff rows */}
          <div className="divide-y divide-slate-100">
            {staffSchedule.map((staff) => (
              <div key={staff.name} className="calendar-grid group hover:bg-slate-50/30 transition-all">
                {/* Staff info */}
                <div className="p-4 border-r border-slate-100 flex flex-col items-center justify-center gap-2 bg-slate-50/20">
                  <Avatar src={staff.avatar} size="md" ring />
                  <p className="text-[11px] font-bold text-center leading-tight">{staff.name}</p>
                </div>
                {/* Schedule cells */}
                {staff.schedule.map((shift, dayIdx) => {
                  const isOff = staff.offDays?.includes(dayIdx)
                  const isAddSlot = staff.name === 'Đại Nghĩa' && dayIdx === 3

                  return (
                    <div key={dayIdx} className={`p-2 border-r border-slate-100 last:border-r-0 min-h-[140px] ${
                      shift?.conflict ? 'bg-red-50/30' : isOff ? 'bg-slate-50' : ''
                    }`}>
                      {shift && <RosterCard shift={shift} />}
                      {/* Conflict secondary item */}
                      {staff.name === 'Văn Khải' && dayIdx === 2 && (
                        <RosterCard shift={{ title: 'SECC Expo', time: '', color: 'orange', strikethrough: true }} />
                      )}
                      {isOff && !shift && (
                        <p className="text-[10px] text-slate-400 font-bold text-center mt-12">OFF WORK</p>
                      )}
                      {isAddSlot && (
                        <div className="absolute inset-2 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center">
                          <Icon name="add_circle_outline" className="text-primary/30" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="flex gap-4">
              {[
                { color: 'bg-sky-400', label: 'Sự kiện chính' },
                { color: 'bg-purple-400', label: 'Kỹ thuật/Visual' },
                { color: 'bg-orange-400', label: 'Setup/Vận chuyển' },
              ].map((legend) => (
                <div key={legend.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${legend.color}`} />
                  <span className="text-xs font-medium text-slate-500">{legend.label}</span>
                </div>
              ))}
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
              Lưu bản nháp
            </button>
          </div>
        </section>

        {/* Bottom stats */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 bg-white p-6 rounded-3xl border border-slate-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icon name="analytics" className="text-primary" />
              Tóm tắt cường độ công việc
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Tổng ca trực', value: '48 ca', color: '' },
                { label: 'Nghiệp vụ kỹ thuật', value: '18 ca', color: 'text-ocean-blue' },
                { label: 'Cần bổ sung', value: '04 vị trí', color: 'text-warning' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
              <div className="p-4 bg-primary rounded-2xl text-white shadow-lg shadow-primary/30">
                <p className="text-[10px] text-white/70 uppercase font-bold mb-1 text-center">Tự động tối ưu</p>
                <button className="w-full mt-1 bg-white text-primary text-[10px] font-bold py-2 rounded-lg">
                  SMART AI FILL
                </button>
              </div>
            </div>
          </div>
          <div className="col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl border-t-4 border-t-primary relative">
            <h3 className="font-bold text-sm mb-4">Mẹo sử dụng</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <Icon name="info" className="text-primary" size="sm" />
                <p className="text-xs text-slate-500">Giữ phím <b>Alt</b> để sao chép ca trực sang ngày khác.</p>
              </li>
              <li className="flex gap-3 items-start">
                <Icon name="info" className="text-primary" size="sm" />
                <p className="text-xs text-slate-500">Hệ thống sẽ tự bôi đỏ nếu khoảng cách giữa 2 ca dưới 8 tiếng.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default OrganizerHR

import { Icon, Pagination } from '../components/ui'
import { TicketCard } from '../components/domain'
import { DashboardLayout, PageHeader } from '../components/layout'
import { userSidebarConfig } from '../config/userSidebarConfig'

const sidebarConfig = userSidebarConfig

const tickets = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApE_m_Gd_KRyYuWTES2LUgR5Rnhp5h2U15s-sNclVbmb8EHbXTWT9qG7sBCU0LqeQ_jvPWfy_oRFMgHFTHqf-Zr1izZqyCJYRv1EzbJv827rXQd0NBAxYshSBFqEHblTSZ9_DWvjvZbSBgqg9B2mU_oX_8F_f43SC4wi8AiFhElE68UcqOFFj4y3Crh93Ah7AEFud5lJ9StCF6htKxztl-Q4iDBjqh8m_PRYEBXYQUMe0P3XDAonsjZhRxfDYng6svCTMAKfXMFn8',
    title: 'SƠN TÙNG M-TP: THE FIRST JOURNEY 2024', ticketId: '#E-TICKET-882910',
    date: '20:00, 15 Th12', seat: 'Zone VIP - Row A - 02', location: 'SVĐ Quân khu 7, TP.HCM',
    type: 'Premium' as const, status: 'active' as const,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8uGa4mjJqgWx5lFfDdLFanomchIA51IL8c0cvb3MIvS4GBu7ELTNexbhcJEIciFGOrbVfUWEGrFk5mRHb_asax4cBD8ddZD6DCO2x-TFSGHMrGlb_3UzaAzSv-lol1Y13h0NCWx1bisS-1wiw9mM1Pk1uAuWn4ENmtn0bHrhfEN0_pXnmDQCY_Dx7HWH1bijivgY4hCUMU_lb4qGiw0i4ZqDGhPXEC97rUmzSAyfodwGiVLLxAAz2QaKrFMSGuRiEE4j49dJZMqw',
    title: 'AI INNOVATION SUMMIT 2024', ticketId: '#E-TICKET-77412B',
    date: '08:00, 28 Th11', seat: 'Grand Ballroom A', location: 'Gem Center, Quận 1',
    type: 'Standard' as const, status: 'pending' as const,
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnq1Yzgsd28u9RCJh3At5GShj32DcYi9T_WN8ctWilvGZn9VmfNHcOXN0PJVpwKNobaOeiLmwLHEdWBHMa0-lffiM-Lwoaqt5KkCR09eDjWJ-SCeEHoTwndxp4Nre5iCAhg4T1qbg7h75lD0xQbdhUfxGLICenIk71wCsX_N9LaLNhSBdHcgwT-D_-lV4s-BSw1EUi9YzTDRA_WzoNc9T9dOkYFrwkftJ5xX9JXksilQMRTFko1lYzpfcj_je9bmv6z9ywUt6AXg',
    title: 'Artisan Market Night', ticketId: '#E-TICKET-55023C',
    date: '18:00, 05 Th10', seat: 'General Admission', location: 'Phố đi bộ, Hà Nội',
    type: 'Standard' as const, status: 'used' as const,
  },
]

const UserTickets = () => {
  return (
    <DashboardLayout sidebarProps={sidebarConfig}>
      <PageHeader title="Vé của tôi" searchPlaceholder="Tìm vé..." />
      <div className="p-8 space-y-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-4">
          {['Tất cả (8)', 'Sắp tới (2)', 'Đã sử dụng (5)', 'Đã hủy (1)'].map((tab, i) => (
            <button key={tab} className={`text-sm font-bold border-b-2 pb-2 ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="space-y-4">
          {tickets.map((ticket, i) => (
            <TicketCard key={i} {...ticket} />
          ))}
        </div>

        <Pagination current={1} total={3} label="Hiển thị 3 trong 8 vé" />
      </div>
    </DashboardLayout>
  )
}

export default UserTickets

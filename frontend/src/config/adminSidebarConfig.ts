export const adminSidebarConfig = {
  brandName: 'Event',
  brandSub: 'Admin Control Panel',
  brandIcon: 'confirmation_number',
  sections: [
    {
      title: 'Quản trị',
      links: [
        { to: '/admin/moderation', label: 'Kiểm duyệt Sự kiện', icon: 'verified_user' },
        { to: '/admin/review', label: 'Duyệt & Phản hồi', icon: 'fact_check' },
        { to: '/admin/users', label: 'Quản lý người dùng', icon: 'manage_accounts' },
      ],
    },
    {
      title: 'Hệ thống',
      links: [
        { to: '/admin/finance', label: 'Cấu hình tài chính', icon: 'settings' },
      ],
    },
  ],
  user: { name: 'Admin Nguyễn', role: 'Super Admin' },
}

export const adminSidebarConfig = {
  brandName: 'Event',
  brandSub: 'Admin Control Panel',
  brandIcon: 'confirmation_number',
  sections: [
    {
      title: 'Quản trị',
      links: [
        { to: '/admin/moderation', label: 'Kiểm duyệt Sự kiện', icon: 'verified_user' },
        { to: '/admin/events', label: 'Quản lý sự kiện', icon: 'event_note' },
        { to: '/admin/users', label: 'Quản lý người dùng', icon: 'manage_accounts' },
        { to: '/admin/payments', label: 'Lịch sử giao dịch', icon: 'payments' },
      ],
    },
    {
      // title: 'Hệ thống',
      links: [
        { to: '/admin/finance', label: 'Cấu hình tài chính', icon: 'settings' },
      ],
    },
  ],
}

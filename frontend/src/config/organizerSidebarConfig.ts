export const organizerSidebarConfig = {
  brandName: 'Event',
  brandSub: 'Organizer Hub',
  brandIcon: 'confirmation_number',
  sections: [
    {
      // title: 'Dashboard',
      links: [
        { to: '/organizer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
        { to: '/organizer/events', label: 'Sự kiện', icon: 'event' },
        // { to: '/organizer/create', label: 'Tạo sự kiện', icon: 'add_circle' },
        // { to: '/organizer/guests', label: 'Khách mời', icon: 'groups' },
      ],
    },
    {
      // title: 'Quản lý',
      links: [
        // { to: '/organizer/timeline', label: 'Kịch bản', icon: 'timeline' },
        { to: '/organizer/finance', label: 'Tài chính', icon: 'account_balance' },
        { to: '/organizer/feedback', label: 'Phản hồi', icon: 'rate_review' },
        { to: '/organizer/profile', label: 'Hồ sơ DN', icon: 'business' },
      ],
    },
  ],
}

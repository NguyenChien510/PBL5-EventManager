import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-slate-900 text-white/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-4">
              Event<span className="text-sky-400">Platform</span>
            </h4>
            <p className="text-sm leading-relaxed">Nền tảng bán vé sự kiện cao cấp hàng đầu Việt Nam.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Khám phá</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-white transition-colors">Sự kiện</a>
              <a href="#" className="block hover:text-white transition-colors">Thể loại</a>
              <a href="#" className="block hover:text-white transition-colors">Địa điểm</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-white transition-colors">FAQ</a>
              <a href="#" className="block hover:text-white transition-colors">Liên hệ</a>
              <a href="#" className="block hover:text-white transition-colors">Điều khoản</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Nhà tổ chức</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-white transition-colors">Đăng ký tổ chức</a>
              <a href="#" className="block hover:text-white transition-colors">Bảng giá</a>
              <a href="#" className="block hover:text-white transition-colors">Hướng dẫn</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm">
          © 2024 EventPlatform. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer

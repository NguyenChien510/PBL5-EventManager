import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/ui';

interface EditEventModalProps {
  activeEditType: 'title' | 'info' | 'description' | 'schedule' | null;
  onClose: () => void;
  initialForm: any;
  initialSchedules: any[];
  onUpdate: (form: any, schedules: any[]) => Promise<void>;
  formatTime: (time: any) => string;
}

export const EditEventModal = React.memo(({
  activeEditType,
  onClose,
  initialForm,
  initialSchedules,
  onUpdate,
  formatTime
}: EditEventModalProps) => {
  const [localForm, setLocalForm] = React.useState(initialForm);
  const [localSchedules, setLocalSchedules] = React.useState(initialSchedules);

  React.useEffect(() => {
    setLocalForm(initialForm);
  }, [initialForm]);

  React.useEffect(() => {
    setLocalSchedules(initialSchedules);
  }, [initialSchedules]);

  if (!activeEditType) return null;

  const handleSubmit = () => {
    onUpdate(localForm, localSchedules);
  };


  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 text-primary rounded-xl flex items-center justify-center border border-slate-100">
              <Icon
                name={
                  activeEditType === 'title' ? 'edit_note' :
                    activeEditType === 'info' ? 'map' :
                      activeEditType === 'description' ? 'description' : 'schedule'
                }
                size="xs"
              />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {activeEditType === 'title' ? 'Chỉnh sửa tên' :
                  activeEditType === 'info' ? 'Thời gian & Địa điểm' :
                    activeEditType === 'description' ? 'Mô tả chi tiết' : 'Quản lý lịch trình'}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cập nhật thông tin sự kiện</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-5">
          {activeEditType === 'title' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên sự kiện mới</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl font-bold outline-none transition-all"
                value={localForm?.title || ''}
                onChange={(e) => setLocalForm({ ...localForm, title: e.target.value })}
                autoFocus
              />
            </div>
          )}

          {activeEditType === 'info' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Địa điểm tổ chức</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl font-bold outline-none transition-all"
                  value={localForm?.location || ''}
                  onChange={(e) => setLocalForm({ ...localForm, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ngày & Giờ bắt đầu</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl font-bold outline-none transition-all"
                  value={(() => {
                    try {
                      if (!localForm?.startTime) return '';
                      return new Date(localForm.startTime).toISOString().slice(0, 16);
                    } catch (e) {
                      return '';
                    }
                  })()}
                  onChange={(e) => setLocalForm({ ...localForm, startTime: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeEditType === 'description' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nội dung mô tả</label>
              <textarea
                rows={8}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl font-bold outline-none transition-all resize-none leading-relaxed"
                placeholder="Nhập mô tả chi tiết..."
                value={localForm?.description || ''}
                onChange={(e) => setLocalForm({ ...localForm, description: e.target.value })}
              />
            </div>
          )}

          {activeEditType === 'schedule' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Các mốc lịch trình</label>
                <button
                  onClick={() => setLocalSchedules([...localSchedules, { startTime: [8, 0], activity: '' }])}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                >
                  <Icon name="add" size="xs" /> Thêm mốc
                </button>
              </div>
              <div className="space-y-2">
                {localSchedules.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                    <div className="w-20">
                      <input
                        type="text"
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-primary"
                        value={formatTime(item.startTime)}
                        onChange={(e) => {
                          const newSchedules = [...localSchedules];
                          newSchedules[idx].startTime = e.target.value;
                          setLocalSchedules(newSchedules);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-primary"
                        placeholder="Hoạt động..."
                        value={item.activity}
                        onChange={(e) => {
                          const newSchedules = [...localSchedules];
                          newSchedules[idx].activity = e.target.value;
                          setLocalSchedules(newSchedules);
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setLocalSchedules(localSchedules.filter((_: any, i: number) => i !== idx))}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Icon name="delete" size="xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all uppercase tracking-widest"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-widest"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal = React.memo(({ imageUrl, onClose }: ImagePreviewModalProps) => {
  if (!imageUrl) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
        onClick={onClose}
      >
        <Icon name="close" size="md" />
      </button>
      <img 
        src={imageUrl} 
        alt="Full size review" 
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
});

interface SeatAttendeeModalProps {
  attendee: any | null;
  onClose: () => void;
  onCheckIn: (ticketId: number, status: string) => void;
}

export const SeatAttendeeModal = React.memo(({ attendee, onClose, onCheckIn }: SeatAttendeeModalProps) => {
  if (!attendee) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">Ghế {attendee.seatNumber}</span>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg shadow-sm ${attendee.ticketTypeName?.toUpperCase().includes('VIP') 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-blue-600 text-white'}`}>
                  {attendee.ticketTypeName}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">{attendee.userName}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>

          <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                <Icon name="mail" size="xs" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-xs font-bold text-slate-700">{attendee.userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                <Icon name="calendar_today" size="xs" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày mua</p>
                <p className="text-xs font-bold text-slate-700">
                  {new Date(attendee.purchaseDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${attendee.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                <Icon name={attendee.status === 'CHECKED_IN' ? 'check_circle' : 'pending'} size="xs" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</p>
                <p className={`text-xs font-black uppercase ${attendee.status === 'CHECKED_IN' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {attendee.status === 'CHECKED_IN' ? 'Đã check-in' : 'Chưa đến'}
                </p>
              </div>
            </div>
            {attendee.checkInDate && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                  <Icon name="history" size="xs" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Thời gian check-in</p>
                  <p className="text-xs font-bold text-slate-700">
                    {new Date(attendee.checkInDate).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (attendee.status !== 'CHECKED_IN') {
                  onCheckIn(attendee.ticketId, attendee.status);
                  onClose();
                }
              }}
              disabled={attendee.status === 'CHECKED_IN'}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${attendee.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed opacity-80' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02]'}`}
            >
              {attendee.status === 'CHECKED_IN' ? 'Đã Check-in' : 'Check-in ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

interface ZoneAttendeesModalProps {
  zone: any | null;
  attendees: any[];
  onClose: () => void;
}

export const ZoneAttendeesModal = React.memo(({ zone, attendees, onClose }: ZoneAttendeesModalProps) => {
  if (!zone) return null;

  const zoneAttendees = attendees.filter((a: any) => a.ticketTypeName === zone.name);
  const hasAttendees = zoneAttendees.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[85vh]">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20" style={{ backgroundColor: zone.color || '#3b82f6' }}>
              <Icon name="confirmation_number" size="sm" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{zone.name}</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-slate-200/60">
                  {zone.type === 'SEATED' ? 'Có Ghế' : 'Thường'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                Đã bán {zone.sold} / {zone.total} • Doanh thu {new Intl.NumberFormat('vi-VN').format(zone.price * zone.sold)}đ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        {/* Body Content (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 min-h-[250px] bg-slate-50/30">
          {!hasAttendees ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                <Icon name="group_off" size="lg" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Chưa có người mua vé</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium max-w-[240px]">Phân khu này hiện tại chưa có lượt đặt mua vé nào từ khách hàng.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách khách hàng ({zoneAttendees.length})</span>
              </div>
              
              <div className="grid gap-3">
                {zoneAttendees.map((att: any, idx: number) => {
                  const isChecked = att.status === 'CHECKED_IN';
                  return (
                    <div 
                      key={att.ticketId || idx}
                      className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all p-4 rounded-2xl flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          isChecked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {att.userName?.substring(0, 1).toUpperCase() || '?'}
                        </div>
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800 tracking-tight">{att.userName}</h4>
                            {att.seatNumber && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-extrabold tracking-wider uppercase rounded-md border border-blue-100">
                                Ghế {att.seatNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-slate-400">
                            <span className="truncate max-w-[180px]">{att.userEmail}</span>
                            <span className="text-slate-200">•</span>
                            <span>Mua: {new Date(att.purchaseDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Check-in status tag */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                        isChecked 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100/80' 
                          : 'bg-amber-50 text-amber-600 border-amber-100/80'
                      }`}>
                        <Icon name={isChecked ? "check_circle" : "schedule"} size="xxs" filled={isChecked} />
                        {isChecked ? 'Đã đến' : 'Chờ'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Fixed) */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.98]"
          >
            Đóng danh sách
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

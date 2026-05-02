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
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg">{attendee.ticketTypeName}</span>
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
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onCheckIn(attendee.ticketId, attendee.status);
                onClose();
              }}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${attendee.status === 'CHECKED_IN' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02]'}`}
            >
              {attendee.status === 'CHECKED_IN' ? 'Hủy Check-in' : 'Check-in ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

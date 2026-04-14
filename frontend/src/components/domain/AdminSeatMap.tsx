import React from 'react';
import { Icon } from '../ui';

interface Seat {
    id: number;
    seatNumber: string;
    status: string;
    ticketTypeName: string;
}

interface AdminSeatMapProps {
    seats: Seat[];
    highlightedSeatIds: number[];
}

const AdminSeatMap: React.FC<AdminSeatMapProps> = ({ seats, highlightedSeatIds }) => {
    if (!seats || seats.length === 0) return null;

    const seatRows = Array.from(new Set(seats.map(s => s.seatNumber.charAt(0)))).sort();
    const seatsPerRow = Math.max(...seats.map(s => parseInt(s.seatNumber.substring(1))));

    return (
        <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sơ đồ vị trí ghế</h4>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/30"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ghế trong đơn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ghế khác</span>
                    </div>
                </div>
            </div>

            {/* Stage indicator */}
            <div className="w-full h-2 bg-slate-200 rounded-full mb-12 relative">
                <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Sân khấu</p>
            </div>

            <div className="flex flex-col items-center gap-2 overflow-x-auto pb-4">
                {seatRows.map((row) => (
                    <div key={row} className="flex gap-2 items-center">
                        <div className="w-6 text-[10px] font-black text-slate-300">{row}</div>
                        <div className="flex gap-1.5">
                            {Array.from({ length: seatsPerRow }, (_, idx) => {
                                const col = idx + 1;
                                const seatNum = `${row}${col.toString().padStart(2, '0')}`;
                                const seatObj = seats.find(s => s.seatNumber === seatNum);
                                
                                if (!seatObj) return <div key={seatNum} className="w-6 h-6" />;

                                const isHighlighted = highlightedSeatIds.includes(seatObj.id);

                                return (
                                    <div 
                                        key={seatObj.id}
                                        title={`${seatNum} - ${seatObj.ticketTypeName}`}
                                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${isHighlighted 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10' 
                                            : 'bg-white border border-slate-200 text-slate-300'}`}
                                    >
                                        {isHighlighted ? <Icon name="check" size="sm" /> : col}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSeatMap;

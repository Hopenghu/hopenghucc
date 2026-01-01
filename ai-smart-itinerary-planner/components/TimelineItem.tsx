
import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ItineraryItem, Place } from '../types';

interface TimelineItemProps {
  item: ItineraryItem;
  onRemove: (id: string) => void;
  onTimeUpdate?: (id: string, newTime: string) => void;
  onClick?: () => void;
  isLast?: boolean;
  travelTimeToNext?: string;
  travelMode?: 'DRIVING' | 'WALKING';
  nextPlace?: Place;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ 
  item, 
  onRemove, 
  onTimeUpdate,
  onClick, 
  isLast, 
  travelTimeToNext,
  travelMode = 'DRIVING',
  nextPlace
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTime, setTempTime] = useState(item.startTime);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (isEditing ? 100 : 1),
    opacity: isDragging ? 0.3 : 1,
  };

  const modeColor = travelMode === 'DRIVING' ? 'blue' : 'emerald';

  const formatTimeDisplay = (timeStr: string) => {
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? '下午' : '上午';
    const displayH = h % 12 || 12;
    return { ampm, h: displayH.toString().padStart(2, '0'), m: mStr };
  };

  const { ampm, h, m } = formatTimeDisplay(item.startTime);

  const handleTimeSubmit = () => {
    setIsEditing(false);
    if (onTimeUpdate && tempTime !== item.startTime) {
      onTimeUpdate(item.id, tempTime);
    }
  };

  // 監聽點擊外部以關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) handleTimeSubmit();
      }
    };
    if (isEditing) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, tempTime]);

  const handleOpenNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextPlace) return;
    const origin = item.place.location ? `${item.place.location.lat},${item.place.location.lng}` : encodeURIComponent(item.place.name);
    const destination = nextPlace.location ? `${nextPlace.location.lat},${nextPlace.location.lng}` : encodeURIComponent(nextPlace.name);
    const mode = travelMode === 'DRIVING' ? 'driving' : 'walking';
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`, '_blank');
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative flex flex-col group w-full"
    >
      {/* 編輯模式下的背景淡化遮罩 */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/5 backdrop-blur-[1px] z-[90] pointer-events-none" />
      )}

      <div className="flex items-start gap-4 sm:gap-6 w-full relative">
        {/* 左側垂直時間軸線路 */}
        <div className="relative flex flex-col items-center flex-shrink-0">
          <div className="w-4 h-4 rounded-full bg-white border-4 border-blue-600 shadow-xl z-20 relative group-hover:scale-125 transition-all duration-500"></div>
          {!isLast && (
            <div className="absolute top-12 bottom-[-54px] w-[2px] bg-gradient-to-b from-blue-600/30 via-slate-100 to-slate-100 z-10"></div>
          )}
        </div>

        {/* 右側內容區域：時間在上，地點卡片在下 */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* 時間節點區域 */}
          <div ref={containerRef} className="flex-shrink-0 relative z-[101]">
            {isEditing ? (
              /* 時間選擇器彈窗 */
              <div className="absolute top-0 left-0 z-[110] bg-[#1e1e1e] rounded-[2rem] p-4 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] border border-slate-700 w-44 animate-in fade-in zoom-in slide-in-from-left-4 duration-300">
                 {/* 裝飾性箭頭 */}
                 <div className="absolute top-6 -left-2 w-4 h-4 bg-[#1e1e1e] border-l border-t border-slate-700 rotate-[-45deg]"></div>
                 
                 <div className="flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">行程時間</span>
                      <button onClick={handleTimeSubmit} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors">儲存</button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative group">
                        <input 
                          type="time"
                          autoFocus
                          value={tempTime}
                          onChange={(e) => setTempTime(e.target.value)}
                          className="w-full bg-[#2a2d31] text-white border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 px-4 text-2xl font-black tabular-nums outline-none transition-all shadow-inner text-center"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold leading-tight px-1">
                        <i className="fas fa-info-circle mr-1"></i> 修改將自動順延後續行程
                      </p>
                    </div>
                 </div>
              </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="group/time relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-white hover:ring-2 hover:ring-blue-500 transition-all duration-300 w-fit shadow-sm"
              >
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{ampm}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-black text-blue-600 tabular-nums leading-none tracking-tighter">{h}:{m}</span>
                  <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center group-hover/time:bg-blue-600 transition-colors">
                    <i className="fas fa-pencil text-[8px] text-blue-400 group-hover/time:text-white"></i>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* 行程資訊卡片 - 地點區塊 */}
          <div 
            onClick={onClick}
            className={`bg-white p-5 rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between hover:border-blue-400 hover:shadow-[0_25px_60px_rgba(37,99,235,0.12)] transition-all duration-500 cursor-pointer active:scale-[0.98] overflow-hidden ${isEditing ? 'opacity-30' : ''}`}
          >
            <div {...attributes} {...listeners} onClick={e => e.stopPropagation()} className="cursor-grab active:cursor-grabbing mr-4 text-slate-200 hover:text-blue-500 transition-colors p-2 flex-shrink-0">
              <i className="fas fa-grip-vertical text-sm"></i>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 text-[16px] sm:text-[18px] leading-tight break-words whitespace-normal group-hover:text-blue-600 transition-colors tracking-tight">
                {item.place.name}
              </h4>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/60 rounded-xl">
                   <i className="fas fa-hourglass-start text-blue-500 text-[10px]"></i>
                   <span className="text-[11px] text-blue-700 font-black">停留 1.5h</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <i className="fas fa-location-dot text-slate-200 text-[11px]"></i>
                   <span className="text-[11px] text-slate-400 font-bold truncate max-w-[160px]">{item.place.address?.split(' ')[0] || '澎湖縣'}</span>
                 </div>
              </div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="ml-4 w-10 h-10 rounded-2xl flex items-center justify-center text-slate-200 hover:bg-red-50 hover:text-red-500 transition-all duration-300 flex-shrink-0">
              <i className="fas fa-trash-alt text-[12px]"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 交通距離與時間 */}
      {!isLast && (
        <div className="flex items-center gap-4 sm:gap-6 h-[100px] pointer-events-none w-full mt-2">
          <div className="w-4 flex-shrink-0"></div>
          <div className="relative flex-1 flex items-center justify-start min-w-0">
            {travelTimeToNext && (
              <button onClick={handleOpenNavigation} className="pointer-events-auto group/nav relative flex items-center gap-4 bg-white border border-slate-50 py-3.5 px-6 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-500 max-w-[260px]">
                <div className={`w-10 h-10 rounded-2xl bg-${modeColor}-600 flex items-center justify-center text-white text-[13px] shadow-lg group-hover/nav:rotate-12 transition-all`}>
                  <i className={`fas fa-${travelMode === 'DRIVING' ? 'car-side' : 'person-walking'}`}></i>
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black text-slate-900 tabular-nums leading-none">{travelTimeToNext}</span>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>
                  <span className={`text-[9px] font-black text-${modeColor}-500 uppercase tracking-widest leading-none mt-1.5 whitespace-nowrap`}>點擊開啟導覽</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineItem;


import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Place, ItineraryItem, DayPlan } from './types';
import { geminiService } from './services/geminiService';
import { locationService } from './services/LocationService';
import { itineraryService } from './services/ItineraryService';
import PlaceCard from './components/PlaceCard';
import TimelineItem from './components/TimelineItem';
import MapView from './components/MapView';
// import AIChatPanel from './components/AIChatPanel'; // 暫時關閉 AI 聊天功能

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

interface AppProps {
  initialItinerary?: any;
  userItineraries?: any[];
  currentUser?: any;
  onSave?: (itineraryData: any) => Promise<any>;
}

const App: React.FC<AppProps> = ({ 
  initialItinerary, 
  userItineraries = [], 
  currentUser,
  onSave 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [dayPlans, setDayPlans] = useState<DayPlan[]>(() => {
    if (initialItinerary && initialItinerary.dayPlans) {
      // 如果從資料庫載入的日期是 "第X天" 格式，轉換為實際日期
      return initialItinerary.dayPlans.map((plan, index) => {
        if (plan.date && (plan.date.includes('第') || plan.date.includes('天'))) {
          // 轉換為今天開始的日期
          const today = new Date();
          today.setDate(today.getDate() + index);
          return { ...plan, date: today.toISOString().split('T')[0] };
        }
        return plan;
      });
    }
    // 預設從今天開始的三天
    const today = new Date();
    return [
      { date: today.toISOString().split('T')[0], items: [] },
      { date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], items: [] },
      { date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], items: [] }
    ];
  });
  const [travelDurations, setTravelDurations] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();
  const [sheetState, setSheetState] = useState<'low' | 'high'>('low');
  // const [isAIChatOpen, setIsAIChatOpen] = useState(false); // 暫時關閉 AI 聊天功能
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(
    initialItinerary?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showPersonalLocations, setShowPersonalLocations] = useState(false);
  const [personalLocations, setPersonalLocations] = useState<Place[]>([]);
  const [isLoadingPersonalLocations, setIsLoadingPersonalLocations] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Location permission denied")
      );
    }
  }, []);

  // 自動儲存功能
  useEffect(() => {
    if (!onSave || !currentUser) return;

    // 清除之前的定時器
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // 設定新的自動儲存定時器（3秒延遲）
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (isSaving) return;
      
      setIsSaving(true);
      try {
        const itineraryData = {
          title: `澎湖行程 ${new Date().toLocaleDateString('zh-TW')}`,
          dayPlans,
        };

        if (currentItineraryId) {
          itineraryData.id = currentItineraryId;
        }

        const saved = await onSave(itineraryData);
        if (saved && saved.id) {
          setCurrentItineraryId(saved.id);
          // 顯示保存成功提示（如果 onSave 沒有顯示）
          if (typeof window !== 'undefined' && window.showToast) {
            window.showToast('行程已自動儲存', 'success');
          }
        }
      } catch (error) {
        console.error('[App] Auto-save failed:', error);
        // 顯示錯誤提示
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('自動儲存失敗，請稍後再試', 'error');
        }
      } finally {
        setIsSaving(false);
      }
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [dayPlans, onSave, currentUser, currentItineraryId, isSaving]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await geminiService.searchPlaces(searchQuery, userLocation?.lat, userLocation?.lng);
    setSearchResults(results);
    setIsSearching(false);
  };

  const loadPersonalLocations = async () => {
    if (!currentUser) return;
    setIsLoadingPersonalLocations(true);
    try {
      const response = await locationService.getPersonalLocations();
      if (response.success && response.data) {
        // 轉換為 Place 格式
        const places: Place[] = response.data.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          location: loc.latitude && loc.longitude ? {
            lat: loc.latitude,
            lng: loc.longitude
          } : undefined,
          rating: loc.google_rating,
          userRatingCount: loc.google_user_ratings_total,
          phoneNumber: loc.phone_number,
          website: loc.website,
          types: typeof loc.google_types === 'string' ? JSON.parse(loc.google_types) : loc.google_types,
          thumbnail: loc.thumbnail_url,
          google_place_id: loc.google_place_id,
          place_id: loc.google_place_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          lat: loc.latitude,
          lng: loc.longitude,
          google_rating: loc.google_rating,
          user_ratings_total: loc.google_user_ratings_total
        }));
        setPersonalLocations(places);
        setShowPersonalLocations(true);
      }
    } catch (error) {
      console.error('[App] Error loading personal locations:', error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast('載入個人地點失敗', 'error');
      }
    } finally {
      setIsLoadingPersonalLocations(false);
    }
  };

  const createItineraryItem = (place: Place): ItineraryItem => {
    const currentItems = dayPlans[currentDayIndex].items;
    let startTime = "09:00";
    if (currentItems.length > 0) {
      const last = currentItems[currentItems.length - 1];
      const [h, m] = last.startTime.split(':').map(Number);
      const newH = (h + 1) % 24;
      startTime = `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      place,
      startTime,
      duration: 60
    };
  };

  const addPlaceToItinerary = (place: Place) => {
    setDayPlans(prev => {
      const newPlans = [...prev];
      const items = newPlans[currentDayIndex].items;
      if (items.some(i => i.place.id === place.id)) return prev;
      newPlans[currentDayIndex].items = [...items, createItineraryItem(place)];
      return newPlans;
    });
    setSearchResults([]);
    setSearchQuery('');
    setSelectedPlace(null);
  };

  const removeItem = (id: string) => {
    setDayPlans(prev => {
      const newPlans = [...prev];
      newPlans[currentDayIndex].items = newPlans[currentDayIndex].items.filter(i => i.id !== id);
      return newPlans;
    });
  };

  const updateItemTime = (id: string, newTime: string) => {
    setDayPlans(prev => {
      const newPlans = [...prev];
      const items = [...newPlans[currentDayIndex].items];
      const idx = items.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const oldTimeInMinutes = timeToMinutes(items[idx].startTime);
      const newTimeInMinutes = timeToMinutes(newTime);
      const diff = newTimeInMinutes - oldTimeInMinutes;
      for (let i = idx; i < items.length; i++) {
        const currentMins = timeToMinutes(items[i].startTime);
        items[i] = {
          ...items[i],
          startTime: i === idx ? newTime : minutesToTime(currentMins + diff)
        };
      }
      newPlans[currentDayIndex].items = items;
      return newPlans;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDayPlans((prev) => {
        const newPlans = [...prev];
        const items = newPlans[currentDayIndex].items;
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        newPlans[currentDayIndex].items = arrayMove(items, oldIndex, newIndex);
        return newPlans;
      });
    }
  };

  const addNewDay = () => {
    const newDayNumber = dayPlans.length + 1;
    // 計算新日期的日期（從第一天開始，每天加一天）
    const firstDate = dayPlans.length > 0 && dayPlans[0].date ? new Date(dayPlans[0].date) : new Date();
    if (dayPlans.length > 0 && dayPlans[0].date && !dayPlans[0].date.includes('第')) {
      // 如果第一天有實際日期，則新日期是第一天 + (newDayNumber - 1) 天
      const baseDate = new Date(dayPlans[0].date);
      baseDate.setDate(baseDate.getDate() + (newDayNumber - 1));
      setDayPlans(prev => [...prev, { date: baseDate.toISOString().split('T')[0], items: [] }]);
    } else {
      // 如果沒有實際日期，使用今天作為第一天
      const newDate = new Date(firstDate);
      newDate.setDate(newDate.getDate() + (newDayNumber - 1));
      setDayPlans(prev => [...prev, { date: newDate.toISOString().split('T')[0], items: [] }]);
    }
    setCurrentDayIndex(dayPlans.length);
  };

  const updateDayDate = (dayIndex: number, newDate: string) => {
    setDayPlans(prev => {
      const newPlans = [...prev];
      newPlans[dayIndex] = { ...newPlans[dayIndex], date: newDate };
      return newPlans;
    });
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '未設定日期';
    if (dateStr.includes('第') && dateStr.includes('天')) return dateStr; // 保持舊格式兼容
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[date.getDay()];
      
      return `${year}/${month}/${day} (${weekday})`;
    } catch {
      return dateStr;
    }
  };

  const optimizeItinerary = async () => {
    const currentItems = dayPlans[currentDayIndex].items;
    if (currentItems.length < 2) return;
    setIsOptimizing(true);
    const optimizedData = await geminiService.optimizeDayPlan(currentItems.map(i => i.place));
    if (optimizedData && optimizedData.itinerary) {
      setDayPlans(prev => {
        const newPlans = [...prev];
        const items = [...newPlans[currentDayIndex].items];
        const reordered = optimizedData.itinerary.map((optItem: any) => {
          const originalItem = items.find(i => i.place.name === optItem.placeName);
          return originalItem ? { ...originalItem, startTime: optItem.recommendedTime || originalItem.startTime } : null;
        }).filter(Boolean);
        if (reordered.length > 0) newPlans[currentDayIndex].items = reordered;
        return newPlans;
      });
    }
    setIsOptimizing(false);
  };

  const handleMapBlur = () => {
    setSelectedPlace(null);
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans relative">
      {/* 保存狀態指示器 */}
      {isSaving && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <i className="fas fa-spinner fa-spin text-sm"></i>
          <span className="text-sm font-bold">正在儲存...</span>
        </div>
      )}
      
      {/* 左側行程面板 - 鎖定寬度但允許內容溢出以便顯示彈窗 */}
      <aside className="hidden lg:flex flex-col w-[30%] xl:w-[28%] bg-white border-r border-slate-100 shadow-2xl z-20 relative">
        <div className="p-6 xl:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl xl:text-3xl font-black text-blue-600 tracking-tighter leading-none">行程規劃</h1>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {dayPlans.map((_, i) => (
                <button key={i} onClick={() => {setCurrentDayIndex(i); setTravelDurations([]);}} className={`px-4 py-2 rounded-full text-[11px] font-black transition-all duration-300 ${currentDayIndex === i ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>D{i+1}</button>
              ))}
              <button onClick={addNewDay} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center flex-shrink-0 shadow-sm"><i className="fas fa-plus text-[10px]"></i></button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button onClick={() => setTravelMode('DRIVING')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black transition-all ${travelMode === 'DRIVING' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}><i className="fas fa-car-side"></i> 行車</button>
            <button onClick={() => setTravelMode('WALKING')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black transition-all ${travelMode === 'WALKING' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}><i className="fas fa-person-walking"></i> 步行</button>
          </div>
        </div>

        {/* 核心滾動區域 - 移除 overflow-x-hidden 以確保彈窗不被裁切 */}
        <div className="flex-1 overflow-y-auto overflow-x-visible px-4 xl:px-8 py-4 custom-scrollbar bg-[#fdfdfe] relative">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">{formatDateDisplay(dayPlans[currentDayIndex].date)} 行程規劃</h2>
              <input
                type="date"
                value={dayPlans[currentDayIndex].date.includes('第') ? '' : dayPlans[currentDayIndex].date}
                onChange={(e) => updateDayDate(currentDayIndex, e.target.value)}
                className="text-[10px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="選擇日期"
              />
            </div>
            <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
          </div>
          
          <div className="w-full relative">
            {dayPlans[currentDayIndex].items.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-white">
                <i className="fas fa-map-location-dot text-slate-200 text-4xl mb-4"></i>
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest px-8">搜尋景點開始你的澎湖冒險</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={dayPlans[currentDayIndex].items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-0 w-full relative">
                    {dayPlans[currentDayIndex].items.map((item, idx) => (
                      <TimelineItem key={item.id} item={item} onRemove={removeItem} onTimeUpdate={updateItemTime} onClick={() => setSelectedPlace({...item.place})} isLast={idx === dayPlans[currentDayIndex].items.length - 1} travelTimeToNext={travelDurations[idx]} travelMode={travelMode} nextPlace={dayPlans[currentDayIndex].items[idx + 1]?.place} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 relative z-30">
          <button onClick={optimizeItinerary} disabled={dayPlans[currentDayIndex].items.length < 2 || isOptimizing} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.97] disabled:opacity-30">
            {isOptimizing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>} AI 智慧優化排序
          </button>
        </div>
      </aside>

      {/* 右側地圖區域 */}
      <main className="flex-1 relative bg-slate-100 overflow-hidden h-full">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] lg:w-[540px] z-30">
          <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-white p-2 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
              <i className="fas fa-search text-lg"></i>
            </div>
            <input type="text" placeholder="搜尋澎湖秘境、美食..." className="flex-1 bg-transparent border-none outline-none text-base font-bold text-slate-700 placeholder:text-slate-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <button 
              onClick={loadPersonalLocations}
              disabled={isLoadingPersonalLocations || !currentUser}
              className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50"
              title="我的地點收藏"
            >
              {isLoadingPersonalLocations ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                <i className="fas fa-bookmark text-lg"></i>
              )}
            </button>
          </div>
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full mt-5 w-full bg-white/95 rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[50vh] flex flex-col p-4 gap-2">
                {searchResults.map((place) => (
                  <PlaceCard key={place.id} place={place} onClick={() => { setSelectedPlace({...place}); setSearchResults([]); if (window.innerWidth < 1024) setSheetState('low'); }} />
                ))}
              </motion.div>
            )}
            {showPersonalLocations && personalLocations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full mt-5 w-full bg-white/95 rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[50vh] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-700">我的地點收藏 ({personalLocations.length})</h3>
                  <button 
                    onClick={() => { setShowPersonalLocations(false); setPersonalLocations([]); }}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(50vh-60px)] p-4 gap-2 flex flex-col">
                  {personalLocations.map((place) => (
                    <PlaceCard key={place.id} place={place} onClick={() => { 
                      addPlaceToItinerary(place);
                      setShowPersonalLocations(false);
                      setPersonalLocations([]);
                      if (typeof window !== 'undefined' && window.showToast) {
                        window.showToast('已加入行程', 'success');
                      }
                    }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full h-full">
          <MapView items={dayPlans[currentDayIndex].items} center={userLocation} travelMode={travelMode} onAddPlaceFromMap={addPlaceToItinerary} selectedPlace={selectedPlace} onInfoWindowClose={handleMapBlur} onTravelDataUpdate={(durations) => setTravelDurations(durations)} />
        </div>

        {/* Mobile Sheet */}
        <motion.div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] shadow-2xl z-40 overflow-hidden flex flex-col" animate={{ height: sheetState === 'high' ? '85%' : '25%' }} transition={{ type: 'spring', damping: 25 }}>
          <div className="w-full h-12 flex flex-col items-center justify-center cursor-pointer" onClick={() => setSheetState(sheetState === 'low' ? 'high' : 'low')}>
            <div className="w-14 h-1.5 bg-slate-100 rounded-full" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-28 custom-scrollbar">
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="text-2xl font-black text-slate-900">{dayPlans[currentDayIndex].date}</h2>
               <div className="flex gap-2">
                {dayPlans.map((_, i) => (
                  <button key={i} onClick={() => {setCurrentDayIndex(i); setTravelDurations([]);}} className={`w-11 h-11 rounded-full text-[11px] font-black ${currentDayIndex === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>D{i+1}</button>
                ))}
               </div>
            </div>
            <div className="space-y-0 w-full relative">
              {dayPlans[currentDayIndex].items.map((item, idx) => (
                <TimelineItem key={item.id} item={item} onRemove={removeItem} onTimeUpdate={updateItemTime} onClick={() => { setSelectedPlace({...item.place}); setSheetState('low'); }} isLast={idx === dayPlans[currentDayIndex].items.length - 1} travelTimeToNext={travelDurations[idx]} travelMode={travelMode} nextPlace={dayPlans[currentDayIndex].items[idx + 1]?.place} />
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* AI Chat Panel - 暫時關閉 */}
      {/* <AIChatPanel
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        context={{
          currentDay: currentDayIndex,
          places: dayPlans[currentDayIndex].items.map(item => item.place.name),
        }}
      /> */}

      {/* AI Chat Floating Button - 暫時關閉 */}
      {/* {!isAIChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl flex items-center justify-center z-40 hover:shadow-blue-500/50 transition-all"
        >
          <i className="fas fa-robot text-xl"></i>
        </motion.button>
      )} */}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;

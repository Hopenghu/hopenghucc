
import React, { useEffect, useRef, useState } from 'react';
import { ItineraryItem, Place as MyPlaceType } from '../types';
import { locationService } from '../services/LocationService';
import { authService } from '../services/AuthService';

declare var google: any;

interface MapViewProps {
  items: ItineraryItem[];
  center?: { lat: number; lng: number };
  travelMode?: 'DRIVING' | 'WALKING';
  onAddPlaceFromMap: (place: MyPlaceType) => void;
  selectedPlace?: MyPlaceType | null;
  onInfoWindowClose?: () => void;
  onTravelDataUpdate?: (durations: string[]) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  items, 
  center, 
  travelMode = 'DRIVING',
  onAddPlaceFromMap, 
  selectedPlace, 
  onInfoWindowClose,
  onTravelDataUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const timeMarkersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]); 
  const infoWindowRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // 獲取 Google Maps API Key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/itinerary/maps-api-key', {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.apiKey) {
            setGoogleMapsApiKey(data.apiKey);
          }
        }
      } catch (error) {
        console.error('[MapView] Failed to fetch Google Maps API key:', error);
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!mapRef.current || !googleMapsApiKey) return;

      const bootstrap = (g: any) => {
        var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__googleMapsCallback__", m = document, b = window;
        // @ts-ignore
        b = b[c] || (b[c] = {});
        // @ts-ignore
        var d = b.maps || (b.maps = {}), r = new Set(), e = new URLSearchParams(), u = () => h || (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          a.async = true;
          e.set("libraries", [...r] + "");
          for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.googleapis.com/maps/api/js?` + e;
          // @ts-ignore
          d[q] = f;
          a.onerror = () => h = n(Error(p + " could not load."));
          m.head.append(a);
        }));
        d[l] ? console.warn(p + " only loads once. Re-trying:", g) : d[l] = (f: any, ...n: any) => r.add(f) && u().then(() => d[l](f, ...n));
      };

      if (!(window as any).google?.maps?.importLibrary) {
        bootstrap({ key: googleMapsApiKey, v: "weekly", loading: "async" });
      }

      try {
        const { Map, InfoWindow } = await (window as any).google.maps.importLibrary("maps");
        const defaultCenter = center || { lat: 23.5713, lng: 119.5793 };

        googleMapRef.current = new Map(mapRef.current, {
          center: defaultCenter,
          zoom: 12,
          mapId: "DEMO_MAP_ID", 
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: true,
          gestureHandling: 'greedy', // 允許滾動縮放，不需要按 command
        });

        infoWindowRef.current = new InfoWindow();
        infoWindowRef.current.addListener('closeclick', () => {
          if (onInfoWindowClose) onInfoWindowClose();
        });

        googleMapRef.current.addListener("click", async (event: any) => {
          if (event.placeId) {
            event.stop();
            handlePoiClick(event.placeId);
          } else {
            if (onInfoWindowClose) onInfoWindowClose();
          }
        });

        setIsApiReady(true);
      } catch (error) {
        console.error("Failed to load Google Maps libraries:", error);
      }
    };

    init();
    return () => clearMarkers();
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (isApiReady) updateMapContent();
  }, [items, isApiReady, travelMode]);

  useEffect(() => {
    const syncSelectedPlace = async () => {
      if (!isApiReady || !googleMapRef.current || !selectedPlace) {
        if (isApiReady && !selectedPlace && infoWindowRef.current) infoWindowRef.current.close();
        return;
      }

      if (selectedPlace.location) {
        googleMapRef.current.panTo(selectedPlace.location);
        googleMapRef.current.setZoom(16);
        showCustomInfoWindow(selectedPlace);
      } else {
        try {
          const { Place } = await (window as any).google.maps.importLibrary("places");
          const request = {
            textQuery: selectedPlace.name,
            fields: ["displayName", "formattedAddress", "location", "id", "rating", "userRatingCount", "nationalPhoneNumber", "websiteURI", "types"],
            maxResultCount: 1,
            locationBias: googleMapRef.current.getCenter(),
          };

          const { places } = await Place.searchByText(request);
          if (places && places.length > 0) {
            const res = places[0];
            const resolvedPlace: MyPlaceType = {
              ...selectedPlace,
              id: res.id || selectedPlace.id,
              location: { lat: res.location.lat(), lng: res.location.lng() },
              address: res.formattedAddress || selectedPlace.address,
              formatted_address: res.formattedAddress || selectedPlace.address,
              rating: res.rating,
              userRatingCount: res.userRatingCount,
              phoneNumber: res.nationalPhoneNumber,
              website: res.websiteURI,
              types: res.types,
              // 添加 Google Place 相關欄位
              google_place_id: res.id || selectedPlace.id,
              place_id: res.id || selectedPlace.id,
              latitude: res.location.lat(),
              longitude: res.location.lng(),
              lat: res.location.lat(),
              lng: res.location.lng(),
              google_rating: res.rating,
              user_ratings_total: res.userRatingCount
            };
            googleMapRef.current.panTo(resolvedPlace.location);
            googleMapRef.current.setZoom(16);
            showCustomInfoWindow(resolvedPlace);
          }
        } catch (e) {
          console.error("Resolve place error:", e);
        }
      }
    };
    syncSelectedPlace();
  }, [selectedPlace, isApiReady]);

  const handlePoiClick = async (placeId: string) => {
    try {
      const { Place } = await (window as any).google.maps.importLibrary("places");
      const myPlace = new Place({ id: placeId });
      await myPlace.fetchFields({
        fields: ["displayName", "formattedAddress", "location", "rating", "userRatingCount", "nationalPhoneNumber", "websiteURI", "regularOpeningHours", "types", "priceLevel"]
      });
      const placeData: MyPlaceType = {
        id: placeId,
        name: myPlace.displayName || "未知地點",
        address: myPlace.formattedAddress,
        formatted_address: myPlace.formattedAddress,
        rating: myPlace.rating,
        userRatingCount: myPlace.userRatingCount,
        phoneNumber: myPlace.nationalPhoneNumber,
        website: myPlace.websiteURI,
        types: myPlace.types,
        location: { lat: myPlace.location.lat(), lng: myPlace.location.lng() },
        // 添加 Google Place 相關欄位
        google_place_id: placeId,
        place_id: placeId,
        latitude: myPlace.location.lat(),
        longitude: myPlace.location.lng(),
        lat: myPlace.location.lat(),
        lng: myPlace.location.lng(),
        google_rating: myPlace.rating,
        user_ratings_total: myPlace.userRatingCount
      };
      showCustomInfoWindow(placeData);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const showCustomInfoWindow = async (place: MyPlaceType) => {
    if (!googleMapRef.current || !infoWindowRef.current) return;
    
    // 檢查用戶是否已登入
    const isAuthenticated = authService.isAuthenticated();
    let userStatus: 'visited' | 'want_to_visit' | 'want_to_revisit' | null = null;
    let isFavorite = false;
    
    if (isAuthenticated && place.id) {
      try {
        const statusResponse = await locationService.getUserLocationStatus(place.id);
        if (statusResponse.success && statusResponse.data) {
          userStatus = statusResponse.data.status;
        }
      } catch (error) {
        console.error('[MapView] Error loading user status:', error);
      }
    }
    
    const container = document.createElement('div');
    container.className = "p-0 min-w-[300px] max-w-[340px] font-sans overflow-hidden rounded-3xl bg-white";
    const ratingStars = place.rating 
      ? Array(5).fill(0).map((_, i) => {
          const fill = Math.min(Math.max(place.rating! - i, 0), 1);
          return `<i class="fas fa-star ${fill >= 0.8 ? 'text-amber-400' : fill >= 0.3 ? 'text-amber-400/60' : 'text-slate-100'}" style="font-size: 11px;"></i>`;
        }).join('') : "";
    const ratingHtml = place.rating 
      ? `<div class="flex items-center gap-2 mb-4 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-100/50">
           <div class="flex gap-0.5">${ratingStars}</div>
           <span class="text-amber-700 text-xs font-black">${place.rating}</span>
           <span class="text-amber-600/50 text-[10px] font-bold">/ ${place.userRatingCount?.toLocaleString()} 則評論</span>
         </div>` : "";
    const typesHtml = place.types 
      ? `<div class="flex flex-wrap gap-1.5 mb-5">
           ${place.types.slice(0, 3).map(t => `<span class="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">${t.replace('_', ' ')}</span>`).join('')}
         </div>` : "";
    
    const interactionButtons = isAuthenticated && place.id ? `
      <div class="flex items-center gap-2 mb-4 pt-4 border-t border-slate-50">
        <button id="btn-status-visited-${place.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${
          userStatus === 'visited' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
        }">
          <i class="fas fa-check mr-1"></i>來過
        </button>
        <button id="btn-status-want-${place.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${
          userStatus === 'want_to_visit' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
        }">
          <i class="fas fa-heart mr-1"></i>想來
        </button>
        <button id="btn-status-revisit-${place.id}" class="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black transition-all ${
          userStatus === 'want_to_revisit' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600'
        }">
          <i class="fas fa-redo mr-1"></i>想再來
        </button>
        <button id="btn-favorite-${place.id}" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isFavorite ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500'
        }">
          <i class="fas fa-star text-[10px]"></i>
        </button>
      </div>
    ` : '';
    
    container.innerHTML = `
      <div class="p-6">
        <div class="flex justify-between items-start mb-5">
           <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[14px] shadow-xl shadow-blue-200">
               <i class="fas fa-location-dot"></i>
             </div>
             <div class="flex flex-col">
               <span class="text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1">Discover Place</span>
               <div class="w-8 h-1 bg-blue-100 rounded-full"></div>
             </div>
           </div>
        </div>
        <div class="font-black text-2xl text-slate-900 leading-tight mb-2 tracking-tighter">${place.name}</div>
        ${ratingHtml}
        ${typesHtml}
        <div class="space-y-4 pt-5 border-t border-slate-50">
          ${place.phoneNumber ? `<div class="flex items-center gap-4 group"><div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><i class="fas fa-phone text-[10px]"></i></div><span class="text-[13px] text-slate-700 font-bold">${place.phoneNumber}</span></div>` : ''}
          ${place.website ? `<a href="${place.website}" target="_blank" class="flex items-center gap-4 group transition-all"><div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i class="fas fa-link text-[10px]"></i></div><span class="text-[13px] text-indigo-600 font-black group-hover:underline">造訪官方網站</span></a>` : ''}
          <div class="flex items-start gap-4"><div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm"><i class="fas fa-map text-[10px]"></i></div><span class="text-[12px] text-slate-500 font-medium leading-relaxed">${place.address || '地址資訊'}</span></div>
        </div>
        ${interactionButtons}
        <button id="btn-add-${place.id}" class="mt-4 w-full py-4.5 bg-slate-900 hover:bg-blue-600 text-white rounded-[1.25rem] text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-slate-200 active:scale-[0.96] flex items-center justify-center gap-3 overflow-hidden group relative">
          <span class="relative z-10"><i class="fas fa-plus-circle mr-1"></i> 加入此行程</span>
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    `;
    infoWindowRef.current.setContent(container);
    infoWindowRef.current.setPosition(place.location);
    infoWindowRef.current.open(googleMapRef.current);
    
    // 設定事件監聽器
    setTimeout(() => {
      const btnAdd = document.getElementById(`btn-add-${place.id}`);
      if (btnAdd) {
        btnAdd.onclick = (e) => { 
          e.preventDefault(); 
          onAddPlaceFromMap(place); 
          infoWindowRef.current.close(); 
        };
      }
      
      if (isAuthenticated && place.id) {
        // 設定狀態按鈕
        const btnVisited = document.getElementById(`btn-status-visited-${place.id}`);
        const btnWant = document.getElementById(`btn-status-want-${place.id}`);
        const btnRevisit = document.getElementById(`btn-status-revisit-${place.id}`);
        const btnFavorite = document.getElementById(`btn-favorite-${place.id}`);
        
        if (btnVisited) {
          btnVisited.onclick = async (e) => {
            e.preventDefault();
            try {
              await locationService.setUserLocationStatus(place.id!, 'visited');
              showCustomInfoWindow(place); // 重新載入以更新狀態
            } catch (error) {
              console.error('[MapView] Error setting status:', error);
            }
          };
        }
        
        if (btnWant) {
          btnWant.onclick = async (e) => {
            e.preventDefault();
            try {
              await locationService.setUserLocationStatus(place.id!, 'want_to_visit');
              showCustomInfoWindow(place);
            } catch (error) {
              console.error('[MapView] Error setting status:', error);
            }
          };
        }
        
        if (btnRevisit) {
          btnRevisit.onclick = async (e) => {
            e.preventDefault();
            try {
              await locationService.setUserLocationStatus(place.id!, 'want_to_revisit');
              showCustomInfoWindow(place);
            } catch (error) {
              console.error('[MapView] Error setting status:', error);
            }
          };
        }
        
        if (btnFavorite) {
          btnFavorite.onclick = async (e) => {
            e.preventDefault();
            try {
              if (isFavorite) {
                await locationService.unfavoriteLocation(place.id!);
              } else {
                await locationService.favoriteLocation(place.id!);
              }
              showCustomInfoWindow(place);
            } catch (error) {
              console.error('[MapView] Error toggling favorite:', error);
            }
          };
        }
      }
    }, 10);
  };

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    timeMarkersRef.current.forEach(m => m.setMap(null));
    timeMarkersRef.current = [];
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
  };

  const estimateTravelTimeSmartly = (p1: any, p2: any) => {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    const estimatedDistance = distance * (travelMode === 'DRIVING' ? 1.45 : 1.2);
    const avgSpeed = travelMode === 'DRIVING' ? 40 : 5; 
    const hours = estimatedDistance / avgSpeed;
    const minutes = Math.max(3, Math.round(hours * 60));
    return { text: `${minutes} 分鐘`, isEstimated: true, status: "預估" };
  };

  const calculateTravelTimesAndRoutes = async (path: any[]) => {
    if (path.length < 2) return [];
    const results = [];
    const directionsService = new (window as any).google.maps.DirectionsService();
    for (let i = 0; i < path.length - 1; i++) {
      try {
        const routeResponse = await new Promise<any>((resolve, reject) => {
          directionsService.route({
            origin: path[i],
            destination: path[i+1],
            travelMode: travelMode === 'DRIVING' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING,
          }, (res: any, status: string) => {
            if (status === "OK") resolve(res); else reject(status);
          });
        });
        const leg = routeResponse.routes[0].legs[0];
        results.push({
          index: i,
          duration: leg.duration.text,
          status: travelMode === 'DRIVING' ? "行車" : "步行",
          isEstimated: false,
          midpoint: leg.steps[Math.floor(leg.steps.length / 2)].end_location,
          overview_path: routeResponse.routes[0].overview_path
        });
      } catch (err) {
        const est = estimateTravelTimeSmartly(path[i], path[i+1]);
        results.push({
          index: i,
          duration: est.text,
          status: "預估",
          isEstimated: true,
          midpoint: { lat: (path[i].lat + path[i+1].lat) / 2, lng: (path[i].lng + path[i+1].lng) / 2 },
          overview_path: [path[i], path[i+1]]
        });
      }
    }
    return results;
  };

  const updateMapContent = async () => {
    if (!googleMapRef.current || !isApiReady) return;
    clearMarkers();
    const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker");
    const { Polyline } = await (window as any).google.maps.importLibrary("maps");
    const bounds = new (window as any).google.maps.LatLngBounds();
    const path: any[] = [];
    items.forEach((item, index) => {
      if (item.place.location) {
        const pin = new PinElement({ background: "#2563eb", borderColor: "#ffffff", glyphColor: "#ffffff", glyphText: (index + 1).toString(), scale: 1.1 });
        const marker = new AdvancedMarkerElement({ map: googleMapRef.current, position: item.place.location, title: item.place.name, content: pin.element });
        marker.addListener('click', () => showCustomInfoWindow(item.place));
        markersRef.current.push(marker);
        path.push(item.place.location);
        bounds.extend(item.place.location);
      }
    });
    if (path.length > 1) {
      calculateTravelTimesAndRoutes(path).then(travelData => {
        // 更新父組件的時間狀態
        if (onTravelDataUpdate) {
          onTravelDataUpdate(travelData.map(d => d.duration));
        }

        travelData.forEach(segment => {
          const roadLine = new Polyline({
            path: segment.overview_path,
            geodesic: true,
            strokeColor: travelMode === 'DRIVING' ? '#2563eb' : '#10b981',
            strokeOpacity: 0.6,
            strokeWeight: 6,
            map: googleMapRef.current
          });
          polylinesRef.current.push(roadLine);
          const timeBadge = document.createElement('div');
          timeBadge.className = "pointer-events-none group";
          const color = travelMode === 'DRIVING' ? 'blue' : 'emerald';
          timeBadge.innerHTML = `
            <div class="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-${color}-100 flex items-center gap-3 transform transition-all duration-500 hover:scale-110">
              <div class="w-7 h-7 rounded-xl bg-${color}-600 flex items-center justify-center shadow-lg">
                <i class="fas fa-${travelMode === 'DRIVING' ? 'car-side' : 'person-walking'} text-[10px] text-white"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-[12px] font-black text-slate-800 leading-none mb-0.5">${segment.duration}</span>
                <span class="text-[8px] font-black text-${color}-500 uppercase tracking-widest leading-none">${segment.status}路徑</span>
              </div>
            </div>`;
          const timeMarker = new AdvancedMarkerElement({ map: googleMapRef.current, position: segment.midpoint, content: timeBadge, zIndex: 200 });
          timeMarkersRef.current.push(timeMarker);
        });
      });
    } else {
      // 只有一個景點或沒有景點時清空時間
      if (onTravelDataUpdate) onTravelDataUpdate([]);
    }
    if (path.length > 0 && !selectedPlace) googleMapRef.current.fitBounds(bounds, { padding: 140 });
  };

  return (
    <div className="absolute inset-0 bg-slate-100 overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {!isApiReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 backdrop-blur-xl z-50">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-16 h-16"><div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div><div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            <div className="text-center"><p className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] mb-1">PENGHU AI MAP</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Initializing Smart Interface...</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

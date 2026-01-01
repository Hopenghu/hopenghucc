
import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { locationService } from '../services/LocationService';
import { authService } from '../services/AuthService';

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
  showInteractions?: boolean;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onClick, showInteractions = true }) => {
  const [userStatus, setUserStatus] = useState<'visited' | 'want_to_visit' | 'want_to_revisit' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated && place.id && showInteractions) {
        await loadUserStatus();
      }
    };
    checkAuth();
  }, [place.id, showInteractions]);

  const loadUserStatus = async () => {
    if (!place.id) return;
    try {
      const statusResponse = await locationService.getUserLocationStatus(place.id);
      if (statusResponse.success && statusResponse.data) {
        setUserStatus(statusResponse.data.status);
      }
    } catch (error) {
      console.error('[PlaceCard] Error loading user status:', error);
    }
  };

  const handleStatusClick = async (e: React.MouseEvent, status: 'visited' | 'want_to_visit' | 'want_to_revisit') => {
    e.stopPropagation();
    if (!isAuthenticated || !place.id || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await locationService.setUserLocationStatus(place.id, status);
      if (response.success) {
        setUserStatus(status);
      }
    } catch (error) {
      console.error('[PlaceCard] Error setting status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !place.id || isLoading) return;
    
    setIsLoading(true);
    try {
      if (isFavorite) {
        await locationService.unfavoriteLocation(place.id);
        setIsFavorite(false);
      } else {
        await locationService.favoriteLocation(place.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('[PlaceCard] Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:border-blue-200 cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 truncate text-sm group-hover:text-blue-600 transition-colors">{place.name}</h3>
          {place.address && (
            <p className="text-[10px] text-slate-400 mt-1 truncate font-medium">
              <i className="fas fa-map-marker-alt mr-1 text-slate-300"></i> {place.address}
            </p>
          )}
          {place.rating && (
            <div className="flex items-center gap-1 mt-1">
              <i className="fas fa-star text-amber-400 text-[9px]"></i>
              <span className="text-[9px] text-slate-500 font-bold">{place.rating}</span>
              {place.userRatingCount && (
                <span className="text-[8px] text-slate-400">({place.userRatingCount})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && showInteractions && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleStatusClick(e, 'visited')}
                disabled={isLoading}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  userStatus === 'visited'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                }`}
                title="來過"
              >
                <i className="fas fa-check text-[9px]"></i>
              </button>
              <button
                onClick={(e) => handleStatusClick(e, 'want_to_visit')}
                disabled={isLoading}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  userStatus === 'want_to_visit'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                title="想來"
              >
                <i className="fas fa-heart text-[9px]"></i>
              </button>
              <button
                onClick={(e) => handleStatusClick(e, 'want_to_revisit')}
                disabled={isLoading}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  userStatus === 'want_to_revisit'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600'
                }`}
                title="想再來"
              >
                <i className="fas fa-redo text-[9px]"></i>
              </button>
              <button
                onClick={handleFavoriteClick}
                disabled={isLoading}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isFavorite
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                }`}
                title="收藏"
              >
                <i className={`fas ${isFavorite ? 'fa-star' : 'fa-star'} text-[9px]`}></i>
              </button>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i className="fas fa-chevron-right text-[10px]"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;

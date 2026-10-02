import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './FloatingMapControls.css';

export interface FloatingMapControlsProps {
  onFindMyLocation: () => void;
  onOpenMapOptions: () => void;
  isLocating?: boolean;
  onResetNorth?: () => void;
  onTogglePitch?: () => void;
  onToggleFullscreen?: () => void;
  bearing?: number;
  is3D?: boolean;
  isFullscreen?: boolean;
}

export const FloatingMapControls: React.FC<FloatingMapControlsProps> = ({
  onFindMyLocation,
  onOpenMapOptions,
  isLocating = false,
  onResetNorth,
  onTogglePitch,
  onToggleFullscreen,
  bearing = 0,
  is3D = false,
  isFullscreen = false,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  return (
    <div className="floating-map-controls" aria-label="Map Controls">
      {/* 1. Map Options & Layers Button */}
      <button
        type="button"
        className="floating-btn map-options-trigger"
        onClick={onOpenMapOptions}
        title={isAr ? 'خيارات الخريطة والطبقات' : 'Map Options & Layers'}
        aria-label="Map options"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>

      {/* 2. Find My Location Button */}
      <button
        type="button"
        className={`floating-btn find-location-trigger ${isLocating ? 'is-locating' : ''}`}
        onClick={onFindMyLocation}
        disabled={isLocating}
        title={isAr ? 'تحديد موقعي' : 'Find My Location'}
        aria-label="Find my location"
      >
        {isLocating ? (
          <span className="locating-spinner" />
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* 3. 3D / 2D Perspective Pitch Toggle */}
      {onTogglePitch && (
        <button
          type="button"
          className={`floating-btn pitch-trigger ${is3D ? 'is-active' : ''}`}
          onClick={onTogglePitch}
          title={
            isAr
              ? is3D
                ? 'التبديل إلى العرض ثنائي الأبعاد (2D)'
                : 'التبديل إلى العرض ثلاثي الأبعاد (3D)'
              : is3D
              ? 'Switch to 2D view'
              : 'Switch to 3D view'
          }
          aria-label="Toggle 3D View"
        >
          <span className="pitch-badge-text">{is3D ? '2D' : '3D'}</span>
        </button>
      )}

      {/* 4. Compass Needle / Reset North */}
      {onResetNorth && (
        <button
          type="button"
          className="floating-btn compass-trigger"
          onClick={onResetNorth}
          title={isAr ? 'إعادة ضبط اتجاه الشمال' : 'Reset North'}
          aria-label="Reset North"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="compass-icon-svg"
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            {/* Compass dial ring */}
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.4" />
            {/* North pointer (pointed tip) */}
            <polygon points="12 3 15 12 12 10" fill="#f43f5e" />
            {/* South pointer */}
            <polygon points="12 21 15 12 12 10" fill="currentColor" opacity="0.75" />
            <polygon points="12 3 9 12 12 10" fill="#e11d48" />
            <polygon points="12 21 9 12 12 10" fill="currentColor" opacity="0.5" />
            {/* Central pivot */}
            <circle cx="12" cy="12" r="1.5" fill="#f8fafc" />
          </svg>
        </button>
      )}

      {/* 5. Fullscreen Toggle */}
      {onToggleFullscreen && (
        <button
          type="button"
          className={`floating-btn fullscreen-trigger ${isFullscreen ? 'is-active' : ''}`}
          onClick={onToggleFullscreen}
          title={
            isAr
              ? isFullscreen
                ? 'إنهاء ملء الشاشة'
                : 'ملء الشاشة'
              : isFullscreen
              ? 'Exit Fullscreen'
              : 'Fullscreen'
          }
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

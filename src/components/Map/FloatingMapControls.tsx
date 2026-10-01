import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './FloatingMapControls.css';

export interface FloatingMapControlsProps {
  onFindMyLocation: () => void;
  onOpenMapOptions: () => void;
  isLocating?: boolean;
}

export const FloatingMapControls: React.FC<FloatingMapControlsProps> = ({
  onFindMyLocation,
  onOpenMapOptions,
  isLocating = false,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  return (
    <div className="floating-map-controls" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Map Options Button */}
      <button
        type="button"
        className="floating-btn map-options-trigger"
        onClick={onOpenMapOptions}
        title={isAr ? 'خيارات الخريطة' : 'Map options'}
        aria-label="Map options"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>

      {/* Find My Location Button */}
      <button
        type="button"
        className={`floating-btn find-location-trigger ${isLocating ? 'is-locating' : ''}`}
        onClick={onFindMyLocation}
        disabled={isLocating}
        title={isAr ? 'تحديد موقعي' : 'Find my location'}
        aria-label="Find my location"
      >
        {isLocating ? (
          <span className="locating-spinner" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
};

import React from 'react';
import { BasemapStyle } from '../../utils/routeColors';
import { useI18n } from '../../i18n/I18nContext';
import './MapOptionsDrawer.css';

export interface MapOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBasemap: BasemapStyle;
  onSelectBasemap: (style: BasemapStyle) => void;
  trafficIncidents: boolean;
  onToggleIncidents: () => void;
  trafficFlow: boolean;
  onToggleFlow: () => void;
  isEVVisible: boolean;
  onToggleEV: () => void;
  onFindMyLocation?: () => void;
  selectedPOIs: string[];
  onTogglePOI: (id: string) => void;
}

interface StyleOption {
  id: BasemapStyle;
  label: string;
  icon: string;
  previewBg: string;
  accentColor: string;
}

export const MapOptionsDrawer: React.FC<MapOptionsDrawerProps> = ({
  isOpen,
  onClose,
  currentBasemap,
  onSelectBasemap,
  trafficIncidents,
  onToggleIncidents,
  trafficFlow,
  onToggleFlow,
  isEVVisible,
  onToggleEV,
  onFindMyLocation,
  selectedPOIs,
  onTogglePOI,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const mapStyles: StyleOption[] = [
    {
      id: 'standardLight',
      label: isAr ? 'قياسي' : 'Standard',
      icon: '🗺️',
      previewBg: '#e2e8f0',
      accentColor: '#FF9E20',
    },
    {
      id: 'monoLight',
      label: isAr ? 'فاتح' : 'Light',
      icon: '🏙️',
      previewBg: '#f8fafc',
      accentColor: '#94a3b8',
    },
    {
      id: 'standardDark',
      label: isAr ? 'داكن' : 'Dark',
      icon: '🌃',
      previewBg: '#1D2128',
      accentColor: '#FF9E20',
    },
    {
      id: 'satellite',
      label: isAr ? 'قمر صناعي' : 'Satellite',
      icon: '🛰️',
      previewBg: '#15202b',
      accentColor: '#215E61',
    },
  ];

  const poiCategories = [
    { id: 'food', label: isAr ? 'مطاعم ومقاهي' : 'Food & Drink', icon: '🍽️' },
    { id: 'ev', label: isAr ? 'محطات شحن كهرباء' : 'EV Charging', icon: '⚡' },
    { id: 'shopping', label: isAr ? 'تسوق ومتاجر' : 'Shopping', icon: '🛍️' },
    { id: 'transport', label: isAr ? 'مواصلات ونقل' : 'Transportation', icon: '🚆' },
    { id: 'health', label: isAr ? 'صحة ومستشفيات' : 'Health', icon: '🏥' },
    { id: 'parking', label: isAr ? 'مواقف سيارات' : 'Parking', icon: '🅿️' },
    { id: 'tourism', label: isAr ? 'سياحة وترفيه' : 'Holiday & tourism', icon: '🏖️' },
  ];

  const allSelected = poiCategories.every((p) =>
    p.id === 'ev' ? isEVVisible : selectedPOIs.includes(p.id)
  );

  const handleSelectAllPOIs = () => {
    if (allSelected) {
      if (isEVVisible) onToggleEV();
      poiCategories.forEach((p) => {
        if (p.id !== 'ev' && selectedPOIs.includes(p.id)) {
          onTogglePOI(p.id);
        }
      });
    } else {
      if (!isEVVisible) onToggleEV();
      poiCategories.forEach((p) => {
        if (p.id !== 'ev' && !selectedPOIs.includes(p.id)) {
          onTogglePOI(p.id);
        }
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="map-options-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        className="map-options-drawer"
        role="dialog"
        aria-label="Map Options"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <header className="map-options-header">
          <div className="map-options-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <h2>{isAr ? 'خيارات الخريطة' : 'Map options'}</h2>
          </div>
          <button
            type="button"
            className="map-options-close-btn"
            onClick={onClose}
            aria-label="Close Map Options"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            ✕
          </button>
        </header>

        <div className="map-options-content">
          {/* Quick My Location Action */}
          {onFindMyLocation && (
            <button
              type="button"
              className="drawer-location-btn"
              onClick={() => {
                onFindMyLocation();
                onClose();
              }}
              title={isAr ? 'تحديد موقعي الحالي على الخريطة' : 'Find my current location'}
            >
              <span className="drawer-btn-icon">🎯</span>
              <span>{isAr ? 'تحديد موقعي الآن' : 'Find my location'}</span>
            </button>
          )}

          {/* SECTION 1: MAP STYLES */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">{isAr ? 'أنماط الخريطة' : 'MAP STYLES'}</h3>
            <div className="map-styles-grid">
              {mapStyles.map((style) => {
                const isActive = currentBasemap === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    className={`style-compact-btn ${isActive ? 'is-selected' : ''}`}
                    onClick={() => onSelectBasemap(style.id)}
                    title={style.label}
                  >
                    <span className="style-compact-icon" aria-hidden="true">{style.icon}</span>
                    <span className="style-compact-label">{style.label}</span>
                    {isActive && <span className="style-compact-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: TRAFFIC */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">{isAr ? 'حركة المرور' : 'TRAFFIC'}</h3>
            <div className="drawer-checkbox-group">
              <label className="drawer-checkbox-item">
                <input
                  type="checkbox"
                  checked={trafficIncidents}
                  onChange={onToggleIncidents}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label">
                  <span className="checkbox-icon">⚠️</span>
                  {isAr ? 'حوادث المرور' : 'Traffic incidents'}
                </span>
              </label>

              <label className="drawer-checkbox-item">
                <input
                  type="checkbox"
                  checked={trafficFlow}
                  onChange={onToggleFlow}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label">
                  <span className="checkbox-icon">🚦</span>
                  {isAr ? 'تدفق حركة المرور' : 'Traffic flow'}
                </span>
              </label>
            </div>
          </section>

          {/* SECTION 3: POIS */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">{isAr ? 'نقاط الاهتمام' : 'POIS'}</h3>
            <div className="drawer-checkbox-group">
              <label className="drawer-checkbox-item select-all-row">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllPOIs}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label font-bold">
                  {isAr ? 'تحديد الكل' : 'Select All'}
                </span>
              </label>

              {poiCategories.map((poi) => {
                const isChecked = poi.id === 'ev' ? isEVVisible : selectedPOIs.includes(poi.id);
                return (
                  <label key={poi.id} className="drawer-checkbox-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (poi.id === 'ev') {
                          onToggleEV();
                        } else {
                          onTogglePOI(poi.id);
                        }
                      }}
                    />
                    <span className="checkbox-custom" />
                    <span className="checkbox-label">
                      <span className="checkbox-icon">{poi.icon}</span>
                      {poi.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './EVStationsToggle.css';

interface EVStationsToggleProps {
  isVisible: boolean;
  isLoading: boolean;
  onToggle: () => void;
  stationsCount?: number;
}

export const EVStationsToggle: React.FC<EVStationsToggleProps> = ({
  isVisible,
  isLoading,
  onToggle,
  stationsCount,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  return (
    <button
      type="button"
      className={`ev-toggle-btn ${isVisible ? 'is-active' : ''}`}
      onClick={onToggle}
      title={isAr ? 'محطات شحن السيارات الكهربائية على المسار' : 'EV Charging Stations on Route'}
      aria-label="Toggle EV Charging Stations"
      aria-pressed={isVisible}
    >
      <div className="ev-toggle-icon">
        {isLoading ? (
          <span className="ev-toggle-spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        )}
      </div>

      <span className="ev-toggle-label">
        {isAr ? 'محطات الشحن (EV)' : 'EV Chargers'}
      </span>

      {isVisible && stationsCount !== undefined && stationsCount > 0 && (
        <span className="ev-toggle-badge">{stationsCount}</span>
      )}
    </button>
  );
};

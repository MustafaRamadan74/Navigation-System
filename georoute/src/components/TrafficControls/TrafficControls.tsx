import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { EVStationsToggle } from './EVStationsToggle';
import './TrafficControls.css';

export interface TrafficControlsProps {
  isVisible: boolean;
  onToggle: () => void;
  showEVToggle?: boolean;
  isEVVisible?: boolean;
  isLoadingEV?: boolean;
  evStationsCount?: number;
  onToggleEV?: () => void;
}

export const TrafficControls: React.FC<TrafficControlsProps> = ({
  isVisible,
  onToggle,
  showEVToggle = false,
  isEVVisible = false,
  isLoadingEV = false,
  evStationsCount = 0,
  onToggleEV,
}) => {
  const { t } = useI18n();
  const [showLegend, setShowLegend] = useState<boolean>(false);

  return (
    <div className="traffic-controls-wrapper">
      <div className="controls-buttons-row">
        {showEVToggle && onToggleEV && (
          <EVStationsToggle
            isVisible={isEVVisible}
            isLoading={isLoadingEV}
            stationsCount={evStationsCount}
            onToggle={onToggleEV}
          />
        )}

        <button
          type="button"
          className={`traffic-toggle-btn ${isVisible ? 'is-active' : ''}`}
          onClick={onToggle}
          onMouseEnter={() => setShowLegend(true)}
          onMouseLeave={() => setShowLegend(false)}
          aria-label={t('trafficToggle')}
          title={t('trafficToggle')}
        >
          <span className="traffic-indicator-dot" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>
            {t('trafficToggle')}: {isVisible ? t('trafficOn') : t('trafficOff')}
          </span>
        </button>
      </div>

      {isVisible && showLegend && (
        <div className="traffic-legend-card" role="tooltip">
          <div className="traffic-legend-title">{t('trafficFlowLegend')}</div>
          <div className="traffic-legend-item">
            <span className="traffic-legend-bar flow-fast" />
            <span>{t('flowFast')}</span>
          </div>
          <div className="traffic-legend-item">
            <span className="traffic-legend-bar flow-moderate" />
            <span>{t('flowModerate')}</span>
          </div>
          <div className="traffic-legend-item">
            <span className="traffic-legend-bar flow-slow" />
            <span>{t('flowSlow')}</span>
          </div>
          <div className="traffic-legend-item">
            <span className="traffic-legend-bar flow-blocked" />
            <span>{t('flowBlocked')}</span>
          </div>
          <div className="traffic-legend-incident">
            <span className="traffic-incident-badge">⚠️</span>
            <span>{t('liveIncidents')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

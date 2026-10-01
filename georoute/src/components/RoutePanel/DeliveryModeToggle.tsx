import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import './DeliveryModeToggle.css';

interface DeliveryModeToggleProps {
  waypointsCount: number;
  isOptimizing: boolean;
  onOptimize: () => void;
  isVisible?: boolean;
}

export const DeliveryModeToggle: React.FC<DeliveryModeToggleProps> = ({
  waypointsCount,
  isOptimizing,
  onOptimize,
  isVisible = true,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  if (!isVisible || waypointsCount < 2) {
    return null;
  }

  return (
    <button
      type="button"
      className={`delivery-optimize-btn ${isOptimizing ? 'is-loading' : ''}`}
      onClick={onOptimize}
      disabled={isOptimizing}
      title={isAr ? 'ترتيب محطات التوصيل بأسرع تسلسل ممكن' : 'Optimize delivery stops sequence'}
      aria-label="Optimize delivery route stops"
    >
      <div className="delivery-btn-icon">
        {isOptimizing ? (
          <span className="delivery-btn-spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        )}
      </div>
      <span className="delivery-btn-label">
        {isOptimizing
          ? (isAr ? 'جارِ ترتيب المحطات...' : 'Optimizing stops...')
          : (isAr ? '⚡ ترتيب محطات التوصيل تلقائياً' : '⚡ Optimize Delivery Stops')}
      </span>
      <span className="delivery-btn-badge">{waypointsCount}</span>
    </button>
  );
};

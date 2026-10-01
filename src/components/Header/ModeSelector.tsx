import React from 'react';
import { AppMode } from '../../hooks/useAppMode';
import { useI18n } from '../../i18n/I18nContext';
import './ModeSelector.css';

interface ModeSelectorProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  const modes: Array<{
    id: AppMode;
    labelAr: string;
    labelEn: string;
    icon: string;
  }> = [
    {
      id: 'general',
      labelAr: 'تنقل عام',
      labelEn: 'General',
      icon: '🧭',
    },
    {
      id: 'delivery',
      labelAr: 'توصيل',
      labelEn: 'Delivery',
      icon: '📦',
    },
    {
      id: 'evTrip',
      labelAr: 'شحن EV',
      labelEn: 'EV Trip',
      icon: '⚡',
    },
    {
      id: 'planner',
      labelAr: 'مخطط الوقت',
      labelEn: 'Planner',
      icon: '⏱️',
    },
  ];

  return (
    <nav className="mode-selector-nav" aria-label="Application Usage Mode">
      <div className="mode-selector-track" role="tablist">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mode-selector-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectMode(m.id)}
            >
              <span className="mode-btn-icon">{m.icon}</span>
              <span className="mode-btn-label">
                {isAr ? m.labelAr : m.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

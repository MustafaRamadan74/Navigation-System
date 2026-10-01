import React from 'react';
import { TravelMode } from '../../types/route';
import { useI18n } from '../../i18n/I18nContext';
import './TravelModeSelector.css';

interface TravelModeSelectorProps {
  currentMode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
}

export const TravelModeSelector: React.FC<TravelModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { t } = useI18n();

  const modes: Array<{
    id: TravelMode;
    label: string;
    icon: string;
  }> = [
    {
      id: 'car',
      label: t('modeCar'),
      icon: '🚗',
    },
    {
      id: 'motorcycle',
      label: t('modeMotorcycle'),
      icon: '🏍️',
    },
    {
      id: 'pedestrian',
      label: t('modePedestrian'),
      icon: '🚶',
    },
  ];

  return (
    <div className="travel-mode-selector" role="radiogroup" aria-label="Travel Mode">
      {modes.map((m) => {
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`travel-mode-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectMode(m.id)}
            title={m.label}
          >
            <span className="travel-mode-icon">{m.icon}</span>
            <span className="travel-mode-label">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';
import { RouteInstruction } from '../../types/route';
import { getManeuverIcon } from '../../utils/maneuvers';
import { formatDistance } from '../../utils/formatters';
import { useI18n } from '../../i18n/I18nContext';
import './ActiveInstruction.css';

interface ActiveInstructionProps {
  instruction: RouteInstruction | null;
  nextInstruction?: RouteInstruction | null;
  distanceToStepMeters: number;
  speedMps?: number | null;
  isSimulating?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onExit: () => void;
  unit?: 'km' | 'mi';
}

export const ActiveInstruction: React.FC<ActiveInstructionProps> = ({
  instruction,
  nextInstruction,
  distanceToStepMeters,
  speedMps,
  isSimulating = false,
  isMuted = false,
  onToggleMute,
  onExit,
  unit = 'km',
}) => {
  const { t, language } = useI18n();

  const kmh = speedMps !== null && speedMps !== undefined ? Math.round(speedMps * 3.6) : null;
  const isAr = language === 'ar';

  if (!instruction) {
    return (
      <div className="active-instruction-hud">
        <div className="active-instruction-content">
          <div className="active-instruction-main">
            <span className="active-instruction-dist">--</span>
            <span className="active-instruction-msg">{t('navigating')}</span>
          </div>
          <button type="button" className="active-nav-exit-btn" onClick={onExit}>
            {t('exitDriving')}
          </button>
        </div>
      </div>
    );
  }

  const maneuverIcon = getManeuverIcon(instruction.maneuver);

  return (
    <aside className="active-instruction-hud" aria-label="Turn-by-turn live navigation guidance">
      <div className="active-instruction-header">
        <div className="active-instruction-indicator">
          <span className="live-indicator-dot pulse" />
          <span className="live-indicator-label">
            {isSimulating ? (isAr ? 'محاكاة القيادة' : 'Simulation Mode') : t('navigating')}
          </span>
        </div>

        <div className="active-instruction-controls">
          {onToggleMute && (
            <button
              type="button"
              className={`active-nav-icon-btn ${isMuted ? 'is-muted' : ''}`}
              onClick={onToggleMute}
              title={isMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
              aria-label={isMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            className="active-nav-exit-btn"
            onClick={onExit}
            aria-label="Exit live navigation mode"
          >
            {t('exitDriving')}
          </button>
        </div>
      </div>

      <div className="active-instruction-body">
        <div className="active-maneuver-icon-box">
          <span className="active-maneuver-icon">{maneuverIcon}</span>
        </div>

        <div className="active-instruction-details">
          <div className="active-instruction-dist-row">
            <span className="active-instruction-in-label">
              {isAr ? 'بعد' : 'In'}
            </span>
            <span className="active-instruction-dist">
              {formatDistance(distanceToStepMeters, unit)}
            </span>
          </div>

          <div className="active-instruction-message">
            {instruction.message}
          </div>

          {nextInstruction && (
            <div className="active-next-preview">
              <span className="active-next-tag">{isAr ? 'ثم:' : 'Then:'}</span>
              <span className="active-next-icon">{getManeuverIcon(nextInstruction.maneuver)}</span>
              <span className="active-next-text">{nextInstruction.message}</span>
            </div>
          )}
        </div>

        {kmh !== null && kmh > 0 && (
          <div className="active-speed-gauge">
            <span className="speed-val">{kmh}</span>
            <span className="speed-unit">km/h</span>
          </div>
        )}
      </div>
    </aside>
  );
};

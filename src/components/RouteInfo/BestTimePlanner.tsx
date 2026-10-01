import React, { useState } from 'react';
import { TimeSlotOption, compareDepartureTimes } from '../../services/routing/compareDepartureTimes';
import { formatDuration } from '../../utils/formatters';
import { useI18n } from '../../i18n/I18nContext';
import { TravelMode } from '../../types/route';
import './BestTimePlanner.css';

interface BestTimePlannerProps {
  locations: [number, number][];
  currentTravelTimeSeconds: number;
  travelMode?: TravelMode;
}

export const BestTimePlanner: React.FC<BestTimePlannerProps> = ({
  locations,
  currentTravelTimeSeconds,
  travelMode = 'car',
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [slots, setSlots] = useState<TimeSlotOption[] | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleAnalyze = async () => {
    if (locations.length < 2) return;
    setIsLoading(true);
    setIsOpen(true);
    try {
      const res = await compareDepartureTimes(locations, currentTravelTimeSeconds, isAr, travelMode);
      setSlots(res.slots);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="best-time-planner-container">
      <button
        type="button"
        className="best-time-trigger-btn"
        onClick={handleAnalyze}
        disabled={isLoading || locations.length < 2}
      >
        <span className="best-time-icon">⏱️</span>
        <span className="best-time-label">
          {isLoading
            ? (isAr ? 'جارِ فحص فترات المرور...' : 'Analyzing traffic windows...')
            : (isAr ? 'مخطط أفضل وقت للانطلاق' : 'Find Best Time to Leave')}
        </span>
        {isLoading && <span className="best-time-spinner" />}
      </button>

      {isOpen && slots && (
        <div className="best-time-results-card">
          <div className="best-time-card-header">
            <div>
              <h4 className="best-time-card-title">
                {isAr ? 'مقارنة أوقات السفر المتوقعة' : 'Expected Departure Travel Times'}
              </h4>
              <p className="best-time-card-sub">
                {isAr
                  ? `الوقت الحالي الآن: ${formatDuration(currentTravelTimeSeconds)}`
                  : `Current travel time now: ${formatDuration(currentTravelTimeSeconds)}`}
              </p>
            </div>
            <button
              type="button"
              className="best-time-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="best-time-slots-list">
            {slots.map((slot) => {
              const savesTime = slot.diffMinutesFromNow < 0;
              const losesTime = slot.diffMinutesFromNow > 0;
              const absDiff = Math.abs(slot.diffMinutesFromNow);

              let badgeText = isAr ? 'نفس الوقت' : 'Same time';
              let badgeClass = 'badge-neutral';

              if (savesTime) {
                badgeText = isAr ? `أوفر بـ ${absDiff} دقيقة` : `Saves ${absDiff} min`;
                badgeClass = 'badge-save';
              } else if (losesTime) {
                badgeText = isAr ? `أبطأ بـ ${absDiff} دقيقة` : `+${absDiff} min slower`;
                badgeClass = 'badge-slower';
              }

              return (
                <div
                  key={slot.id}
                  className={`best-time-slot-row ${slot.isBest ? 'is-recommended' : ''}`}
                >
                  <div className="slot-info">
                    <div className="slot-name-row">
                      <span className="slot-name">
                        {isAr ? slot.nameAr : slot.nameEn}
                      </span>
                      <span className="slot-time-tag">{slot.timeLabel}</span>
                      {slot.isBest && (
                        <span className="best-choice-chip">
                          ★ {isAr ? 'الأسرع' : 'Fastest'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="slot-metrics">
                    <span className="slot-duration">
                      {formatDuration(slot.durationSeconds)}
                    </span>
                    <span className={`slot-diff-badge ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

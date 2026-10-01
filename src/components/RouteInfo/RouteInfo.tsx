import React, { useState } from 'react';
import { RouteOption, TravelMode } from '../../types/route';
import { LocationPoint } from '../../types/location';
import { formatDistance, formatDuration, formatArrivalTime } from '../../utils/formatters';
import { getManeuverIcon } from '../../utils/maneuvers';
import { getRouteColorStyle } from '../../utils/routeColors';
import { generateShareableRouteUrl } from '../../utils/gisExport';
import { BestTimePlanner } from './BestTimePlanner';
import { AppMode } from '../../hooks/useAppMode';
import { useI18n } from '../../i18n/I18nContext';
import './RouteInfo.css';

export interface RouteInfoProps {
  routes: RouteOption[];
  selectedRouteIndex: number;
  isLoading: boolean;
  errorMessage: string | null;
  distanceUnit?: 'km' | 'mi';
  startPoint?: LocationPoint | null;
  destinationPoint?: LocationPoint | null;
  waypoints?: LocationPoint[];
  appMode?: AppMode;
  travelMode?: TravelMode;
  onSelectRoute: (index: number) => void;
  onSelectStep?: (coordinates: [number, number]) => void;
  onRetry?: () => void;
  onStartDriving?: () => void;
  onStartSimulation?: () => void;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
  routes,
  selectedRouteIndex,
  isLoading,
  errorMessage,
  distanceUnit = 'km',
  startPoint,
  destinationPoint,
  waypoints = [],
  appMode = 'general',
  travelMode = 'car',
  onSelectRoute,
  onSelectStep,
  onRetry,
  onStartDriving,
  onStartSimulation,
}) => {
  const { t, language } = useI18n();
  const isAr = language === 'ar';
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="route-info-card" aria-live="polite" aria-busy="true">
        <div className="route-info-loading">
          <div className="route-info-spinner" />
          <span>{t('searchingLocations')}</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="route-info-card" role="alert">
        <div className="route-info-error">
          <div className="route-info-error-header">
            <span>⚠️</span>
            <span>{t('routeUnavailable')}</span>
          </div>
          <div>{errorMessage}</div>
          {onRetry && (
            <button type="button" className="route-info-retry-btn" onClick={onRetry}>
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return null;
  }

  const activeRoute = routes[selectedRouteIndex] || routes[0];
  const fastestRoute = routes[0];
  const hasMultipleRoutes = routes.length > 1;

  const hasTrafficDelay = activeRoute.summary.trafficDelayInSeconds > 60;
  const etaFormatted = formatDuration(activeRoute.summary.travelTimeInSeconds);
  const distanceFormatted = formatDistance(activeRoute.summary.lengthInMeters, distanceUnit);
  const arrivalFormatted = formatArrivalTime(
    activeRoute.summary.arrivalTime,
    activeRoute.summary.travelTimeInSeconds
  );

  const handleShare = async () => {
    if (!startPoint || !destinationPoint) return;
    const url = generateShareableRouteUrl(startPoint, destinationPoint, waypoints);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      window.prompt('Copy route link:', url);
    }
  };

  // Compile all route coordinates for BestTimePlanner
  const allLocations: [number, number][] = [
    ...(startPoint ? [startPoint.coordinates] : []),
    ...waypoints
      .filter((wp) => wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0)
      .map((wp) => wp.coordinates),
    ...(destinationPoint ? [destinationPoint.coordinates] : []),
  ];

  return (
    <div className="route-info-container">
      {/* Alternative Routes Comparison Pills */}
      {hasMultipleRoutes && (
        <div className="route-alternatives-list" role="tablist" aria-label="Alternative Routes">
          {routes.map((rt, idx) => {
            const isSelected = idx === selectedRouteIndex;
            const diffSeconds = rt.summary.travelTimeInSeconds - fastestRoute.summary.travelTimeInSeconds;
            const diffMins = Math.max(0, diffSeconds / 60);
            const diffMinsRounded = Math.round(diffMins);
            const colorStyle = getRouteColorStyle(diffMins, isSelected, idx);

            let diffLabel = idx === 0 ? t('fastestRoute') : diffMinsRounded > 0 ? `+${diffMinsRounded} min` : 'Same time';
            if (idx === 0 && diffMinsRounded === 0) diffLabel = t('fastestRoute');

            return (
              <button
                key={rt.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`route-alt-card ${isSelected ? 'is-active' : ''}`}
                style={!isSelected ? { borderColor: `${colorStyle.badgeBorder}55` } : undefined}
                onClick={() => onSelectRoute(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: colorStyle.coreColor,
                      display: 'inline-block',
                    }}
                  />
                  <span className="route-alt-tag">{t('alternativeRoute')} {idx + 1}</span>
                </div>
                <span className="route-alt-time">{formatDuration(rt.summary.travelTimeInSeconds)}</span>
                <span className="route-alt-diff">{diffLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Route Details Card */}
      <div className="route-info-card" aria-label="Active Route Information">
        <div className="route-info-header">
          <div className="route-info-badge">
            <span className="route-info-badge-dot" />
            <span>
              {selectedRouteIndex === 0
                ? t('fastestRoute')
                : `${t('alternativeRoute')} ${selectedRouteIndex + 1}`}
            </span>
          </div>
        </div>

        <div className="route-info-stats">
          <div className="route-info-eta">{etaFormatted}</div>
          <div className="route-info-distance">({distanceFormatted})</div>
        </div>

        <div className="route-info-meta">
          <div className="route-info-arrival">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{t('arrival')}: {arrivalFormatted}</span>
          </div>

          {hasTrafficDelay ? (
            <div className="route-info-traffic-tag has-delay">
              <span>⚠️</span>
              <span>+{formatDuration(activeRoute.summary.trafficDelayInSeconds)} {t('trafficDelay')}</span>
            </div>
          ) : (
            <div className="route-info-traffic-tag smooth-traffic">
              <span>✓</span>
              <span>{t('usualTraffic')}</span>
            </div>
          )}
        </div>

        {/* Start Live Driving & Simulation Navigation Actions (Phase 11) */}
        {onStartDriving && (
          <div className="nav-actions-group">
            <button
              type="button"
              className="start-nav-btn"
              onClick={onStartDriving}
              title={isAr ? 'بدء الملاحة الحية خطوة بخطوة' : 'Start live turn-by-turn navigation'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>{isAr ? 'بدء القيادة والملاحة' : 'Start Navigation'}</span>
            </button>

            {onStartSimulation && (
              <button
                type="button"
                className="sim-nav-btn"
                onClick={onStartSimulation}
                title={isAr ? 'محاكاة القيادة لاختبار الملاحة' : 'Simulate drive along route'}
              >
                <span>▶️</span>
                <span>{isAr ? 'محاكاة' : 'Simulate'}</span>
              </button>
            )}
          </div>
        )}

        {/* Share Route Link */}
        {startPoint && destinationPoint && (
          <div className="route-gis-actions">
            <button
              type="button"
              className={`gis-action-btn share-btn ${copiedLink ? 'is-copied' : ''}`}
              onClick={handleShare}
              title="Copy shareable link to this route"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copiedLink ? t('copied') : t('share')}</span>
            </button>
          </div>
        )}

        {/* Phase 16: Best Time to Leave Planner (Rendered in planner mode or expandable) */}
        {(appMode === 'planner' || appMode === 'general') && allLocations.length >= 2 && (
          <BestTimePlanner
            locations={allLocations}
            currentTravelTimeSeconds={activeRoute.summary.travelTimeInSeconds}
            travelMode={travelMode}
          />
        )}

        {/* Turn-by-Turn Navigation Instructions */}
        {activeRoute.instructions && activeRoute.instructions.length > 0 && (
          <div>
            <button
              type="button"
              className="directions-toggle-btn"
              onClick={() => setShowDirections((prev) => !prev)}
              aria-expanded={showDirections}
            >
              <span>{t('turnByTurn')} ({activeRoute.instructions.length} {t('stepsCount')})</span>
              <span className={`directions-chevron ${showDirections ? 'is-open' : ''}`}>▼</span>
            </button>

            {showDirections && (
              <div className="directions-list" role="list">
                {activeRoute.instructions.map((step) => (
                  <div
                    key={step.id}
                    className="directions-step-item"
                    role="listitem"
                    onClick={() => onSelectStep?.(step.coordinates)}
                    title="Click to view this step on the map"
                  >
                    <div className="directions-step-icon">
                      {getManeuverIcon(step.maneuver)}
                    </div>
                    <div className="directions-step-content">
                      <span className="directions-step-message">{step.message}</span>
                      {step.distanceInMeters > 0 && (
                        <span className="directions-step-distance">
                          In {formatDistance(step.distanceInMeters, distanceUnit)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { LocationPoint } from '../../types/location';
import { RouteOption, TravelMode } from '../../types/route';
import { SavedPlace, RecentRoute, UserPreferences, PlaceCategory } from '../../types/storage';
import { useI18n } from '../../i18n/I18nContext';
import { SearchBox } from '../SearchBox/SearchBox';
import { RouteInfo } from '../RouteInfo/RouteInfo';
import { SavedPlacesTab } from '../SavedPlaces/SavedPlacesTab';
import { ModeSelector } from '../Header/ModeSelector';
import { TravelModeSelector } from '../Header/TravelModeSelector';
import { DeliveryModeToggle } from './DeliveryModeToggle';
import { EVStationsToggle } from '../TrafficControls/EVStationsToggle';
import { AppMode } from '../../hooks/useAppMode';
import { BasemapStyle } from '../../utils/routeColors';
import './RoutePanel.css';

export interface RoutePanelProps {
  startPoint: LocationPoint | null;
  destinationPoint: LocationPoint | null;
  waypoints: LocationPoint[];
  centerBias?: [number, number];
  isLocating: boolean;
  geolocationError: string | null;
  validationError: string | null;
  routes: RouteOption[];
  selectedRouteIndex: number;
  isRouting: boolean;
  routingError: string | null;
  savedPlaces: SavedPlace[];
  recentRoutes: RecentRoute[];
  preferences: UserPreferences;
  theme: 'dark' | 'light';
  appMode: AppMode;
  basemapStyle: BasemapStyle;
  travelMode: TravelMode;
  onSelectTravelMode: (mode: TravelMode) => void;
  onOpenMapOptions?: () => void;
  isOptimizingDelivery: boolean;
  isEVVisible?: boolean;
  isLoadingEV?: boolean;
  evStationsCount?: number;
  onToggleEV?: () => void;
  onToggleTheme: () => void;
  onSelectMode: (mode: AppMode) => void;
  onSelectBasemap: (basemap: BasemapStyle) => void;
  onOptimizeDelivery: () => void;
  onStartDriving: () => void;
  onStartSimulation: () => void;
  onSelectStart: (location: LocationPoint) => void;
  onSelectDestination: (location: LocationPoint) => void;
  onClearStart: () => void;
  onClearDestination: () => void;
  onAddWaypoint: () => void;
  onUpdateWaypoint: (index: number, location: LocationPoint) => void;
  onRemoveWaypoint: (index: number) => void;
  onSwapPoints: () => void;
  onUseMyLocation: () => void;
  onDismissGeoError: () => void;
  onDismissValidationError: () => void;
  onSelectRoute: (index: number) => void;
  onSelectStep?: (coordinates: [number, number]) => void;
  onRetryRouting?: () => void;
  onSelectRecentRoute: (route: RecentRoute) => void;
  onSavePlace: (label: string, category: PlaceCategory, location: LocationPoint) => void;
  onUpdatePlace: (id: string, label: string) => void;
  onDeletePlace: (id: string) => void;
  onClearRecentRoutes: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  startPoint,
  destinationPoint,
  waypoints,
  centerBias,
  isLocating,
  geolocationError,
  validationError,
  routes,
  selectedRouteIndex,
  isRouting,
  routingError,
  savedPlaces,
  recentRoutes,
  preferences,
  theme,
  appMode,
  basemapStyle: _basemapStyle,
  travelMode,
  onSelectTravelMode,
  onOpenMapOptions,
  isOptimizingDelivery,
  isEVVisible = false,
  isLoadingEV = false,
  evStationsCount = 0,
  onToggleEV,
  onToggleTheme,
  onSelectMode,
  onSelectBasemap: _onSelectBasemap,
  onOptimizeDelivery,
  onStartDriving,
  onStartSimulation,
  onSelectStart,
  onSelectDestination,
  onClearStart,
  onClearDestination,
  onAddWaypoint,
  onUpdateWaypoint,
  onRemoveWaypoint,
  onSwapPoints,
  onUseMyLocation,
  onDismissGeoError,
  onDismissValidationError,
  onSelectRoute,
  onSelectStep,
  onRetryRouting,
  onSelectRecentRoute,
  onSavePlace,
  onUpdatePlace,
  onDeletePlace,
  onClearRecentRoutes,
  onUpdatePreferences,
}) => {
  const { t, language, setLanguage } = useI18n();
  const [activeTab, setActiveTab] = useState<'directions' | 'saved'>('directions');
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(false);
  const canAddMoreStops = waypoints.length < 5;

  const homePlace = savedPlaces.find((p) => p.category === 'home');
  const workPlace = savedPlaces.find((p) => p.category === 'work');

  const handleSelectRecentRouteWithTabSwitch = (route: RecentRoute) => {
    onSelectRecentRoute(route);
    setActiveTab('directions');
  };

  const handleSelectPlaceAsDestinationWithTabSwitch = (loc: LocationPoint) => {
    onSelectDestination(loc);
    setActiveTab('directions');
  };

  const handleSelectPlaceAsStartWithTabSwitch = (loc: LocationPoint) => {
    onSelectStart(loc);
    setActiveTab('directions');
  };

  return (
    <aside
      className={`route-panel-card ${isMobileCollapsed ? 'is-collapsed' : ''}`}
      aria-label="Route Planning Panel"
    >
      {/* Mobile drag handle */}
      <div
        className="bottom-sheet-handle"
        onClick={() => setIsMobileCollapsed((prev) => !prev)}
        title="Toggle panel"
        aria-label="Toggle panel height"
      />

      <header className="route-panel-header">
        <div className="route-panel-brand">
          {/* Hamburger Menu button to open Map Options Drawer */}
          {onOpenMapOptions && (
            <button
              type="button"
              className="panel-tool-btn menu-btn"
              onClick={onOpenMapOptions}
              title={language === 'ar' ? 'القائمة وخيارات الخريطة' : 'Menu & Map Options'}
              aria-label="Menu"
            >
              ☰
            </button>
          )}

          <svg
            className="route-panel-logo"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span className="route-panel-title">{t('appName')}</span>
        </div>

        <div className="route-panel-header-actions">
          {/* Map Options Button */}
          {onOpenMapOptions && (
            <button
              type="button"
              className="panel-tool-btn"
              onClick={onOpenMapOptions}
              title={language === 'ar' ? 'خيارات الخريطة والطبقات' : 'Map Options & Layers'}
              aria-label="Map options"
            >
              🗺️
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="panel-tool-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Language Toggle Button */}
          <button
            type="button"
            className="panel-tool-btn lang-btn"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            title="Switch Language / تغيير اللغة"
            aria-label="Toggle language between Arabic and English"
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
      </header>

      {/* Primary Section Switcher: Directions vs Saved Places */}
      <nav className="route-panel-segmented-tabs" aria-label="Panel Navigation">
        <button
          type="button"
          className={`panel-segment-btn ${activeTab === 'directions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('directions')}
          title={t('tabDirections')}
        >
          <span className="segment-icon">🧭</span>
          <span>{t('tabDirections')}</span>
        </button>
        <button
          type="button"
          className={`panel-segment-btn ${activeTab === 'saved' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('saved')}
          title={t('tabSaved')}
        >
          <span className="segment-icon">⭐</span>
          <span>{t('tabSaved')}</span>
          {savedPlaces.length > 0 && <span className="tab-counter">{savedPlaces.length}</span>}
        </button>
      </nav>

      {/* Phase 17: Application Mode Selector */}
      <ModeSelector
        currentMode={appMode}
        onSelectMode={onSelectMode}
      />

      {/* TAB 1: DIRECTIONS */}
      {activeTab === 'directions' && (
        <>
          {/* Travel Mode: Car / Motorcycle / Pedestrian */}
          <TravelModeSelector
            currentMode={travelMode}
            onSelectMode={onSelectTravelMode}
          />

          <div className="route-inputs-container">
            <div className="route-inputs-column">
              {/* Start Point */}
              <SearchBox
                id="start-searchbox"
                placeholder={t('startPlaceholder')}
                type="start"
                value={startPoint ? startPoint.name : ''}
                centerBias={centerBias}
                onSelect={onSelectStart}
                onClear={onClearStart}
              />

              {/* Intermediate Waypoints */}
              {waypoints.map((wp, index) => (
                <div key={`wp-${index}`} className="route-waypoint-row">
                  <SearchBox
                    id={`waypoint-searchbox-${index}`}
                    placeholder={`${t('waypointPlaceholder')} ${index + 1}...`}
                    type="waypoint"
                    waypointIndex={index}
                    value={wp.name}
                    centerBias={centerBias}
                    onSelect={(loc) => onUpdateWaypoint(index, loc)}
                    onClear={() => onRemoveWaypoint(index)}
                  />
                  <button
                    type="button"
                    className="route-remove-stop-btn"
                    onClick={() => onRemoveWaypoint(index)}
                    aria-label={`${t('removeStop')} ${index + 1}`}
                    title={t('removeStop')}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Destination Point */}
              <SearchBox
                id="destination-searchbox"
                placeholder={t('destPlaceholder')}
                type="destination"
                value={destinationPoint ? destinationPoint.name : ''}
                centerBias={centerBias}
                onSelect={onSelectDestination}
                onClear={onClearDestination}
              />
            </div>

            {/* Swap Start & Destination (only when 0 waypoints) */}
            {waypoints.length === 0 && (
              <button
                type="button"
                className="route-swap-btn"
                onClick={onSwapPoints}
                aria-label={t('swapTooltip')}
                title={t('swapTooltip')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="7 10 12 15 17 10" />
                  <polyline points="17 14 12 9 7 14" />
                </svg>
              </button>
            )}
          </div>

          {/* Phase 14: Delivery Mode Automatic Waypoint Optimization Toggle */}
          <DeliveryModeToggle
            waypointsCount={waypoints.length}
            isOptimizing={isOptimizingDelivery}
            onOptimize={onOptimizeDelivery}
            isVisible={appMode === 'delivery' || waypoints.length >= 2}
          />

          {/* Phase 15 & 18: EV Charging Stations Toggle inside Bottom Sheet */}
          {onToggleEV && (appMode === 'evTrip' || isEVVisible) && (
            <div className="sheet-ev-toggle-row">
              <EVStationsToggle
                isVisible={isEVVisible}
                isLoading={isLoadingEV}
                stationsCount={evStationsCount}
                onToggle={onToggleEV}
              />
            </div>
          )}

          {/* Quick Action Bar & Waypoint Addition */}
          <div className="route-actions-bar">
            <button
              type="button"
              className="use-location-btn"
              onClick={onUseMyLocation}
              disabled={isLocating}
              aria-label={t('useMyLocation')}
            >
              {isLocating ? (
                <>
                  <div className="use-location-spinner" />
                  <span>{t('locating')}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                  </svg>
                  <span>{t('useMyLocation')}</span>
                </>
              )}
            </button>

            {canAddMoreStops && (
              <button
                type="button"
                className="add-stop-btn"
                onClick={onAddWaypoint}
                aria-label={t('addStop')}
              >
                <span>{t('addStop')}</span>
              </button>
            )}
          </div>

          {/* Quick Destination Chips */}
          <div className="quick-chips-row">
            {homePlace ? (
              <button
                type="button"
                className="quick-chip-btn is-set"
                onClick={() => onSelectDestination(homePlace.location)}
                title={`${t('home')}: ${homePlace.location.name}`}
              >
                <span>🏠 {t('home')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => setActiveTab('saved')}
                title={t('setHome')}
              >
                <span>🏠 {t('setHome')}</span>
              </button>
            )}

            {workPlace ? (
              <button
                type="button"
                className="quick-chip-btn is-set"
                onClick={() => onSelectDestination(workPlace.location)}
                title={`${t('work')}: ${workPlace.location.name}`}
              >
                <span>🏢 {t('work')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => setActiveTab('saved')}
                title={t('setWork')}
              >
                <span>🏢 {t('setWork')}</span>
              </button>
            )}

            {destinationPoint && (
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => {
                  onSavePlace(destinationPoint.name, 'favorite', destinationPoint);
                }}
                title={t('saveDest')}
              >
                <span>⭐ {t('saveDest')}</span>
              </button>
            )}
          </div>

          {/* Validation or Duplicate Alert */}
          {validationError && (
            <div className="geolocation-error-banner" role="alert">
              <span>⚠️ {validationError}</span>
              <button
                type="button"
                className="geolocation-error-close"
                onClick={onDismissValidationError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Geolocation Error Alert */}
          {geolocationError && (
            <div className="geolocation-error-banner" role="alert">
              <span>⚠️ {geolocationError}</span>
              <button
                type="button"
                className="geolocation-error-close"
                onClick={onDismissGeoError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Route Info & Alternatives */}
          {(isRouting || routingError || routes.length > 0) && (
            <RouteInfo
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              isLoading={isRouting}
              errorMessage={routingError}
              distanceUnit={preferences.distanceUnit}
              startPoint={startPoint}
              destinationPoint={destinationPoint}
              waypoints={waypoints}
              appMode={appMode}
              onSelectRoute={onSelectRoute}
              onSelectStep={onSelectStep}
              onRetry={onRetryRouting}
              onStartDriving={onStartDriving}
              onStartSimulation={onStartSimulation}
            />
          )}
        </>
      )}

      {/* TAB 2: SAVED PLACES & RECENT ROUTES */}
      {activeTab === 'saved' && (
        <SavedPlacesTab
          savedPlaces={savedPlaces}
          recentRoutes={recentRoutes}
          preferences={preferences}
          currentStart={startPoint}
          currentDestination={destinationPoint}
          onBackToDirections={() => setActiveTab('directions')}
          onSelectPlaceAsStart={handleSelectPlaceAsStartWithTabSwitch}
          onSelectPlaceAsDestination={handleSelectPlaceAsDestinationWithTabSwitch}
          onSelectRecentRoute={handleSelectRecentRouteWithTabSwitch}
          onSavePlace={onSavePlace}
          onUpdatePlace={onUpdatePlace}
          onDeletePlace={onDeletePlace}
          onClearRecentRoutes={onClearRecentRoutes}
          onUpdatePreferences={onUpdatePreferences}
        />
      )}
    </aside>
  );
};

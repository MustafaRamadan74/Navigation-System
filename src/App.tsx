import { useState, useEffect, useCallback, useMemo } from 'react';
import { Map } from './components/Map/Map';
import { RoutePanel } from './components/RoutePanel/RoutePanel';
import { TrafficControls } from './components/TrafficControls/TrafficControls';
import { ActiveInstruction } from './components/RouteInfo/ActiveInstruction';
import { EVStationPopup } from './components/Map/EVStationPopup';
import { MapOptionsDrawer } from './components/MapOptions/MapOptionsDrawer';
import { FloatingMapControls } from './components/Map/FloatingMapControls';
import { LocationPoint } from './types/location';
import { RouteOption, TravelMode } from './types/route';
import { SavedPlace, RecentRoute, UserPreferences, PlaceCategory } from './types/storage';
import { getCurrentBrowserPosition } from './services/geolocation/browserLocation';
import { reverseGeocodeLocation } from './services/tomtom/search';
import { calculateRoute } from './services/routing/routeService';
import {
  getSavedPlaces,
  savePlace,
  updatePlace,
  deletePlace,
  getRecentRoutes,
  addRecentRoute,
  clearRecentRoutes,
  getUserPreferences,
  saveUserPreferences,
} from './services/storage/storageService';
import { parseRouteFromUrl } from './utils/gisExport';
import { useI18n } from './i18n/I18nContext';
import { useLiveTracking } from './hooks/useLiveTracking';
import { useAppMode } from './hooks/useAppMode';
import { speechService } from './services/voice/speechService';
import { optimizeWaypoints } from './services/routing/optimizeWaypoints';
import { EVStation, searchEVStationsAlongRoute, fetchAllEgyptEVStations } from './services/tomtom/evStations';
import { BasemapStyle } from './utils/routeColors';
import './App.css';

function isSameCoord(c1: [number, number], c2: [number, number]): boolean {
  return Math.abs(c1[0] - c2[0]) < 0.0001 && Math.abs(c1[1] - c2[1]) < 0.0001;
}

function App() {
  const { language } = useI18n();
  const { mode: appMode, setMode: setAppMode } = useAppMode();

  const [startPoint, setStartPoint] = useState<LocationPoint | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<LocationPoint | null>(null);
  const [waypoints, setWaypoints] = useState<LocationPoint[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>('car');

  // Local storage state
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => getSavedPlaces());
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>(() => getRecentRoutes());
  const [preferences, setPreferences] = useState<UserPreferences>(() => getUserPreferences());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getUserPreferences().theme || 'dark');

  // Basemap style state (Phase 19)
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('georoute_basemap') as BasemapStyle | null;
      if (saved) return saved;
    }
    return 'standardDark';
  });

  const handleSelectBasemap = (style: BasemapStyle) => {
    setBasemapStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('georoute_basemap', style);
    }
  };

  // Synchronize document theme class whenever theme state changes
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    handleUpdatePreferences({ theme: nextTheme });
  };

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [focusedCoordinate, setFocusedCoordinate] = useState<[number, number] | null>(null);

  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [isTrafficVisible, setIsTrafficVisible] = useState<boolean>(() => getUserPreferences().trafficDefault);

  // Delivery Mode state (Phase 14)
  const [isOptimizingDelivery, setIsOptimizingDelivery] = useState<boolean>(false);

  // EV Charging stations state (Phase 15) - Default true so EV stations are always available
  const [isEVVisible, setIsEVVisible] = useState<boolean>(true);
  const [evStations, setEvStations] = useState<EVStation[]>([]);
  const [isLoadingEV, setIsLoadingEV] = useState<boolean>(false);
  const [selectedEVStation, setSelectedEVStation] = useState<EVStation | null>(null);

  // Map Options Drawer & Layers state (TomTom Plan style)
  const [isMapOptionsOpen, setIsMapOptionsOpen] = useState<boolean>(false);
  const [trafficIncidents, setTrafficIncidents] = useState<boolean>(true);
  const [trafficFlow, setTrafficFlow] = useState<boolean>(true);
  const [selectedPOIs, setSelectedPOIs] = useState<string[]>([
    'food',
    'ev',
    'shopping',
    'transport',
    'health',
    'parking',
  ]);

  const handleToggleTrafficIncidents = () => setTrafficIncidents((prev) => !prev);
  const handleToggleTrafficFlow = () => setTrafficFlow((prev) => !prev);
  const handleTogglePOI = (id: string) => {
    setSelectedPOIs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Voice Guidance state (Phase 12)
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => speechService.getIsMuted());

  const handleToggleVoiceMute = () => {
    const next = !isVoiceMuted;
    speechService.setMuted(next);
    setIsVoiceMuted(next);
  };

  const activeRoute = routes[selectedRouteIndex] || routes[0];

  // Coordinates array for active route
  const activeRouteCoords: [number, number][] = useMemo(() => {
    if (activeRoute && activeRoute.geojson && activeRoute.geojson.features.length > 0) {
      return activeRoute.geojson.features[0].geometry.coordinates as [number, number][];
    }
    return [];
  }, [activeRoute]);

  const triggerCalculateRoute = useCallback(
    async (
      start: LocationPoint,
      dest: LocationPoint,
      intermediateWaypoints: LocationPoint[],
      traffic: boolean,
      isArabic: boolean,
      mode: TravelMode = 'car'
    ) => {
      const resolvedWaypoints = intermediateWaypoints.filter(
        (wp) => wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0
      );

      const locations: [number, number][] = [
        start.coordinates,
        ...resolvedWaypoints.map((wp) => wp.coordinates),
        dest.coordinates,
      ];

      setIsRouting(true);
      setRoutingError(null);

      try {
        const fetchedRoutes = await calculateRoute(locations, traffic, isArabic, mode);
        setRoutes(fetchedRoutes);
        setSelectedRouteIndex(0);

        if (fetchedRoutes.length > 0) {
          addRecentRoute(
            start,
            dest,
            resolvedWaypoints,
            fetchedRoutes[0].summary.travelTimeInSeconds,
            fetchedRoutes[0].summary.lengthInMeters
          );
          setRecentRoutes(getRecentRoutes());
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to calculate route.';
        setRoutingError(msg);
        setRoutes([]);
      } finally {
        setIsRouting(false);
      }
    },
    []
  );

  // Restore route from shared URL query string on initial load
  useEffect(() => {
    const shared = parseRouteFromUrl();
    if (shared) {
      setStartPoint(shared.start);
      setDestinationPoint(shared.destination);
      setWaypoints(shared.waypoints);
    }
  }, []);

  // Recalculate route whenever startPoint, destinationPoint, waypoints, traffic, language, or travelMode changes
  useEffect(() => {
    if (startPoint && destinationPoint) {
      triggerCalculateRoute(startPoint, destinationPoint, waypoints, isTrafficVisible, language === 'ar', travelMode);
    } else {
      setRoutes([]);
      setRoutingError(null);
      setIsRouting(false);
    }
  }, [startPoint, destinationPoint, waypoints, isTrafficVisible, language, travelMode, triggerCalculateRoute]);

  // Phase 13: Auto Re-routing deviation handler
  const handleDeviationDetected = useCallback(
    (currentPos: [number, number]) => {
      if (!destinationPoint) return;
      const currentLocPoint: LocationPoint = {
        id: `reroute-${Date.now()}`,
        name: language === 'ar' ? 'موقعي الحالي' : 'Current Location',
        address: `${currentPos[1].toFixed(4)}, ${currentPos[0].toFixed(4)}`,
        coordinates: currentPos,
      };
      setStartPoint(currentLocPoint);
      triggerCalculateRoute(currentLocPoint, destinationPoint, waypoints, isTrafficVisible, language === 'ar', travelMode);
    },
    [destinationPoint, waypoints, isTrafficVisible, language, travelMode, triggerCalculateRoute]
  );

  // Phase 11: Live Navigation tracking hook
  const {
    isLiveActive,
    isSimulating,
    currentPosition,
    activeStepIndex,
    distanceToNextStep,
    startLiveTracking,
    startSimulation,
    stopLiveTracking,
  } = useLiveTracking({
    routeCoordinates: activeRouteCoords,
    instructions: activeRoute?.instructions || [],
    onDeviationDetected: handleDeviationDetected,
    deviationThresholdMeters: 55,
  });

  // Phase 12: Voice Guidance playback on instruction step update
  useEffect(() => {
    if (
      isLiveActive &&
      activeRoute &&
      activeRoute.instructions &&
      activeRoute.instructions[activeStepIndex]
    ) {
      const step = activeRoute.instructions[activeStepIndex];
      speechService.speakInstruction(step.message, language === 'ar');
    }
  }, [isLiveActive, activeStepIndex, activeRoute, language]);

  // Phase 15: Search EV Charging Stations (Nationwide + 20km along route)
  useEffect(() => {
    if (appMode === 'evTrip') {
      setIsEVVisible(true);
    }
  }, [appMode]);

  useEffect(() => {
    if (!isEVVisible) {
      setEvStations([]);
      return;
    }

    let isSubscribed = true;
    setIsLoadingEV(true);

    if (activeRouteCoords.length > 0) {
      // Focus on all EV chargers within 20 km of route
      searchEVStationsAlongRoute(activeRouteCoords, 20000)
        .then((stations) => {
          if (isSubscribed) {
            setEvStations(stations);
          }
        })
        .catch((err) => {
          console.warn('EV stations query error:', err);
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLoadingEV(false);
          }
        });
    } else {
      // Nationwide EV stations across Egypt
      fetchAllEgyptEVStations()
        .then((stations) => {
          if (isSubscribed) {
            setEvStations(stations);
          }
        })
        .catch((err) => {
          console.warn('Nationwide EV stations error:', err);
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLoadingEV(false);
          }
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [isEVVisible, activeRouteCoords]);

  // Visible EV stations count within current map extent (when no route active)
  const [visibleEVCount, setVisibleEVCount] = useState<number>(0);

  // Compute EV stations count for toggle: near-route count if route is active, otherwise visible in extent
  const nearEVStationsCount = useMemo(
    () => evStations.filter((s) => s.isNearRoute).length,
    [evStations]
  );
  const displayEVCount = activeRouteCoords.length > 0 ? nearEVStationsCount : visibleEVCount;

  // Phase 14: Delivery Mode Waypoint Optimization handler
  const handleOptimizeDelivery = async () => {
    if (!startPoint || !destinationPoint || waypoints.length < 2) return;
    setIsOptimizingDelivery(true);
    try {
      const result = await optimizeWaypoints(startPoint, waypoints, destinationPoint);
      setWaypoints(result.optimizedWaypoints);
      triggerCalculateRoute(
        startPoint,
        destinationPoint,
        result.optimizedWaypoints,
        isTrafficVisible,
        language === 'ar',
        travelMode
      );
    } catch (e) {
      console.warn('Delivery route optimization failed:', e);
    } finally {
      setIsOptimizingDelivery(false);
    }
  };

  const handleSelectStart = (location: LocationPoint) => {
    if (destinationPoint && isSameCoord(location.coordinates, destinationPoint.coordinates)) {
      setValidationError('Start and destination cannot be the same place.');
      return;
    }
    const dupWp = waypoints.find((wp) => isSameCoord(wp.coordinates, location.coordinates));
    if (dupWp) {
      setValidationError('This location is already added as a stop in your route.');
      return;
    }
    setValidationError(null);
    setStartPoint(location);
  };

  const handleSelectDestination = (location: LocationPoint) => {
    if (startPoint && isSameCoord(location.coordinates, startPoint.coordinates)) {
      setValidationError('Start and destination cannot be the same place.');
      return;
    }
    const dupWp = waypoints.find((wp) => isSameCoord(wp.coordinates, location.coordinates));
    if (dupWp) {
      setValidationError('This location is already added as a stop in your route.');
      return;
    }
    setValidationError(null);
    setDestinationPoint(location);
  };

  const handleClearStart = () => {
    setStartPoint(null);
    setValidationError(null);
  };

  const handleClearDestination = () => {
    setDestinationPoint(null);
    setValidationError(null);
  };

  const handleAddWaypoint = () => {
    if (waypoints.length >= 5) return;
    setWaypoints((prev) => [
      ...prev,
      {
        id: `waypoint-${Date.now()}`,
        name: '',
        address: '',
        coordinates: [0, 0],
      },
    ]);
  };

  const handleUpdateWaypoint = (index: number, location: LocationPoint) => {
    if (startPoint && isSameCoord(location.coordinates, startPoint.coordinates)) {
      setValidationError('This location is already your starting point.');
      return;
    }
    if (destinationPoint && isSameCoord(location.coordinates, destinationPoint.coordinates)) {
      setValidationError('This location is already your destination.');
      return;
    }
    const dupWp = waypoints.find((wp, i) => i !== index && isSameCoord(wp.coordinates, location.coordinates));
    if (dupWp) {
      setValidationError('This location is already added as another stop.');
      return;
    }

    setValidationError(null);
    setWaypoints((prev) => {
      const next = [...prev];
      next[index] = location;
      return next;
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const handleSwapPoints = () => {
    setStartPoint(destinationPoint);
    setDestinationPoint(startPoint);
    setValidationError(null);
  };

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setGeolocationError(null);

    try {
      const pos = await getCurrentBrowserPosition();
      const resolvedLocation = await reverseGeocodeLocation(pos.longitude, pos.latitude);
      handleSelectStart(resolvedLocation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to acquire current location.';
      setGeolocationError(msg);
    } finally {
      setIsLocating(false);
    }
  };

  const handleDismissGeoError = () => {
    setGeolocationError(null);
  };

  const handleDismissValidationError = () => {
    setValidationError(null);
  };

  const handleRetryRouting = () => {
    if (startPoint && destinationPoint) {
      triggerCalculateRoute(startPoint, destinationPoint, waypoints, isTrafficVisible, language === 'ar', travelMode);
    }
  };

  const handleToggleTraffic = () => {
    setIsTrafficVisible((prev) => !prev);
  };

  const handleToggleEV = () => {
    setIsEVVisible((prev) => !prev);
  };

  const handleSelectRoute = (index: number) => {
    setSelectedRouteIndex(index);
  };

  const handleSelectStep = (coordinates: [number, number]) => {
    setFocusedCoordinate(coordinates);
  };

  const handleSavePlace = (label: string, category: PlaceCategory, location: LocationPoint) => {
    savePlace({ label, category, location });
    setSavedPlaces(getSavedPlaces());
  };

  const handleUpdatePlace = (id: string, label: string) => {
    updatePlace(id, { label });
    setSavedPlaces(getSavedPlaces());
  };

  const handleDeletePlace = (id: string) => {
    deletePlace(id);
    setSavedPlaces(getSavedPlaces());
  };

  const handleClearAllRecentRoutes = () => {
    clearRecentRoutes();
    setRecentRoutes([]);
  };

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const next = saveUserPreferences(updated);
    setPreferences(next);
    if (typeof updated.trafficDefault === 'boolean') {
      setIsTrafficVisible(updated.trafficDefault);
    }
  };

  const handleSelectRecentRoute = (route: RecentRoute) => {
    setStartPoint(route.start);
    setDestinationPoint(route.destination);
    setWaypoints(route.waypoints || []);
  };

  // Add EV station as a stop on route
  const handleAddEVStationAsStop = (station: EVStation) => {
    if (waypoints.length >= 5) return;
    const newWp: LocationPoint = {
      id: `ev-stop-${Date.now()}`,
      name: station.name,
      address: station.address,
      coordinates: station.coordinates,
    };
    setWaypoints((prev) => [...prev, newWp]);
    setSelectedEVStation(null);
  };

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Phase 11 & 12: Active Instruction Live Driving HUD */}
      {isLiveActive && (
        <ActiveInstruction
          instruction={activeRoute?.instructions?.[activeStepIndex] || null}
          nextInstruction={activeRoute?.instructions?.[activeStepIndex + 1] || null}
          distanceToStepMeters={distanceToNextStep}
          speedMps={currentPosition?.speed}
          isSimulating={isSimulating}
          isMuted={isVoiceMuted}
          onToggleMute={handleToggleVoiceMute}
          onExit={stopLiveTracking}
          unit={preferences.distanceUnit}
        />
      )}

      {/* Main Route and Search Panel - hidden during active live navigation */}
      {!isLiveActive && (
        <RoutePanel
          startPoint={startPoint}
          destinationPoint={destinationPoint}
          waypoints={waypoints}
          isLocating={isLocating}
          geolocationError={geolocationError}
          validationError={validationError}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          isRouting={isRouting}
          routingError={routingError}
          savedPlaces={savedPlaces}
          recentRoutes={recentRoutes}
          preferences={preferences}
          theme={theme}
          appMode={appMode}
          basemapStyle={basemapStyle}
          travelMode={travelMode}
          onSelectTravelMode={setTravelMode}
          onOpenMapOptions={() => setIsMapOptionsOpen(true)}
          isOptimizingDelivery={isOptimizingDelivery}
          isEVVisible={isEVVisible}
          isLoadingEV={isLoadingEV}
          evStationsCount={displayEVCount}
          onToggleEV={handleToggleEV}
          onToggleTheme={handleToggleTheme}
          onSelectMode={setAppMode}
          onSelectBasemap={handleSelectBasemap}
          onOptimizeDelivery={handleOptimizeDelivery}
          onStartDriving={startLiveTracking}
          onStartSimulation={startSimulation}
          onSelectStart={handleSelectStart}
          onSelectDestination={handleSelectDestination}
          onClearStart={handleClearStart}
          onClearDestination={handleClearDestination}
          onAddWaypoint={handleAddWaypoint}
          onUpdateWaypoint={handleUpdateWaypoint}
          onRemoveWaypoint={handleRemoveWaypoint}
          onSwapPoints={handleSwapPoints}
          onUseMyLocation={handleUseMyLocation}
          onDismissGeoError={handleDismissGeoError}
          onDismissValidationError={handleDismissValidationError}
          onSelectRoute={handleSelectRoute}
          onSelectStep={handleSelectStep}
          onRetryRouting={handleRetryRouting}
          onSelectRecentRoute={handleSelectRecentRoute}
          onSavePlace={handleSavePlace}
          onUpdatePlace={handleUpdatePlace}
          onDeletePlace={handleDeletePlace}
          onClearRecentRoutes={handleClearAllRecentRoutes}
          onUpdatePreferences={handleUpdatePreferences}
        />
      )}

      {/* Floating Map Controls: Find My Location & Map Options (TomTom Plan Image 1) - hidden during navigation */}
      {!isLiveActive && (
        <FloatingMapControls
          onFindMyLocation={handleUseMyLocation}
          onOpenMapOptions={() => setIsMapOptionsOpen(true)}
          isLocating={isLocating}
        />
      )}

      {/* Map Options Drawer (TomTom Plan Image 2) */}
      <MapOptionsDrawer
        isOpen={isMapOptionsOpen}
        onClose={() => setIsMapOptionsOpen(false)}
        currentBasemap={basemapStyle}
        onSelectBasemap={handleSelectBasemap}
        trafficIncidents={trafficIncidents}
        onToggleIncidents={handleToggleTrafficIncidents}
        trafficFlow={trafficFlow}
        onToggleFlow={handleToggleTrafficFlow}
        isEVVisible={isEVVisible}
        onToggleEV={handleToggleEV}
        onFindMyLocation={handleUseMyLocation}
        selectedPOIs={selectedPOIs}
        onTogglePOI={handleTogglePOI}
      />

      {/* Traffic & EV Controls - hidden during navigation */}
      {!isLiveActive && (
        <TrafficControls
          isVisible={isTrafficVisible}
          onToggle={handleToggleTraffic}
          showEVToggle={appMode === 'evTrip' || appMode === 'general'}
          isEVVisible={isEVVisible}
          isLoadingEV={isLoadingEV}
          evStationsCount={displayEVCount}
          onToggleEV={handleToggleEV}
        />
      )}

      {/* Map Component */}
      <Map
        startPoint={startPoint}
        destinationPoint={destinationPoint}
        waypoints={waypoints.filter((wp) => wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0)}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        focusedCoordinate={focusedCoordinate}
        isTrafficVisible={isTrafficVisible}
        trafficIncidents={trafficIncidents}
        trafficFlow={trafficFlow}
        basemapStyle={basemapStyle}
        livePosition={currentPosition}
        isDrivingMode={isLiveActive}
        travelMode={travelMode}
        evStations={evStations}
        isEVVisible={isEVVisible}
        onSelectRoute={handleSelectRoute}
        onSelectEVStation={(st) => setSelectedEVStation(st)}
        onVisibleEVCountChange={setVisibleEVCount}
      />

      {/* EV Station Details Modal/Popup Overlay */}
      {selectedEVStation && (
        <div className="ev-popup-modal-overlay">
          <div className="ev-popup-backdrop" onClick={() => setSelectedEVStation(null)} />
          <div className="ev-popup-card-wrapper">
            <EVStationPopup
              station={selectedEVStation}
              onClose={() => setSelectedEVStation(null)}
              onSetAsWaypoint={handleAddEVStationAsStop}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default App;

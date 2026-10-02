import React, { useEffect, useRef, useState, useCallback } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { TOMTOM_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../services/tomtom/config';
import { LocationPoint } from '../../types/location';
import { RouteOption, TravelMode } from '../../types/route';
import { formatDuration } from '../../utils/formatters';
import { getRouteColorStyle, BasemapStyle } from '../../utils/routeColors';
import { LiveLocation } from '../../hooks/useLiveTracking';
import { DrivingCamera } from './DrivingCamera';
import { EVStation, getMinDistanceToRouteKm } from '../../services/tomtom/evStations';
import './Map.css';

export const BASEMAP_STYLE_MAP: Record<BasemapStyle, tt.MapStyle> = {
  standardDark: '2/basic_street-dark' as tt.MapStyle,
  standardLight: '2/basic_street-light' as tt.MapStyle,
  drivingDark: '2/basic_street-dark-driving' as tt.MapStyle,
  drivingLight: '2/basic_street-light-driving' as tt.MapStyle,
  monoDark: '2/basic_mono-dark' as tt.MapStyle,
  monoLight: '2/basic_mono-light' as tt.MapStyle,
  satellite: '2/basic_street-satellite' as tt.MapStyle,
};

export function getMapStyleConfig(basemap: BasemapStyle): tt.MapStyleConfig {
  const isDark =
    basemap === 'standardDark' ||
    basemap === 'drivingDark' ||
    basemap === 'monoDark' ||
    basemap === 'satellite';

  const targetMap: tt.MapStyle = BASEMAP_STYLE_MAP[basemap] || BASEMAP_STYLE_MAP.standardDark;

  return {
    map: targetMap,
    trafficIncidents: isDark ? '2/incidents_dark' : '2/incidents_light',
    trafficFlow: isDark ? '2/flow_relative-dark' : '2/flow_relative-light',
    poi: basemap === 'satellite' ? '2/poi_satellite' : isDark ? '2/poi_dark' : '2/poi_light',
  };
}

export interface MapProps {
  startPoint?: LocationPoint | null;
  destinationPoint?: LocationPoint | null;
  waypoints?: LocationPoint[];
  routes?: RouteOption[];
  selectedRouteIndex?: number;
  focusedCoordinate?: [number, number] | null;
  isTrafficVisible?: boolean;
  trafficIncidents?: boolean;
  trafficFlow?: boolean;
  basemapStyle?: BasemapStyle;
  livePosition?: LiveLocation | null;
  isDrivingMode?: boolean;
  travelMode?: TravelMode;
  evStations?: EVStation[];
  isEVVisible?: boolean;
  onSelectRoute?: (index: number) => void;
  onSelectEVStation?: (station: EVStation) => void;
  onVisibleEVCountChange?: (count: number) => void;
  onMapLoaded?: (map: tt.Map) => void;
}

function createCustomMarkerElement(label: string, type: 'start' | 'dest' | 'waypoint'): HTMLElement {
  const container = document.createElement('div');
  container.className = `georoute-marker georoute-marker-${type}`;
  const pin = document.createElement('div');
  pin.className = `marker-pin marker-pin-${type}`;
  const text = document.createElement('span');
  text.className = 'marker-label';
  text.textContent = label;
  pin.appendChild(text);
  container.appendChild(pin);
  return container;
}

function createPopupContent(title: string, address: string): string {
  return `
    <div style="font-family: inherit; min-width: 140px;">
      <div style="font-weight: 700; font-size: 13px; color: #f8fafc; margin-bottom: 3px;">
        ${title}
      </div>
      <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.4;">
        ${address}
      </div>
    </div>
  `;
}

function createLivePuckElement(heading: number | null, travelMode: TravelMode = 'car'): HTMLElement {
  const el = document.createElement('div');
  el.className = `live-nav-puck mode-${travelMode}`;

  // 1. Radar pulsating aura
  const aura = document.createElement('div');
  aura.className = 'puck-aura';
  el.appendChild(aura);

  // 2. Directional heading pointer (rotates towards heading)
  const pointerRing = document.createElement('div');
  pointerRing.className = 'puck-pointer-ring';
  if (heading !== null && !isNaN(heading)) {
    pointerRing.style.transform = `rotate(${heading}deg)`;
  }
  const pointerArrow = document.createElement('div');
  pointerArrow.className = 'puck-pointer-arrow';
  pointerRing.appendChild(pointerArrow);
  el.appendChild(pointerRing);

  // 3. Central vehicle puck badge with emoji icon
  const core = document.createElement('div');
  core.className = 'puck-core';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'puck-icon';
  if (travelMode === 'motorcycle') {
    iconSpan.textContent = '🏍️';
  } else if (travelMode === 'pedestrian') {
    iconSpan.textContent = '🚶';
  } else {
    iconSpan.textContent = '🚗';
  }
  core.appendChild(iconSpan);
  el.appendChild(core);

  return el;
}

export const Map: React.FC<MapProps> = ({
  startPoint,
  destinationPoint,
  waypoints = [],
  routes = [],
  selectedRouteIndex = 0,
  focusedCoordinate,
  isTrafficVisible = true,
  trafficIncidents = true,
  trafficFlow = true,
  basemapStyle = 'standardDark',
  livePosition,
  isDrivingMode = false,
  travelMode = 'car',
  evStations = [],
  isEVVisible = false,
  onSelectRoute,
  onSelectEVStation,
  onVisibleEVCountChange,
  onMapLoaded,
}) => {
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const drivingCameraRef = useRef<DrivingCamera>(new DrivingCamera());

  const startMarkerRef = useRef<tt.Marker | null>(null);
  const destMarkerRef = useRef<tt.Marker | null>(null);
  const waypointMarkersRef = useRef<tt.Marker[]>([]);
  const routeBadgeMarkersRef = useRef<tt.Marker[]>([]);
  const livePuckMarkerRef = useRef<tt.Marker | null>(null);
  const evStationMarkersRef = useRef<tt.Marker[]>([]);

  // Stable refs for callbacks and basemap tracking to prevent map re-initialization
  const onSelectRouteRef = useRef(onSelectRoute);
  useEffect(() => {
    onSelectRouteRef.current = onSelectRoute;
  }, [onSelectRoute]);

  const onMapLoadedRef = useRef(onMapLoaded);
  useEffect(() => {
    onMapLoadedRef.current = onMapLoaded;
  }, [onMapLoaded]);

  const currentBasemapRef = useRef<BasemapStyle>(basemapStyle);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [styleVersion, setStyleVersion] = useState<number>(0);
  const [boundsVersion, setBoundsVersion] = useState<number>(0);

  // Lifts all route polyline layers to the absolute top of the map layer stack ("علي الوش")
  const liftRouteLayersToTop = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof map.getLayer !== 'function') return;

    try {
      const style = map.getStyle();
      if (!style || !style.layers || style.layers.length === 0) return;

      const layers = style.layers;

      // Desired layer stack in exact visual hierarchy (from bottom to top):
      // 1. Alternative route halos
      // 2. Alternative route outlines
      // 3. Alternative route lines
      // 4. Active route halo
      // 5. Active route bold outline
      // 6. Active route core vibrant line
      const desiredRouteLayers: string[] = [];
      layers
        .filter((l) => l.id.startsWith('georoute-alt-halo-'))
        .forEach((l) => desiredRouteLayers.push(l.id));
      layers
        .filter((l) => l.id.startsWith('georoute-alt-outline-'))
        .forEach((l) => desiredRouteLayers.push(l.id));
      layers
        .filter((l) => l.id.startsWith('georoute-alt-line-'))
        .forEach((l) => desiredRouteLayers.push(l.id));

      if (map.getLayer('georoute-active-halo')) desiredRouteLayers.push('georoute-active-halo');
      if (map.getLayer('georoute-active-outline')) desiredRouteLayers.push('georoute-active-outline');
      if (map.getLayer('georoute-active-line')) desiredRouteLayers.push('georoute-active-line');

      if (desiredRouteLayers.length === 0) return;

      // Check if the current top layers of the map are ALREADY exactly our route layers in this exact order
      const topSlice = layers.slice(-desiredRouteLayers.length).map((l) => l.id);
      const isAlreadyOnTop =
        topSlice.length === desiredRouteLayers.length &&
        topSlice.every((id, idx) => id === desiredRouteLayers[idx]);

      if (isAlreadyOnTop) {
        return; // Already 100% on the absolute top of all layers!
      }

      // Elevate each route layer to the absolute top of the map layer stack
      desiredRouteLayers.forEach((id) => {
        try {
          map.moveLayer(id);
        } catch {
          // Ignored
        }
      });
    } catch {
      // Ignored
    }
  }, []);

  // Track map extent changes (panning, zooming, rotating, pitching)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    const handleBoundsChange = () => {
      setBoundsVersion((v) => v + 1);
    };

    const handleReorder = () => {
      liftRouteLayersToTop();
    };

    map.on('moveend', handleBoundsChange);
    map.on('zoomend', handleBoundsChange);
    map.on('rotateend', handleBoundsChange);
    map.on('pitchend', handleBoundsChange);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyMap = map as any;
    if (typeof anyMap.on === 'function') {
      anyMap.on('idle', handleReorder);
      anyMap.on('sourcedata', handleReorder);
      anyMap.on('styledata', handleReorder);
    }

    return () => {
      map.off('moveend', handleBoundsChange);
      map.off('zoomend', handleBoundsChange);
      map.off('rotateend', handleBoundsChange);
      map.off('pitchend', handleBoundsChange);
      if (typeof anyMap.off === 'function') {
        anyMap.off('idle', handleReorder);
        anyMap.off('sourcedata', handleReorder);
        anyMap.off('styledata', handleReorder);
      }
    };
  }, [isMapReady, liftRouteLayersToTop]);

  // Periodic heartbeat to guarantee routes ALWAYS stay above dynamic traffic flow tiles
  useEffect(() => {
    if (routes.length === 0) return;
    const interval = setInterval(() => {
      liftRouteLayersToTop();
    }, 400);
    return () => clearInterval(interval);
  }, [routes.length, liftRouteLayersToTop]);

  const activeRoute = routes[selectedRouteIndex] || routes[0];

  const activeRouteCoords: [number, number][] = React.useMemo(() => {
    if (activeRoute?.geojson?.features?.[0]?.geometry?.coordinates) {
      return activeRoute.geojson.features[0].geometry.coordinates as [number, number][];
    }
    return [];
  }, [activeRoute]);

  const initMap = useCallback(() => {
    if (!mapElementRef.current) return;

    if (!TOMTOM_API_KEY) {
      setErrorMessage(
        'Missing TomTom API Key. Please add VITE_TOMTOM_API_KEY to your .env file and restart the dev server.'
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // Ignored
      }
      mapInstanceRef.current = null;
    }

    try {
      const initialStyle = currentBasemapRef.current;
      const styleConfig = getMapStyleConfig(initialStyle);

      const map = tt.map({
        key: TOMTOM_API_KEY,
        container: mapElementRef.current,
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        style: styleConfig,
        dragPan: true,
        dragRotate: true,
        pitchWithRotate: true,
        maxPitch: 60,
        stylesVisibility: {
          trafficFlow: isTrafficVisible,
          trafficIncidents: isTrafficVisible,
        },
      });

      drivingCameraRef.current.setMap(map);

      // Add scale control (bottom-left)
      map.addControl(new tt.ScaleControl({ unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        setIsLoading(false);
        setIsMapReady(true);
        drivingCameraRef.current.setMap(map);
        if (onMapLoadedRef.current) {
          onMapLoadedRef.current(map);
        }

        // Click inspection for alternative routes and traffic incidents
        map.on('click', (e) => {
          try {
            const features = map.queryRenderedFeatures(e.point);

            const routeFeature = features.find((f) => f.layer?.id?.startsWith('georoute-alt-line-'));
            if (routeFeature && routeFeature.layer) {
              const match = routeFeature.layer.id.match(/georoute-alt-line-(\d+)/);
              if (match && onSelectRouteRef.current) {
                const clickedIdx = parseInt(match[1], 10);
                onSelectRouteRef.current(clickedIdx);
                return;
              }
            }

            const incident = features.find((f) => {
              const lId = f.layer?.id || '';
              const src = f.source || '';
              return (
                lId.includes('incident') ||
                src.includes('incident') ||
                f.properties?.iconCategory !== undefined
              );
            });

            if (incident && incident.properties) {
              const p = incident.properties;
              const category = p.iconCategory || 'Traffic Incident';
              const description =
                p.description || p.cause || p.roadName || 'Traffic disruption reported at this location.';
              const delayText = p.delay ? `${Math.round(p.delay / 60)} min delay` : null;

              new tt.Popup({ offset: 15 })
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="font-family: inherit; min-width: 170px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 15px;">⚠️</span>
                      <strong style="color: #f8fafc; font-size: 13px;">${category}</strong>
                    </div>
                    <div style="color: #94a3b8; font-size: 12px; line-height: 1.4; margin-bottom: 4px;">
                      ${description}
                    </div>
                    ${delayText ? `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${delayText}</span>` : ''}
                  </div>
                `)
                .addTo(map);
            }
          } catch {
            // Ignored during map transitions
          }
        });

        // Hover cursor pointer over routes
        map.on('mousemove', (e) => {
          try {
            const features = map.queryRenderedFeatures(e.point);
            const hasInteractiveFeature = features.some((f) => {
              const lId = f.layer?.id || '';
              return lId.startsWith('georoute-') || lId.includes('incident');
            });
            map.getCanvas().style.cursor = hasInteractiveFeature ? 'pointer' : '';
          } catch {
            // Ignored
          }
        });

        if (onMapLoadedRef.current) {
          onMapLoadedRef.current(map);
        }
      });

      map.on('styledata', () => {
        setStyleVersion((v) => v + 1);
      });

      map.on('error', (event: { error?: { message?: string } }) => {
        const errorText = event.error?.message || 'Failed to load TomTom map tiles.';
        console.warn('TomTom map non-fatal notice:', errorText);
      });

      mapInstanceRef.current = map;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while initializing the map.';
      console.error('Map initialization failed:', err);
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    initMap();

    const handleResize = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.resize();
        } catch {
          // Ignored
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // Ignored
        }
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  // Switch basemap style dynamically on the fly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;
    if (currentBasemapRef.current === basemapStyle) return;
    currentBasemapRef.current = basemapStyle;

    try {
      const styleConfig = getMapStyleConfig(basemapStyle);
      map.setStyle(styleConfig);
    } catch (e) {
      console.warn('Failed to dynamically switch style:', e);
    }
  }, [basemapStyle, isMapReady]);

  // Toggle traffic flow and incidents layers visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
        return;
      }
      const showFlow = isTrafficVisible && trafficFlow;
      const showIncidents = isTrafficVisible && trafficIncidents;

      if (showFlow) {
        map.showTrafficFlow();
      } else {
        map.hideTrafficFlow();
      }

      if (showIncidents) {
        map.showTrafficIncidents();
      } else {
        map.hideTrafficIncidents();
      }

      // Ensure route layers stay on top of traffic layers ("علي الوش")
      liftRouteLayersToTop();
    } catch (e) {
      console.warn('Traffic visibility toggle error:', e);
    }
  }, [isTrafficVisible, trafficFlow, trafficIncidents, isMapReady, styleVersion, liftRouteLayersToTop]);

  // Update Start Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove();
        startMarkerRef.current = null;
      }

      if (startPoint) {
        const markerEl = createCustomMarkerElement('A', 'start');
        const popup = new tt.Popup({ offset: 35, closeButton: false }).setHTML(
          createPopupContent(startPoint.name, startPoint.address)
        );

        const marker = new tt.Marker({ element: markerEl, anchor: 'bottom' })
          .setLngLat(startPoint.coordinates)
          .setPopup(popup)
          .addTo(map);

        startMarkerRef.current = marker;
      }
    } catch (e) {
      console.warn('Start marker error:', e);
    }
  }, [startPoint, isMapReady, styleVersion]);

  // Update Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }

      if (destinationPoint) {
        const markerEl = createCustomMarkerElement('B', 'dest');
        const popup = new tt.Popup({ offset: 35, closeButton: false }).setHTML(
          createPopupContent(destinationPoint.name, destinationPoint.address)
        );

        const marker = new tt.Marker({ element: markerEl, anchor: 'bottom' })
          .setLngLat(destinationPoint.coordinates)
          .setPopup(popup)
          .addTo(map);

        destMarkerRef.current = marker;
      }
    } catch (e) {
      console.warn('Destination marker error:', e);
    }
  }, [destinationPoint, isMapReady, styleVersion]);

  // Update Intermediate Waypoint Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      waypointMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          // Ignored
        }
      });
      waypointMarkersRef.current = [];

      waypoints.forEach((wp, index) => {
        const markerEl = createCustomMarkerElement(`${index + 1}`, 'waypoint');
        const popup = new tt.Popup({ offset: 35, closeButton: false }).setHTML(
          createPopupContent(`Stop ${index + 1}: ${wp.name}`, wp.address)
        );

        const marker = new tt.Marker({ element: markerEl, anchor: 'bottom' })
          .setLngLat(wp.coordinates)
          .setPopup(popup)
          .addTo(map);

        waypointMarkersRef.current.push(marker);
      });
    } catch (e) {
      console.warn('Waypoint markers error:', e);
    }
  }, [waypoints, isMapReady, styleVersion]);

  // Live Navigation Puck Marker & Camera Tracking
  const currentPuckModeRef = useRef<TravelMode>(travelMode);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      if (!isDrivingMode || !livePosition) {
        if (livePuckMarkerRef.current) {
          livePuckMarkerRef.current.remove();
          livePuckMarkerRef.current = null;
        }
        return;
      }

      const modeChanged = currentPuckModeRef.current !== travelMode;
      currentPuckModeRef.current = travelMode;

      if (!livePuckMarkerRef.current || modeChanged) {
        if (livePuckMarkerRef.current) {
          livePuckMarkerRef.current.remove();
          livePuckMarkerRef.current = null;
        }
        const puckEl = createLivePuckElement(livePosition.heading, travelMode);
        const puck = new tt.Marker({ element: puckEl, anchor: 'center' })
          .setLngLat(livePosition.coordinates)
          .addTo(map);
        livePuckMarkerRef.current = puck;
      } else {
        livePuckMarkerRef.current.setLngLat(livePosition.coordinates);
        const pointerRing = livePuckMarkerRef.current.getElement()?.querySelector<HTMLElement>('.puck-pointer-ring');
        if (pointerRing && livePosition.heading !== null && !isNaN(livePosition.heading)) {
          pointerRing.style.transform = `rotate(${livePosition.heading}deg)`;
        }
      }

      // Driving camera smoothly updates view to follow user puck
      drivingCameraRef.current.update(livePosition.coordinates, livePosition.heading, {
        pitch: 58,
        zoom: 17.5,
        duration: 800,
      });
    } catch (e) {
      console.warn('Live tracking marker error:', e);
    }
  }, [livePosition, isDrivingMode, isMapReady, travelMode]);

  // EV Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      evStationMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          // Ignored
        }
      });
      evStationMarkersRef.current = [];

      if (!isEVVisible || !evStations || evStations.length === 0) {
        if (onVisibleEVCountChange) onVisibleEVCountChange(0);
        return;
      }

      // Filter stations by context:
      // USER SPECIFICATION: When user has a route/searches, ONLY display EV stations close to the route (2.5 km corridor)!
      // Do NOT show all stations that are in the map extent!
      let displayedStations: EVStation[] = [];
      try {
        const bounds = map.getBounds();
        if (routes.length > 0 && activeRouteCoords.length > 0) {
          const corridorStations: EVStation[] = [];
          for (const st of evStations) {
            if (!st.coordinates || !Array.isArray(st.coordinates) || st.coordinates.length < 2) continue;
            // Calculate exact geometric distance to active route polyline
            const distKm = getMinDistanceToRouteKm(st.coordinates, activeRouteCoords);
            // Strictly exclude any station further than 2.5 km from the route!
            if (distKm > 2.5) continue;
            if (bounds && !bounds.contains(st.coordinates)) continue;

            corridorStations.push({
              ...st,
              distanceToRouteKm: Math.round(distKm * 10) / 10,
              isNearRoute: true,
            });
          }
          displayedStations = corridorStations;
        } else if (routes.length === 0) {
          // When NO route is active: display stations inside visible bounds (free browse mode)
          displayedStations = evStations.filter((st) => {
            if (!st.coordinates || !Array.isArray(st.coordinates) || st.coordinates.length < 2) return false;
            return bounds ? bounds.contains(st.coordinates) : true;
          });
        }
      } catch {
        displayedStations = [];
      }

      if (onVisibleEVCountChange) {
        onVisibleEVCountChange(displayedStations.length);
      }

      displayedStations.forEach((st) => {
        // Outer anchor wrapper: strictly positioned by tt.Marker with no CSS transitions or transforms
        const wrapper = document.createElement('div');
        wrapper.className = 'ev-marker-anchor-wrapper';

        // Inner bubble: styles, colors, badges, and hover scaling
        const bubble = document.createElement('div');
        const statusClass =
          st.status === 'available'
            ? 'ev-marker-available'
            : st.status === 'occupied'
            ? 'ev-marker-occupied'
            : 'ev-marker-available';
        const nearRouteClass = st.isNearRoute ? 'is-near-route' : '';

        bubble.className = `ev-marker-bubble ${statusClass} ${nearRouteClass}`.trim();
        const distInfo = st.distanceToRouteKm !== undefined ? ` • ${st.distanceToRouteKm} km from route` : '';
        bubble.title = `${st.name}${distInfo} (Click for details)`;
        bubble.innerHTML = `<span class="ev-marker-icon">⚡</span>`;

        bubble.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectEVStation) {
            onSelectEVStation(st);
          }
        });

        wrapper.appendChild(bubble);

        const marker = new tt.Marker({
          element: wrapper,
          anchor: 'center',
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        })
          .setLngLat(st.coordinates)
          .addTo(map);

        evStationMarkersRef.current.push(marker);
      });
    } catch (e) {
      console.warn('EV stations marker error:', e);
    }
  }, [evStations, isEVVisible, isMapReady, onSelectEVStation, styleVersion, routes.length, activeRouteCoords, boundsVersion, onVisibleEVCountChange, livePosition]);

  // Fallback camera focus if no routes are computed yet
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady || routes.length > 0 || isDrivingMode) return;

    try {
      const allPoints = [
        ...(startPoint ? [startPoint.coordinates] : []),
        ...waypoints.map((w) => w.coordinates),
        ...(destinationPoint ? [destinationPoint.coordinates] : []),
      ];

      if (allPoints.length >= 2) {
        const bounds = new tt.LngLatBounds();
        allPoints.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 800 });
      } else if (allPoints.length === 1) {
        map.easeTo({ center: allPoints[0], zoom: 14, duration: 800 });
      }
    } catch (e) {
      console.warn('Fallback camera focus error:', e);
    }
  }, [startPoint, destinationPoint, waypoints, routes.length, isMapReady, isDrivingMode]);

  // Draw Active & Alternative Route Layers on Map with Halo casing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      // Safe helper to create or update a GeoJSON source
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setOrAddSource = (sourceId: string, data: any) => {
        const existing = map.getSource(sourceId) as tt.GeoJSONSource | undefined;
        if (existing && typeof existing.setData === 'function') {
          existing.setData(data);
        } else {
          try {
            map.addSource(sourceId, {
              type: 'geojson',
              data,
            });
          } catch {
            // Ignored
          }
        }
      };

      // Safe helper to add or update a line layer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ensureLineLayer = (layerId: string, sourceId: string, paint: any) => {
        if (!map.getLayer(layerId)) {
          try {
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              paint,
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
                'visibility': 'visible',
              },
            });
          } catch {
            // Ignored
          }
        } else {
          try {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            Object.keys(paint).forEach((prop) => {
              map.setPaintProperty(layerId, prop, paint[prop]);
            });
          } catch {
            // Ignored
          }
        }
      };

      routeBadgeMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          // Ignore
        }
      });
      routeBadgeMarkersRef.current = [];

      if (!routes || routes.length === 0) {
        // Clean up layers and sources if routes were cleared
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer) => {
            if (layer.id.startsWith('georoute-')) {
              try {
                map.removeLayer(layer.id);
              } catch {
                // Ignore
              }
            }
          });
        }
        ['georoute-active-source', 'georoute-alt-source-0', 'georoute-alt-source-1', 'georoute-alt-source-2'].forEach(
          (sId) => {
            if (map.getSource(sId)) {
              try {
                map.removeSource(sId);
              } catch {
                // Ignore
              }
            }
          }
        );
        return;
      }

      const fastestDuration = routes.length > 0 ? routes[0].summary.travelTimeInSeconds : 0;

      // 2. Render Inactive (Alternative) Routes first
      routes.forEach((rt, idx) => {
        if (idx !== selectedRouteIndex) {
          const sourceId = `georoute-alt-source-${idx}`;
          const haloLayerId = `georoute-alt-halo-${idx}`;
          const outlineLayerId = `georoute-alt-outline-${idx}`;
          const lineLayerId = `georoute-alt-line-${idx}`;

          const diffMinutes = Math.max(0, (rt.summary.travelTimeInSeconds - fastestDuration) / 60);
          const styleOpt = getRouteColorStyle(diffMinutes, false, idx, basemapStyle);

          setOrAddSource(sourceId, rt.geojson);

          // Layer 1: Halo Casing (Phase 19)
          ensureLineLayer(haloLayerId, sourceId, {
            'line-color': styleOpt.haloColor,
            'line-width': styleOpt.haloWidth,
            'line-opacity': styleOpt.haloOpacity,
          });

          // Layer 2: Outline
          ensureLineLayer(outlineLayerId, sourceId, {
            'line-color': styleOpt.outlineColor,
            'line-width': 8.5,
            'line-opacity': styleOpt.outlineOpacity,
          });

          // Layer 3: Core alternative line
          ensureLineLayer(lineLayerId, sourceId, {
            'line-color': styleOpt.coreColor,
            'line-width': styleOpt.coreWidth,
            'line-opacity': styleOpt.coreOpacity,
          });
        }
      });

      // 3. Render Active Selected Route on top
      if (activeRoute) {
        const activeSourceId = 'georoute-active-source';
        const activeStyle = getRouteColorStyle(0, true, selectedRouteIndex, basemapStyle);

        setOrAddSource(activeSourceId, activeRoute.geojson);

        // Layer 1: Halo Casing (Phase 19)
        ensureLineLayer('georoute-active-halo', activeSourceId, {
          'line-color': activeStyle.haloColor,
          'line-width': activeStyle.haloWidth,
          'line-opacity': activeStyle.haloOpacity,
        });

        // Layer 2: Bold Deep Outline
        ensureLineLayer('georoute-active-outline', activeSourceId, {
          'line-color': activeStyle.outlineColor,
          'line-width': 9.5,
          'line-opacity': activeStyle.outlineOpacity,
        });

        // Layer 3: Core active line
        ensureLineLayer('georoute-active-line', activeSourceId, {
          'line-color': activeStyle.coreColor,
          'line-width': activeStyle.coreWidth,
          'line-opacity': activeStyle.coreOpacity,
        });
      }

      // USER SPECIFICATION: Routes must ALWAYS be on top of everything ("علي الوش")
      liftRouteLayersToTop();

      // 4. Place interactive Midpoint Duration Badges for each route (staggered to prevent overlap)
      if (!isDrivingMode) {
        routes.forEach((rt, idx) => {
          const isSelected = idx === selectedRouteIndex;
          const durationStr = formatDuration(rt.summary.travelTimeInSeconds);
          const distKm = Math.round(rt.summary.lengthInMeters / 1000);
          const hasDelay = (rt.summary.trafficDelayInSeconds || 0) > 60;
          const delayText = hasDelay
            ? `+${Math.round(rt.summary.trafficDelayInSeconds / 60)}m`
            : '';

          const badgeEl = document.createElement('div');
          badgeEl.className = `route-time-badge ${isSelected ? 'is-active' : 'is-alternative'}`;
          badgeEl.title = `Route ${idx + 1}: ${durationStr} (${distKm} km). Click to select.`;

          badgeEl.innerHTML = `
            <span class="badge-duration">${durationStr}</span>
            <span class="badge-dot">•</span>
            <span class="badge-distance">${distKm} km</span>
            ${hasDelay ? `<span class="badge-delay">${delayText}</span>` : ''}
          `;

          badgeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onSelectRouteRef.current) {
              onSelectRouteRef.current(idx);
            }
          });

          // Stagger coordinate along polyline to strictly prevent badges from overlapping!
          const coords = rt.geojson?.features?.[0]?.geometry?.coordinates as [number, number][];
          let badgeCoord = rt.midpoint;
          if (coords && coords.length > 6) {
            const fractions = [0.45, 0.70, 0.25, 0.85];
            const frac = fractions[idx % fractions.length];
            const targetIdx = Math.floor(coords.length * frac);
            badgeCoord = coords[targetIdx] || rt.midpoint;
          }

          const badgeMarker = new tt.Marker({ element: badgeEl })
            .setLngLat(badgeCoord)
            .addTo(map);

          routeBadgeMarkersRef.current.push(badgeMarker);
        });
      }

      // 5. Fit bounds to the active route (and nearest EV stations along route if enabled)
      if (!isDrivingMode && activeRoute && activeRoute.geojson.features.length > 0) {
        const bounds = new tt.LngLatBounds();
        activeRoute.geojson.features[0].geometry.coordinates.forEach((coord) => {
          bounds.extend([coord[0], coord[1]]);
        });

        // If EV stations are visible, include nearest EV stations along route corridor (up to 2.5 km) in viewport
        if (isEVVisible && evStations && evStations.length > 0) {
          const nearStations = evStations.filter(
            (s) => s.isNearRoute && (s.distanceToRouteKm ?? 99) <= 2.5
          );
          // Include up to 2 closest near-route stations
          nearStations.slice(0, 2).forEach((st) => {
            bounds.extend(st.coordinates);
          });
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 90,
            maxZoom: 15,
            duration: 800,
          });
        }
      }
    } catch (err) {
      console.warn('Route layer drawing non-fatal error:', err);
    }
  }, [routes, selectedRouteIndex, isMapReady, activeRoute, isDrivingMode, basemapStyle, styleVersion]);

  // 6. Camera fly-to when user clicks a turn-by-turn guidance step
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedCoordinate || isDrivingMode) return;
    mapInstanceRef.current.easeTo({
      center: focusedCoordinate,
      zoom: Math.max(mapInstanceRef.current.getZoom(), 15),
      duration: 800,
    });
  }, [focusedCoordinate, isDrivingMode]);

  return (
    <div ref={mapWrapperRef} className="map-wrapper">
      <div ref={mapElementRef} className="map-container" id="tomtom-map-container" />

      {isLoading && (
        <div className="map-loading-overlay" aria-live="polite" aria-busy="true">
          <div className="map-spinner" />
          <span className="map-loading-text">Loading GeoRoute Map...</span>
        </div>
      )}

      {errorMessage && (
        <div className="map-error-overlay" role="alert">
          <svg
            className="map-error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="map-error-title">Unable to Load Map</div>
          <div className="map-error-message">{errorMessage}</div>
          <button className="map-retry-btn" onClick={initMap}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
};


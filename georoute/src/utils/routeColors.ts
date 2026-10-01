export type BasemapStyle =
  | 'standardDark'
  | 'standardLight'
  | 'drivingDark'
  | 'drivingLight'
  | 'monoDark'
  | 'monoLight'
  | 'satellite';

export interface RouteColorStyle {
  coreColor: string;
  outlineColor: string;
  coreOpacity: number;
  outlineOpacity: number;
  badgeBorder: string;
  haloColor: string;
  haloOpacity: number;
  haloWidth: number;
  coreWidth: number;
}

/**
 * Returns halo casing color and opacity tailored to the active basemap style
 * to guarantee razor-sharp contrast on dark, light, driving, and satellite maps.
 */
export function getHaloForBasemap(basemap: BasemapStyle = 'standardDark'): {
  color: string;
  opacity: number;
} {
  switch (basemap) {
    case 'standardLight':
    case 'monoLight':
    case 'drivingLight':
      return {
        color: '#0f172a', // Deep navy casing on light basemaps
        opacity: 0.32,
      };
    case 'satellite':
      return {
        color: '#ffffff', // High contrast white halo on satellite imagery
        opacity: 0.65,
      };
    case 'standardDark':
    case 'monoDark':
    case 'drivingDark':
    default:
      return {
        color: '#ffffff', // Translucent white halo on dark basemaps
        opacity: 0.25,
      };
  }
}

/**
 * Calculates line colors, halo casings, and opacities for active and alternative routes.
 */
export function getRouteColorStyle(
  _diffMinutes: number,
  isSelected: boolean,
  _routeIndex: number = 0,
  basemap: BasemapStyle = 'standardDark'
): RouteColorStyle {
  const halo = getHaloForBasemap(basemap);

  if (isSelected) {
    // 1. Primary / Active Route: TomTom Electric Blue with crisp white halo
    return {
      coreColor: '#0ea5e9',
      outlineColor: '#0369a1',
      coreOpacity: 0.98,
      outlineOpacity: 0.85,
      badgeBorder: '#38bdf8',
      haloColor: halo.color,
      haloOpacity: halo.opacity * 1.2,
      haloWidth: 12.0,
      coreWidth: 7.2,
    };
  }

  // 2. Alternative Routes: Crisp Clean White with dark casing (TomTom Plan style)
  return {
    coreColor: '#ffffff',
    outlineColor: '#0f172a',
    coreOpacity: 0.85,
    outlineOpacity: 0.75,
    badgeBorder: '#cbd5e1',
    haloColor: halo.color,
    haloOpacity: halo.opacity * 0.5,
    haloWidth: 9.5,
    coreWidth: 5.6,
  };
}

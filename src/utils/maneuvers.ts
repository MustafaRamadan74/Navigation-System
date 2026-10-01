export function getManeuverIcon(maneuver: string): string {
  const m = (maneuver || '').toUpperCase();

  if (m.includes('LEFT')) {
    return '↰';
  }
  if (m.includes('RIGHT')) {
    return '↱';
  }
  if (m.includes('ROUNDABOUT') || m.includes('ROTARY')) {
    return '↺';
  }
  if (m.includes('UTURN')) {
    return '↶';
  }
  if (m.includes('ARRIVE') || m.includes('DESTINATION')) {
    return '🏁';
  }
  if (m.includes('MOTORWAY') || m.includes('FREEWAY') || m.includes('HIGHWAY')) {
    return '🛣️';
  }
  if (m.includes('FORK') || m.includes('BRANCH')) {
    return '⌥';
  }
  return '↑';
}

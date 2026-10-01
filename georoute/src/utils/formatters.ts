export function formatDistance(meters: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    const miles = meters * 0.000621371;
    if (miles < 0.1) {
      const feet = Math.round(meters * 3.28084);
      return `${feet} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  }

  // Default metric (km / m)
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMins} min`;
}

export function formatArrivalTime(arrivalTimeStr?: string, travelTimeInSeconds?: number): string {
  let date: Date;
  if (arrivalTimeStr) {
    date = new Date(arrivalTimeStr);
  } else if (travelTimeInSeconds !== undefined) {
    date = new Date(Date.now() + travelTimeInSeconds * 1000);
  } else {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

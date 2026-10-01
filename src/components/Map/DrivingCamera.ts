import tt from '@tomtom-international/web-sdk-maps';

export interface DrivingCameraOptions {
  pitch?: number;
  zoom?: number;
  duration?: number;
}

export class DrivingCamera {
  private map: tt.Map | null = null;
  private lastBearing: number = 0;

  constructor(map?: tt.Map | null) {
    if (map) {
      this.map = map;
    }
  }

  public setMap(map: tt.Map | null) {
    this.map = map;
  }

  public update(
    position: [number, number],
    bearing?: number | null,
    options?: DrivingCameraOptions
  ) {
    if (!this.map) return;

    let targetBearing = this.lastBearing;
    if (bearing !== null && bearing !== undefined && !isNaN(bearing)) {
      // Smooth bearing rotation (choose shortest path around 360)
      let diff = ((bearing - this.lastBearing + 180) % 360) - 180;
      if (diff < -180) diff += 360;
      targetBearing = this.lastBearing + diff;
      this.lastBearing = targetBearing;
    }

    try {
      this.map.easeTo({
        center: position,
        bearing: targetBearing,
        pitch: options?.pitch ?? 58,
        zoom: options?.zoom ?? 17.5,
        duration: options?.duration ?? 800,
        essential: true,
      });
    } catch {
      // In case map was removed or in unready state
    }
  }

  public resetView(bounds?: tt.LngLatBounds) {
    if (!this.map) return;
    try {
      if (bounds && !bounds.isEmpty()) {
        this.map.fitBounds(bounds, {
          pitch: 0,
          bearing: 0,
          padding: 80,
          duration: 800,
        });
      } else {
        this.map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 800,
        });
      }
    } catch {
      // Ignored
    }
  }
}

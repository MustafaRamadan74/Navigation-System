import { minDistanceToPolyline } from '../../utils/geoMath';

export interface DeviationStatus {
  isDeviated: boolean;
  distanceToRouteMeters: number;
}

export class DeviationChecker {
  private consecutiveDeviations: number = 0;
  private requiredConsecutiveTicks: number;
  private thresholdMeters: number;

  constructor(thresholdMeters: number = 55, requiredConsecutiveTicks: number = 3) {
    this.thresholdMeters = thresholdMeters;
    this.requiredConsecutiveTicks = requiredConsecutiveTicks;
  }

  public check(
    currentCoord: [number, number],
    routeCoordinates: [number, number][]
  ): DeviationStatus {
    if (!routeCoordinates || routeCoordinates.length < 2) {
      return { isDeviated: false, distanceToRouteMeters: 0 };
    }

    const dist = minDistanceToPolyline(currentCoord, routeCoordinates);

    if (dist > this.thresholdMeters) {
      this.consecutiveDeviations += 1;
    } else {
      this.consecutiveDeviations = 0;
    }

    const isDeviated = this.consecutiveDeviations >= this.requiredConsecutiveTicks;

    return {
      isDeviated,
      distanceToRouteMeters: dist,
    };
  }

  public reset() {
    this.consecutiveDeviations = 0;
  }
}

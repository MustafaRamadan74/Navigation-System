import { useState, useEffect, useRef, useCallback } from 'react';
import { RouteInstruction } from '../types/route';
import { calculateDistanceMeters, calculateBearing } from '../utils/geoMath';
import { DeviationChecker } from '../services/routing/deviationCheck';

export interface LiveLocation {
  coordinates: [number, number]; // [lng, lat]
  heading: number | null;
  speed: number | null; // meters per second
  accuracy: number;
  timestamp: number;
}

interface UseLiveTrackingOptions {
  routeCoordinates?: [number, number][];
  instructions?: RouteInstruction[];
  onDeviationDetected?: (currentPosition: [number, number]) => void;
  deviationThresholdMeters?: number;
}

export function useLiveTracking({
  routeCoordinates = [],
  instructions = [],
  onDeviationDetected,
  deviationThresholdMeters = 50,
}: UseLiveTrackingOptions = {}) {
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<LiveLocation | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const lastPositionRef = useRef<LiveLocation | null>(null);
  const deviationCheckerRef = useRef<DeviationChecker>(
    new DeviationChecker(deviationThresholdMeters, 3)
  );

  // Stop everything
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current !== null) {
      window.clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsLiveActive(false);
    setIsSimulating(false);
    deviationCheckerRef.current.reset();
  }, []);

  // Handle position update
  const handlePositionUpdate = useCallback(
    (pos: LiveLocation) => {
      setCurrentPosition(pos);
      lastPositionRef.current = pos;

      if (instructions && instructions.length > 0) {
        // Find progress in instructions
        setActiveStepIndex((prevIdx) => {
          let currentIdx = prevIdx;
          if (currentIdx >= instructions.length) return currentIdx;

          const targetCoord = instructions[currentIdx].coordinates;
          const dist = calculateDistanceMeters(pos.coordinates, targetCoord);
          setDistanceToNextStep(dist);

          // When within 30 meters of target maneuver, transition to next instruction
          if (dist < 30 && currentIdx < instructions.length - 1) {
            const nextIdx = currentIdx + 1;
            const nextDist = calculateDistanceMeters(pos.coordinates, instructions[nextIdx].coordinates);
            setDistanceToNextStep(nextDist);
            return nextIdx;
          }

          return currentIdx;
        });
      }

      // Check for route deviation
      if (onDeviationDetected && routeCoordinates && routeCoordinates.length > 1) {
        const check = deviationCheckerRef.current.check(pos.coordinates, routeCoordinates);
        if (check.isDeviated) {
          onDeviationDetected(pos.coordinates);
          deviationCheckerRef.current.reset();
        }
      }
    },
    [instructions, onDeviationDetected, routeCoordinates]
  );

  // Start real GPS tracking
  const startLiveTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    stopLiveTracking();
    setError(null);
    setIsLiveActive(true);
    setIsSimulating(false);
    setActiveStepIndex(0);
    deviationCheckerRef.current.reset();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        let heading = position.coords.heading;
        if ((heading === null || isNaN(heading)) && lastPositionRef.current) {
          heading = calculateBearing(
            lastPositionRef.current.coordinates,
            coords
          );
        }

        const liveLoc: LiveLocation = {
          coordinates: coords,
          heading: heading ?? null,
          speed: position.coords.speed ?? null,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        handlePositionUpdate(liveLoc);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );
  }, [stopLiveTracking, handlePositionUpdate]);

  // Start simulation along route coordinates (great for testing)
  const startSimulation = useCallback(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) return;

    stopLiveTracking();
    setError(null);
    setIsLiveActive(true);
    setIsSimulating(true);
    setActiveStepIndex(0);
    deviationCheckerRef.current.reset();

    let index = 0;
    const initialPos: LiveLocation = {
      coordinates: routeCoordinates[0],
      heading: routeCoordinates.length > 1 ? calculateBearing(routeCoordinates[0], routeCoordinates[1]) : 0,
      speed: 13.8, // ~50 km/h
      accuracy: 5,
      timestamp: Date.now(),
    };
    handlePositionUpdate(initialPos);

    simulationIntervalRef.current = window.setInterval(() => {
      index++;
      if (index >= routeCoordinates.length) {
        stopLiveTracking();
        return;
      }

      const prevCoord = routeCoordinates[index - 1];
      const curCoord = routeCoordinates[index];
      const heading = calculateBearing(prevCoord, curCoord);

      const simPos: LiveLocation = {
        coordinates: curCoord,
        heading,
        speed: 14,
        accuracy: 3,
        timestamp: Date.now(),
      };

      handlePositionUpdate(simPos);
    }, 1500);
  }, [routeCoordinates, stopLiveTracking, handlePositionUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, [stopLiveTracking]);

  return {
    isLiveActive,
    isSimulating,
    currentPosition,
    activeStepIndex,
    distanceToNextStep,
    error,
    startLiveTracking,
    startSimulation,
    stopLiveTracking,
  };
}

import ttServices from '@tomtom-international/web-sdk-services';
import { TOMTOM_API_KEY } from '../tomtom/config';
import { TravelMode } from '../../types/route';

export interface TimeSlotOption {
  id: string;
  nameAr: string;
  nameEn: string;
  timeLabel: string;
  targetDate: Date;
  durationSeconds: number;
  diffMinutesFromNow: number; // negative means saves time, positive means slower
  isBest: boolean;
}

export interface DepartureComparisonResult {
  currentDurationSeconds: number;
  slots: TimeSlotOption[];
}

export async function compareDepartureTimes(
  locations: [number, number][],
  currentTravelTimeSeconds: number,
  isArabic: boolean = true,
  travelMode: TravelMode = 'car'
): Promise<DepartureComparisonResult> {
  if (!TOMTOM_API_KEY || locations.length < 2) {
    return { currentDurationSeconds: currentTravelTimeSeconds, slots: [] };
  }

  const now = new Date();
  const baseTomorrow = new Date(now);
  baseTomorrow.setDate(now.getDate() + 1);

  // Time periods definition
  const periods = [
    {
      id: 'early_morning',
      nameAr: 'الصباح الباكر',
      nameEn: 'Early Morning',
      timeLabel: '07:00',
      hour: 7,
      minute: 0,
    },
    {
      id: 'morning_rush',
      nameAr: 'ذروة الصباح',
      nameEn: 'Morning Rush Hour',
      timeLabel: '08:30',
      hour: 8,
      minute: 30,
    },
    {
      id: 'midday',
      nameAr: 'ظهيرة العمل',
      nameEn: 'Midday',
      timeLabel: '13:00',
      hour: 13,
      minute: 0,
    },
    {
      id: 'evening_rush',
      nameAr: 'ذروة المساء',
      nameEn: 'Evening Rush Hour',
      timeLabel: '17:30',
      hour: 17,
      minute: 30,
    },
    {
      id: 'night',
      nameAr: 'ليلاً (طرق سالكة)',
      nameEn: 'Night (Smooth)',
      timeLabel: '21:00',
      hour: 21,
      minute: 0,
    },
  ];

  const results: TimeSlotOption[] = [];

  for (const p of periods) {
    // If the hour has already passed today, test for tomorrow
    const target = new Date();
    target.setHours(p.hour, p.minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    try {
      const response = await ttServices.services.calculateRoute({
        key: TOMTOM_API_KEY,
        locations: locations,
        travelMode: travelMode,
        traffic: travelMode !== 'pedestrian',
        departAt: target.toISOString(),
        computeTravelTimeFor: 'all',
        language: isArabic ? 'ar' : 'en-GB',
      });

      if (response && response.routes && response.routes.length > 0) {
        const duration = response.routes[0].summary.travelTimeInSeconds;
        const diffMinutes = Math.round((duration - currentTravelTimeSeconds) / 60);

        results.push({
          id: p.id,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          timeLabel: p.timeLabel,
          targetDate: target,
          durationSeconds: duration,
          diffMinutesFromNow: diffMinutes,
          isBest: false,
        });
      }
    } catch {
      // Continue next slot if single request fails
    }
  }

  // Find the fastest slot
  if (results.length > 0) {
    let minDuration = Math.min(...results.map((r) => r.durationSeconds));
    results.forEach((r) => {
      if (r.durationSeconds === minDuration) {
        r.isBest = true;
      }
    });

    // Sort by duration ascending (most time saved first)
    results.sort((a, b) => a.durationSeconds - b.durationSeconds);
  }

  return {
    currentDurationSeconds: currentTravelTimeSeconds,
    slots: results,
  };
}

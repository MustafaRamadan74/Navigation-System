export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface GeolocationErrorState {
  code: number;
  message: string;
}

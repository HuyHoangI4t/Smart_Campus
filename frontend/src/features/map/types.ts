export interface LocationItem {
  id: number;
  name: string;
  category: string;
  building: string;
  floor: string;
  description: string;
  lat: number;
  lng: number;
  icon: string;
  x: number;
  y: number;
  color: string;
}

export interface ParsedCampusRoom {
  raw: string;
  buildingNumber: string;
  buildingCode: string;
  buildingName: string;
  floor: string;
  roomNumber: string;
  fullDisplay: string;
  routeGuide: string;
}

export interface CampusPath {
  id: number;
  name: string;
  path_type: 'walkway' | 'main_road' | 'secondary_road' | string;
  coordinates: [number, number][] | [number, number][][] | any;
}

export interface CampusGate {
  id: string;
  name: string;
  gatePoint: [number, number];
  insidePoint: [number, number];
  outsidePoint: [number, number];
}


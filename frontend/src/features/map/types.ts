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


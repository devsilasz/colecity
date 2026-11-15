import type { MapStyleElement } from 'react-native-maps';

/** Estilo escuro neutro do Google Maps (Android), combinando com o tema preto do app. */
export const ESTILO_MAPA_ESCURO: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#151517' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9A9AA0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0C' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2A2A2E' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1B1B1E' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14201A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2A2E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1B1B1E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A3A40' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#202024' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1622' }] },
];

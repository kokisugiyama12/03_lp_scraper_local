export function formatXGeoHeader(lat: number, lng: number): string {
  return `a gl:${lat},${lng} t:ul`;
}

export function circleToPolygon(
  center: [number, number],
  radiusMeters: number,
  steps = 64
): [number, number][] {
  const [lng, lat] = center;
  const coords: [number, number][] = [];

  const R = 6378137;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);

    const dLng = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const dLat = (dy / R) * (180 / Math.PI);

    coords.push([lng + dLng, lat + dLat]);
  }

  return coords;
}

export function bboxToRectangle(sw: [number, number], ne: [number, number]): [number, number][] {
  const [lng1, lat1] = sw;
  const [lng2, lat2] = ne;
  const swp: [number, number] = [Math.min(lng1, lng2), Math.min(lat1, lat2)];
  const nep: [number, number] = [Math.max(lng1, lng2), Math.max(lat1, lat2)];

  const se: [number, number] = [nep[0], swp[1]];
  const nw: [number, number] = [swp[0], nep[1]];

  return [swp, se, nep, nw, swp];
}



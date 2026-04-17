import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const NYC_CENTER = [40.7328, -73.99];
const NYC_ZOOM = 12;

function getMarkerTheme(price) {
  if (price <= 2.5) return { bg: "#22c55e", shadow: "rgba(34,197,94,0.5)" };
  if (price <= 5) return { bg: "#f97316", shadow: "rgba(249,115,22,0.45)" };
  return { bg: "#ef4444", shadow: "rgba(239,68,68,0.5)" };
}

function formatPrice(price) {
  const value = Number(price || 0);
  if (!value) return "?";
  return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
}

function createPriceIcon(place, isActive, isSaved = false) {
  const price = Number(place.standard_slice_price || 0);
  const { bg, shadow } = getMarkerTheme(price);
  const label = formatPrice(price);
  const size = isActive ? 56 : place.active_hangouts_count > 0 ? 46 : 42;
  const fontSize = label.length > 4 ? "10px" : "11px";
  const ring = isActive ? `${bg}55` : isSaved ? "rgba(255,255,255,0.24)" : "transparent";

  return L.divIcon({
    className: "pizza-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          min-width: ${size}px;
          height: ${size - 8}px;
          padding: 0 10px;
          background: ${bg};
          border-radius: 999px;
          border: ${isActive ? "3px" : "2px"} solid white;
          box-shadow: 0 8px 22px ${shadow}, 0 0 0 ${isActive ? "6px" : "3px"} ${ring};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          transform: ${isActive ? "translateY(-2px) scale(1.08)" : "scale(1)"};
        ">
          <span style="
            color: white;
            font-weight: 900;
            font-size: ${fontSize};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: -0.25px;
            line-height: 1;
            text-shadow: 0 1px 2px rgba(0,0,0,0.35);
            white-space: nowrap;
          ">${label}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 8px solid ${bg};
          margin-top: -1px;
          filter: drop-shadow(0 2px 2px ${shadow});
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 4],
    popupAnchor: [0, -(size - 8)],
  });
}

function MapEvents({ onBoundsChange, onMapMove }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      onBoundsChange?.(map.getBounds());
      onMapMove?.();
    };
    map.on("moveend", handler);
    return () => map.off("moveend", handler);
  }, [map, onBoundsChange, onMapMove]);
  return null;
}

function FlyToPlace({ place }) {
  const map = useMap();
  useEffect(() => {
    if (place) map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 15), { duration: 0.65 });
  }, [place, map]);
  return null;
}

function FlyToUser({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location?.lat && location?.lng) map.flyTo([location.lat, location.lng], 15, { duration: 0.75 });
  }, [location, map]);
  return null;
}

function MapInitializer({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
    const resize = () => map.invalidateSize({ animate: false });
    resize();
    const t1 = window.setTimeout(resize, 120);
    const t2 = window.setTimeout(resize, 320);
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", resize);
    };
  }, [map, onMapReady]);
  return null;
}

export default function PizzaMap({
  places,
  selectedPlace,
  savedPlaceIds = [],
  onSelectPlace,
  onBoundsChange,
  onMapMove,
  onMapReady,
  controlsHidden = false,
  mapStyleUrl,
  userLocation,
}) {
  return (
    <MapContainer
      center={NYC_CENTER}
      zoom={NYC_ZOOM}
      className={`h-full w-full map-canvas ${controlsHidden ? "map-ui-hidden" : ""}`}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer key={mapStyleUrl} url={mapStyleUrl} attribution="" />
      <MapEvents onBoundsChange={onBoundsChange} onMapMove={onMapMove} />
      <MapInitializer onMapReady={onMapReady} />
      {selectedPlace && <FlyToPlace place={selectedPlace} />}
      {userLocation && <FlyToUser location={userLocation} />}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={createPriceIcon(place, selectedPlace?.id === place.id, savedPlaceIds.includes(place.id))}
          eventHandlers={{ click: () => onSelectPlace(place) }}
        />
      ))}
    </MapContainer>
  );
}

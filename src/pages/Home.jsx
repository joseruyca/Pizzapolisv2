import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, List } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PizzaMap from "@/components/map/PizzaMap";
import SearchFilters from "@/components/map/SearchFilters";
import PlacePanel from "@/components/place/PlacePanel";
import PlaceListPanel from "@/components/map/PlaceListPanel";
import AddPinModal from "@/components/map/AddPinModal";
import LoginPrompt from "@/components/shared/LoginPrompt";
import PinPopup from "@/components/map/PinPopup";
import { getValueLabel, isOpenNow } from "@/lib/place-helpers";
import { MAP_STYLES } from "@/lib/constants";

export default function Home() {
  const { user } = useAuth();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [previewPlace, setPreviewPlace] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [sheetSort, setSheetSort] = useState("value");
  const [sheetSortDirection, setSheetSortDirection] = useState("asc");
  const [addPinOpen, setAddPinOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [mapStyle] = useState("dark");
  const [mapBounds, setMapBounds] = useState(null);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [useMapArea, setUseMapArea] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    boroughs: [],
    prices: [],
    categories: [],
    sortBy: "",
    cheapOnly: false,
    valueOnly: false,
    openNow: false,
    lateNight: false,
    featuredOnly: false,
  });

  const { data: places = [] } = useQuery({
    queryKey: ["places"],
    queryFn: () => base44.entities.PizzaPlace.filter({ status: "active" }),
  });

  const { data: activeHangouts = [] } = useQuery({
    queryKey: ["active-hangouts"],
    queryFn: () => base44.entities.Quedada.filter({ estado: "activa" }, "fecha_hora"),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.email || "guest"],
    queryFn: () => (user?.email ? base44.entities.Favorite.filter({ user_email: user.email }) : []),
  });

  const favoriteIds = useMemo(() => favorites.map((item) => item.place_id).filter(Boolean), [favorites]);

  const hangoutsByPlace = useMemo(() => {
    const map = {};
    activeHangouts.forEach((hangout) => {
      const key = hangout.pizzeria_id || hangout.pizza_place_id;
      if (!key) return;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [activeHangouts]);

  const enrichedPlaces = useMemo(
    () =>
      places.map((place) => ({
        ...place,
        active_hangouts_count: hangoutsByPlace[place.id] || 0,
      })),
    [places, hangoutsByPlace],
  );

  const filteredPlaces = useMemo(() => {
    let result = [...enrichedPlaces];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.neighborhood?.toLowerCase().includes(q) ||
          p.borough?.toLowerCase().includes(q) ||
          p.best_known_slice?.toLowerCase().includes(q),
      );
    }
    if (filters.boroughs?.length) result = result.filter((p) => filters.boroughs.includes(p.borough));
    if (filters.prices?.length) result = result.filter((p) => filters.prices.includes(p.price_range));
    if (filters.categories?.length) result = result.filter((p) => filters.categories.includes(p.category));
    if (filters.cheapOnly) result = result.filter((p) => Number(p.standard_slice_price || 0) <= 3.5);
    if (filters.valueOnly) result = result.filter((p) => ["Steal", "Best budget", "Worth it"].includes(getValueLabel(p)));
    if (filters.openNow) result = result.filter((p) => isOpenNow(p.hours));
    if (filters.lateNight) result = result.filter((p) => /AM/i.test(p.hours || "") || /late/i.test(`${p.category || ""} ${p.description || ""}`));
    if (filters.featuredOnly) result = result.filter((p) => Boolean(p.featured));
    if (filters.sortBy === "rating") result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    if (filters.sortBy === "featured") result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    if (filters.sortBy === "price_low") result.sort((a, b) => Number(a.standard_slice_price || 0) - Number(b.standard_slice_price || 0));
    if (useMapArea && mapBounds) result = result.filter((p) => mapBounds.contains([p.latitude, p.longitude]));
    return result;
  }, [enrichedPlaces, filters, useMapArea, mapBounds]);

  const handleAddPin = () => {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    setAddPinOpen(true);
  };

  const currentMapStyle = MAP_STYLES.find((style) => style.id === mapStyle) || MAP_STYLES[0];

  return (
    <>
      <section className="home-screen">
        <div className="absolute inset-0 overflow-hidden">
          <PizzaMap
            places={filteredPlaces}
            selectedPlace={selectedPlace || previewPlace}
            savedPlaceIds={favoriteIds}
            onSelectPlace={(place) => {
              setPreviewPlace(place);
              setListOpen(false);
            }}
            onBoundsChange={setMapBounds}
            onMapMove={() => setHasMapMoved(true)}
            controlsHidden={Boolean(selectedPlace)}
            mapStyleUrl={currentMapStyle.url}
            userLocation={userLocation}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_72%,rgba(223,91,67,0.22),transparent_0,transparent_24%),linear-gradient(180deg,rgba(8,8,8,0.08)_0%,rgba(8,8,8,0.22)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(8,8,8,0.56)_0%,rgba(8,8,8,0)_100%)]" />
        </div>

        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onLocateMe={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                setListOpen(false);
              });
            }
          }}
          hasMapMoved={hasMapMoved}
          usingMapArea={useMapArea}
          onSearchArea={(mode) => {
            if (mode === "disable") setUseMapArea(false);
            else if (mode === "enable") setUseMapArea(true);
            else setUseMapArea((prev) => !prev);
          }}
        />

        <button
          onClick={handleAddPin}
          className="home-map-fab"
          aria-label="Add Spot"
        >
          <MapPin className="h-4 w-4" />
          <span className="text-[12px] font-bold">Add Spot</span>
        </button>

        <button
          onClick={() => setListOpen((prev) => !prev)}
          className="home-map-count md:hidden"
        >
          <List className="h-4 w-4" />
          <span>{filteredPlaces.length} sitios</span>
        </button>

        <PlaceListPanel
          places={filteredPlaces}
          open={listOpen && !selectedPlace}
          onToggle={() => setListOpen(!listOpen)}
          onSelectPlace={(place) => {
            setSelectedPlace(place);
            setPreviewPlace(null);
            setListOpen(false);
          }}
          selectedId={selectedPlace?.id}
          sortMode={sheetSort}
          onSortModeChange={setSheetSort}
          sortDirection={sheetSortDirection}
          onSortDirectionChange={setSheetSortDirection}
        />

        {selectedPlace && <PlacePanel place={selectedPlace} onClose={() => setSelectedPlace(null)} user={user} />}
        <AddPinModal open={addPinOpen} onClose={() => setAddPinOpen(false)} user={user} />
        <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} message="Sign in to create and join pizza hangouts with friends." />
      </section>

      <PinPopup
        place={previewPlace}
        onClose={() => setPreviewPlace(null)}
        onViewDetails={() => {
          setSelectedPlace(previewPlace);
          setPreviewPlace(null);
        }}
      />
    </>
  );
}

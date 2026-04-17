import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import PizzaMap from "../components/map/PizzaMap";
import SearchFilters from "../components/map/SearchFilters";
import PlacePanel from "../components/place/PlacePanel";
import PlaceListPanel from "../components/map/PlaceListPanel";
import AddPinModal from "../components/map/AddPinModal";
import LoginPrompt from "../components/shared/LoginPrompt";
import PinPopup from "../components/map/PinPopup";
import MapBottomNav from "../components/map/MapBottomNav";
import { Coins, MapPin, Flame, Users } from "lucide-react";
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
  const [mapInstance, setMapInstance] = useState(null);
  const [mapStyle, setMapStyle] = useState("dark");
  const [mapSettings, setMapSettings] = useState({ showOverview: false, styleId: "dark" });
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
    queryFn: () => user?.email ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
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

  const enrichedPlaces = useMemo(() => places.map((place) => ({
    ...place,
    active_hangouts_count: hangoutsByPlace[place.id] || 0,
  })), [places, hangoutsByPlace]);

  const filteredPlaces = useMemo(() => {
    let result = [...enrichedPlaces];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.borough?.toLowerCase().includes(q) ||
        p.best_known_slice?.toLowerCase().includes(q)
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
    if (useMapArea && mapBounds) {
      result = result.filter((p) => mapBounds.contains([p.latitude, p.longitude]));
    }
    return result;
  }, [enrichedPlaces, filters, useMapArea, mapBounds]);

  const cheapestPrice = useMemo(() => {
    const priced = filteredPlaces.filter((p) => Number(p.standard_slice_price) > 0);
    if (!priced.length) return "—";
    return `$${Math.min(...priced.map((p) => Number(p.standard_slice_price))).toFixed(2)}`;
  }, [filteredPlaces]);

  const openCount = useMemo(() => filteredPlaces.filter((p) => isOpenNow(p.hours)).length, [filteredPlaces]);
  const hangoutCount = useMemo(() => filteredPlaces.reduce((sum, place) => sum + Number(place.active_hangouts_count || 0), 0), [filteredPlaces]);

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
      <div className="relative h-[calc(100vh-56px)] w-full overflow-hidden pb-24 sm:pb-0">
        <PizzaMap
          places={filteredPlaces}
          selectedPlace={selectedPlace || previewPlace}
          savedPlaceIds={favoriteIds}
          onSelectPlace={(place) => {
            setPreviewPlace(place);
            setListOpen(false);
          }}
          onMapReady={setMapInstance}
          onBoundsChange={setMapBounds}
          onMapMove={() => setHasMapMoved(true)}
          controlsHidden={Boolean(selectedPlace)}
          mapStyleUrl={currentMapStyle.url}
          userLocation={userLocation}
        />

        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={filteredPlaces.length}
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

        {false && mapSettings.showOverview && !selectedPlace && !previewPlace && (
          <div className="absolute top-[106px] left-4 right-4 sm:left-auto sm:right-4 sm:w-[300px] z-[560] pointer-events-none">
            <div className="pointer-events-auto rounded-3xl border border-white/10 bg-[#0d0d0d]/84 backdrop-blur-xl shadow-2xl shadow-black/50 p-4 text-white hidden sm:block">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500 font-bold">Current view</div>
                  <h2 className="text-lg font-black leading-tight mt-1">Pizzapolis map</h2>
                </div>
                {useMapArea && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-300">This area</span>}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold uppercase tracking-[0.12em]"><MapPin className="w-3.5 h-3.5" />Spots</div>
                  <div className="text-xl font-black mt-1">{filteredPlaces.length}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold uppercase tracking-[0.12em]"><Coins className="w-3.5 h-3.5" />Cheapest</div>
                  <div className="text-xl font-black mt-1">{cheapestPrice}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold uppercase tracking-[0.12em]"><Flame className="w-3.5 h-3.5" />Open now</div>
                  <div className="text-xl font-black mt-1">{openCount}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-semibold uppercase tracking-[0.12em]"><Users className="w-3.5 h-3.5" />Hangouts</div>
                  <div className="text-xl font-black mt-1">{hangoutCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleAddPin}
          className="absolute right-4 bottom-28 z-[650] flex h-14 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-white shadow-[0_14px_34px_rgba(220,38,38,0.45)] hover:bg-red-500"
          aria-label="Add Spot"
        >
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-bold">Add Spot</span>
        </button>

        <MapBottomNav onAddPin={handleAddPin} />

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
      </div>

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

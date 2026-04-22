import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, MapPin } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import PizzaMap from "@/components/map/PizzaMap";
import SearchFilters from "@/components/map/SearchFilters";
import PlacePanel from "@/components/place/PlacePanel";
import PlaceListPanel from "@/components/map/PlaceListPanel";
import AddPinModal from "@/components/map/AddPinModal";
import LoginPrompt from "@/components/shared/LoginPrompt";
import PinPopup from "@/components/map/PinPopup";
import { getValueLabel, isOpenNow } from "@/lib/place-helpers";
import { MAP_STYLES } from "@/lib/constants";

async function resolveSpotPhoto(value) {
  if (!value) return null;
  if (String(value).startsWith("http")) return value;
  const { data } = await supabase.storage.from("spot-photos").createSignedUrl(value, 60 * 60);
  return data?.signedUrl || null;
}

function normalizeSpot(row) {
  return {
    ...row,
    latitude: Number(row.lat ?? 0),
    longitude: Number(row.lng ?? 0),
    standard_slice_price: Number(row.slice_price ?? 0),
    best_known_slice: row.best_slice ?? "",
    average_rating: Number(row.average_rating ?? 0),
    ratings_count: Number(row.ratings_count ?? 0),
    neighborhood: row.address || "NYC",
    borough: "",
    description: row.quick_note || "",
    quick_note: row.quick_note || "",
  };
}

async function fetchPlaces() {
  const { data, error } = await supabase
    .from("spots")
    .select("id,name,address,lat,lng,slice_price,best_slice,quick_note,photo_url,status,created_by,average_rating,ratings_count")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = await Promise.all((data || []).map(async (row) => ({ ...row, photo_url: await resolveSpotPhoto(row.photo_url) })));
  return rows.map(normalizeSpot);
}

async function fetchActivePlanCounts() {
  const { data, error } = await supabase
    .from("plans")
    .select("id,spot_id")
    .eq("status", "active");
  if (error) throw error;
  return data || [];
}

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
    queryKey: ['places-supabase'],
    queryFn: fetchPlaces,
    enabled: Boolean(isSupabaseConfigured && supabase),
  });

  const { data: activePlans = [] } = useQuery({
    queryKey: ["active-plan-counts"],
    queryFn: fetchActivePlanCounts,
    enabled: Boolean(isSupabaseConfigured && supabase),
  });

  const mergedPlaces = useMemo(() => {
    const existing = new Map((places || []).map((place) => [String(place.name).toLowerCase(), place]));
    const fallback = fallbackRealSpots.filter((spot) => !existing.has(String(spot.name).toLowerCase())).map((spot) => normalizeSpot({ ...spot, photo_url: null }));
    return [...(places || []), ...fallback].slice(0, Math.max((places || []).length, 10));
  }, [places]);

  const hangoutsByPlace = useMemo(() => {
    const map = {};
    activePlans.forEach((plan) => {
      if (!plan.spot_id) return;
      map[plan.spot_id] = (map[plan.spot_id] || 0) + 1;
    });
    return map;
  }, [activePlans]);

  const enrichedPlaces = useMemo(
    () => mergedPlaces.map((place) => ({ ...place, active_hangouts_count: hangoutsByPlace[place.id] || 0 })),
    [mergedPlaces, hangoutsByPlace],
  );

  const filteredPlaces = useMemo(() => {
    let result = [...enrichedPlaces];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.neighborhood?.toLowerCase().includes(q) ||
          p.borough?.toLowerCase().includes(q) ||
          p.best_known_slice?.toLowerCase().includes(q),
      );
    }
    if (filters.boroughs?.length) result = result.filter((p) => filters.boroughs.includes(p.borough));
    if (filters.cheapOnly) result = result.filter((p) => Number(p.standard_slice_price || 0) <= 3.5);
    if (filters.valueOnly) result = result.filter((p) => ["Steal", "Best budget", "Worth it"].includes(getValueLabel(p)));
    if (filters.openNow) result = result.filter((p) => isOpenNow(p.hours));
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
        <div className="home-map-shell">
          <div className="home-map-layer">
            <PizzaMap
              places={filteredPlaces}
              selectedPlace={selectedPlace || previewPlace}
              savedPlaceIds={[]}
              onSelectPlace={(place) => {
                setSelectedPlace(null);
                setPreviewPlace(place);
                setListOpen(false);
              }}
              onBoundsChange={setMapBounds}
              onMapMove={() => setHasMapMoved(true)}
              controlsHidden={Boolean(selectedPlace)}
              mapStyleUrl={currentMapStyle.url}
              userLocation={userLocation}
            />
            <div className="home-map-gradient" />
            <div className="home-map-topshade" />
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

          <button onClick={() => setListOpen((prev) => !prev)} className="home-map-count md:hidden">
            <List className="h-4 w-4" />
            <span>{filteredPlaces.length} spots</span>
          </button>

          <button onClick={handleAddPin} className="home-map-fab" aria-label="Add Spot">
            <MapPin className="h-5 w-5" />
            <span className="home-map-fab-label">Add Spot</span>
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
          <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} message="Sign in to create and join pizza plans." />
        </div>
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

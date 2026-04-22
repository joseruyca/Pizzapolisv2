const explicitRoutes: Record<string, string> = {
  Landing: '/landing',
  Home: '/home',
  Descubrir: '/descubrir',
  CrearQuedada: '/crearquedada',
  MisMatches: '/mismatches',
  Profile: '/profile',
  Admin: '/admin',
  SettingsPage: '/settings',
  NotificationsSettings: '/settings/notifications',
  LanguageSettings: '/settings/language',
  LocationSettings: '/settings/location',
  PrivacySettings: '/settings/privacy',
  AccountSettings: '/settings/account',
  SupportPage: '/support',
};

export function createPageUrl(pageName: string) {
  return explicitRoutes[pageName] || `/${pageName.replace(/\s+/g, '').toLowerCase()}`;
}

export const fallbackRealSpots = [
  { id: 'fallback-joes', name: "Joe's Pizza", address: '7 Carmine St, New York, NY', lat: 40.7306, lng: -73.9975, slice_price: 3.5, best_slice: 'Cheese Slice', average_rating: 4.5, ratings_count: 18, quick_note: 'Classic Village slice that still feels dependable.', status: 'approved' },
  { id: 'fallback-scarrs', name: "Scarr's Pizza", address: '35 Orchard St, New York, NY', lat: 40.7153, lng: -73.9891, slice_price: 4.75, best_slice: 'Cheese Slice', average_rating: 4.7, ratings_count: 26, quick_note: 'Lower East Side stop with stronger quality than pure budget.', status: 'approved' },
  { id: 'fallback-2bros', name: '2 Bros Pizza', address: '32 St Marks Pl, New York, NY', lat: 40.7281, lng: -73.9872, slice_price: 1.5, best_slice: 'Cheese Slice', average_rating: 4.0, ratings_count: 14, quick_note: 'Ultra-budget fallback when price matters most.', status: 'approved' },
  { id: 'fallback-prince', name: 'Prince Street Pizza', address: '27 Prince St, New York, NY', lat: 40.7231, lng: -73.9947, slice_price: 6.5, best_slice: 'Spicy Spring', average_rating: 4.8, ratings_count: 35, quick_note: 'Premium square slice people still queue for.', status: 'approved' },
  { id: 'fallback-lindustrie', name: "L'Industrie Pizza", address: '254 S 2nd St, Brooklyn, NY', lat: 40.7116, lng: -73.9577, slice_price: 5.0, best_slice: 'Burrata Slice', average_rating: 4.9, ratings_count: 29, quick_note: 'Expensive, but still one of the strongest worth-it stops.', status: 'approved' },
  { id: 'fallback-robertas', name: "Roberta's", address: '261 Moore St, Brooklyn, NY', lat: 40.7051, lng: -73.9339, slice_price: 4.5, best_slice: 'Margherita', average_rating: 4.6, ratings_count: 21, quick_note: 'Good Bushwick choice when you want a nicer slice night.', status: 'approved' },
  { id: 'fallback-rosas', name: "Rosa's Pizza", address: '41-08 Main St, Queens, NY', lat: 40.758, lng: -73.8301, slice_price: 3.0, best_slice: 'Cheese Slice', average_rating: 4.2, ratings_count: 9, quick_note: 'Cheap practical Queens option.', status: 'approved' },
  { id: 'fallback-mamastoo', name: "Mama's TOO!", address: '2750 Broadway, New York, NY', lat: 40.8009, lng: -73.9663, slice_price: 5.75, best_slice: 'Cacio e pepe square', average_rating: 4.8, ratings_count: 24, quick_note: 'High-quality square slice on the Upper West Side.', status: 'approved' },
  { id: 'fallback-bestpizza', name: 'Best Pizza', address: '33 Havemeyer St, Brooklyn, NY', lat: 40.7187, lng: -73.9619, slice_price: 3.75, best_slice: 'White slice', average_rating: 4.4, ratings_count: 17, quick_note: 'Reliable Williamsburg stop without premium pricing.', status: 'approved' },
  { id: 'fallback-newluigis', name: "New Luigi's Pizza", address: '31-01 36th Ave, Queens, NY', lat: 40.7642, lng: -73.9235, slice_price: 2.75, best_slice: 'Cheese Slice', average_rating: 4.3, ratings_count: 13, quick_note: 'Astoria value play that stays under the radar.', status: 'approved' },
] as const;

const explicitRoutes: Record<string, string> = {
  Landing: '/landing',
  Home: '/home',
  Descubrir: '/descubrir',
  CrearQuedada: '/crearquedada',
  MisMatches: '/mismatches',
  Profile: '/profile',
  Admin: '/admin',
  Favorites: '/favorites',
  Trending: '/trending',
  MyLists: '/mylists',
  Stats: '/stats',
  Recomendaciones: '/recomendaciones',
  Leaderboards: '/leaderboards',
  Guides: '/guides',
};

export function createPageUrl(pageName: string) {
  return explicitRoutes[pageName] || `/${pageName.replace(/\s+/g, '').toLowerCase()}`;
}

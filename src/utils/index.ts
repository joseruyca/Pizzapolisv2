export const explicitRoutes: Record<string, string> = {
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

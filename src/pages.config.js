import Landing from './pages/Landing';
import Home from './pages/Home';
import Descubrir from './pages/Descubrir';
import CrearQuedada from './pages/CrearQuedada';
import MisMatches from './pages/MisMatches';
import Profile from './pages/Profile';
import RecentActivity from './pages/RecentActivity';
import SavedPlans from './pages/SavedPlans';
import FriendsPage from './pages/FriendsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsSettings from './pages/NotificationsSettings';
import LanguageSettings from './pages/LanguageSettings';
import LocationSettings from './pages/LocationSettings';
import PrivacySettings from './pages/PrivacySettings';
import AccountSettings from './pages/AccountSettings';
import SupportPage from './pages/SupportPage';
import __Layout from './Layout.jsx';

export const PAGES = {
  Landing,
  Home,
  Descubrir,
  CrearQuedada,
  MisMatches,
  Profile,
  RecentActivity,
  SavedPlans,
  FriendsPage,
  SettingsPage,
  NotificationsSettings,
  LanguageSettings,
  LocationSettings,
  PrivacySettings,
  AccountSettings,
  SupportPage,
};

export const pagesConfig = {
  mainPage: 'Landing',
  Pages: PAGES,
  Layout: __Layout,
};

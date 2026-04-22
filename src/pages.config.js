import Landing from './pages/Landing';
import Home from './pages/Home';
import Descubrir from './pages/Descubrir';
import CrearQuedada from './pages/CrearQuedada';
import MisMatches from './pages/MisMatches';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import NotificationsSettings from './pages/NotificationsSettings';
import LanguageSettings from './pages/LanguageSettings';
import PrivacySettings from './pages/PrivacySettings';
import AccountSettings from './pages/AccountSettings';
import __Layout from './Layout.jsx';

export const PAGES = {
  Landing,
  Home,
  Descubrir,
  CrearQuedada,
  MisMatches,
  Profile,
  SettingsPage,
  NotificationsSettings,
  LanguageSettings,
  PrivacySettings,
  AccountSettings,
};

export const pagesConfig = {
  mainPage: 'Landing',
  Pages: PAGES,
  Layout: __Layout,
};

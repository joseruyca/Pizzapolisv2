import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthPage from './pages/Auth';
import AuthConfirm from './pages/AuthConfirm';
import Favorites from './pages/Favorites';
import Trending from './pages/Trending';
import Admin from './pages/Admin';
import MyLists from './pages/MyLists';
import Stats from './pages/Stats';
import Recomendaciones from './pages/Recomendaciones';
import Leaderboards from './pages/Leaderboards';
import Guides from './pages/Guides';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

function LoadingScreen() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#080808]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-700 border-t-red-500" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return children;
}

const PUBLIC_PAGES = new Set(['Landing', 'Home', 'Descubrir']);

function AdminRoute({ children }) {
  const { role, isLoadingAuth, isProfileReady, isAuthenticated } = useAuth();
  if (isLoadingAuth || (isAuthenticated && !isProfileReady)) return <LoadingScreen />;
  if (role !== 'admin') return <Navigate to="/home" replace />;
  return children;
}

function ProtectedPage({ pageName, Component }) {
  return (
    <ProtectedRoute>
      <LayoutWrapper currentPageName={pageName}>
        <Component />
      </LayoutWrapper>
    </ProtectedRoute>
  );
}

const lowerAlias = (path) => `/${path.toLowerCase()}`;
const kebabAlias = (path) => '/' + path.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/confirm" element={<AuthConfirm />} />
    <Route path="/" element={<Navigate to={lowerAlias(mainPageKey)} replace />} />
    <Route path={lowerAlias(mainPageKey)} element={PUBLIC_PAGES.has(mainPageKey) ? (<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>) : (<ProtectedPage pageName={mainPageKey} Component={MainPage} />)} />
    <Route path={`/${mainPageKey}`} element={<Navigate to={lowerAlias(mainPageKey)} replace />} />
    {Object.entries(Pages).map(([path, Page]) => (
      <React.Fragment key={path}>
        <Route
          path={lowerAlias(path)}
          element={PUBLIC_PAGES.has(path) ? (
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          ) : (
            <ProtectedPage pageName={path} Component={Page} />
          )}
        />
        <Route path={kebabAlias(path)} element={<Navigate to={lowerAlias(path)} replace />} />
        <Route path={`/${path}`} element={<Navigate to={lowerAlias(path)} replace />} />
        <Route path={`/${path.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`} element={<Navigate to={lowerAlias(path)} replace />} />
      </React.Fragment>
    ))}
    <Route path="/favorites" element={<ProtectedPage pageName="Favorites" Component={Favorites} />} />
    <Route path="/Favorites" element={<Navigate to="/favorites" replace />} />
    <Route path="/trending" element={<LayoutWrapper currentPageName="Trending"><Trending /></LayoutWrapper>} />
    <Route path="/Trending" element={<Navigate to="/trending" replace />} />
    <Route path="/admin" element={<ProtectedRoute><AdminRoute><LayoutWrapper currentPageName="Admin"><Admin /></LayoutWrapper></AdminRoute></ProtectedRoute>} />
    <Route path="/Admin" element={<Navigate to="/admin" replace />} />
    <Route path="/mylists" element={<ProtectedPage pageName="MyLists" Component={MyLists} />} />
    <Route path="/MyLists" element={<Navigate to="/mylists" replace />} />
    <Route path="/stats" element={<ProtectedPage pageName="Stats" Component={Stats} />} />
    <Route path="/Stats" element={<Navigate to="/stats" replace />} />
    <Route path="/recomendaciones" element={<LayoutWrapper currentPageName="Recomendaciones"><Recomendaciones /></LayoutWrapper>} />
    <Route path="/Recomendaciones" element={<Navigate to="/recomendaciones" replace />} />
    <Route path="/leaderboards" element={<LayoutWrapper currentPageName="Leaderboards"><Leaderboards /></LayoutWrapper>} />
    <Route path="/Leaderboards" element={<Navigate to="/leaderboards" replace />} />
    <Route path="/guides" element={<LayoutWrapper currentPageName="Guides"><Guides /></LayoutWrapper>} />
    <Route path="/mis-matches" element={<Navigate to="/mismatches" replace />} />
    <Route path="/crear-quedada" element={<Navigate to="/crearquedada" replace />} />
    <Route path="/settings" element={<Navigate to="/settingspage" replace />} />
    <Route path="/Guides" element={<Navigate to="/guides" replace />} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

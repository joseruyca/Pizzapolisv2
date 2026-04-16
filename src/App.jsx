import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthPage from './pages/Auth';
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
  const { role, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <LoadingScreen />;
  if (role !== 'admin') return <Navigate to="/Home" replace />;
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

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<Navigate to={`/${mainPageKey}`} replace />} />
    <Route
      path={`/${mainPageKey}`}
      element={
        PUBLIC_PAGES.has(mainPageKey) ? (
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        ) : (
          <ProtectedPage pageName={mainPageKey} Component={MainPage} />
        )
      }
    />
    {Object.entries(Pages).map(([path, Page]) => (
      <Route
        key={path}
        path={`/${path}`}
        element={
          PUBLIC_PAGES.has(path) ? (
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          ) : (
            <ProtectedPage pageName={path} Component={Page} />
          )
        }
      />
    ))}
    <Route path="/Favorites" element={<ProtectedPage pageName="Favorites" Component={Favorites} />} />
    <Route path="/Trending" element={<LayoutWrapper currentPageName="Trending"><Trending /></LayoutWrapper>} />
    <Route
      path="/Admin"
      element={
        <ProtectedRoute>
          <AdminRoute>
            <LayoutWrapper currentPageName="Admin">
              <Admin />
            </LayoutWrapper>
          </AdminRoute>
        </ProtectedRoute>
      }
    />
    <Route path="/MyLists" element={<ProtectedPage pageName="MyLists" Component={MyLists} />} />
    <Route path="/Stats" element={<ProtectedPage pageName="Stats" Component={Stats} />} />
    <Route path="/Recomendaciones" element={<LayoutWrapper currentPageName="Recomendaciones"><Recomendaciones /></LayoutWrapper>} />
    <Route path="/Leaderboards" element={<LayoutWrapper currentPageName="Leaderboards"><Leaderboards /></LayoutWrapper>} />
    <Route path="/Guides" element={<LayoutWrapper currentPageName="Guides"><Guides /></LayoutWrapper>} />
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

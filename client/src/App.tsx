import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import nprogress from 'nprogress';
import 'nprogress/nprogress.css';
import Navbar from './components/layout/Navbar';
import AdminNavbar from './components/layout/AdminNavbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import BackToTop from './components/common/BackToTop';
import SupportChat from './components/common/SupportChat';
import { useAuth } from './context/AuthContext';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Search = lazy(() => import('./pages/Search'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Profile = lazy(() => import('./pages/Profile'));
const ActivityHistory = lazy(() => import('./pages/ActivityHistory'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Configure nprogress
nprogress.configure({ showSpinner: false, speed: 500, minimum: 0.2 });

const PageLoader = () => {
  const { theme } = useAuth();
  return (
    <div className={`flex items-center justify-center h-[70vh] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
      </div>
    </div>
  );
};

function App() {
  const { user, loading, theme } = useAuth();
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    window.scrollTo({ top: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      nprogress.done();
    }, 200);
    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [location.pathname, location.search]);

  if (loading) return (
    <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">MovieZone Loading...</p>
      </div>
    </div>
  );

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className={`flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-dark'}`}>
      {isAdminPath ? <AdminNavbar /> : <Navbar />}
      <main className={`flex-grow w-full max-w-full overflow-x-hidden ${isAdminPath ? 'pt-20' : 'pt-16'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/movie/tv/:id" element={<MovieDetail />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/activity" element={<ActivityHistory />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <BackToTop />
      <SupportChat />
      {!isAdminPath && <Footer />}
    </div>
  );
}

export default App;

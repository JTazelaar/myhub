import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/PublicLayout';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import PastResults from './pages/PastResults';
import PlayerProfile from './pages/PlayerProfile';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminSeason from './pages/admin/AdminSeason';
import AdminEventsList from './pages/admin/AdminEventsList';
import Step1Create from './pages/admin/EventWizard/Step1Create';
import Step2Segments from './pages/admin/EventWizard/Step2Segments';
import Step3Foursomes from './pages/admin/EventWizard/Step3Foursomes';
import Step4Scores from './pages/admin/EventWizard/Step4Scores';
import Step5Points from './pages/admin/EventWizard/Step5Points';
import RequireAdmin from './pages/admin/RequireAdmin';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/results" element={<PastResults />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminEventsList />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="season" element={<AdminSeason />} />
          <Route path="events" element={<AdminEventsList />} />
          <Route path="events/new" element={<Step1Create />} />
          <Route path="events/:id/segments" element={<Step2Segments />} />
          <Route path="events/:id/foursomes" element={<Step3Foursomes />} />
          <Route path="events/:id/scores" element={<Step4Scores />} />
          <Route path="events/:id/points" element={<Step5Points />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

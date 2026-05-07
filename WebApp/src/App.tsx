import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AppLayout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import ActiveWorkout from "./pages/ActiveWorkout";
import Community from "./pages/Community";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import Nutrition from "./pages/Nutrition";
import Ranks from "./pages/Ranks";
import Settings from "./pages/Settings";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import Workouts from "./pages/Workouts";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="screen-loader">Loading Peak Lift...</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/workout/:id" element={<ActiveWorkout />} />
        <Route path="/workout/build/:id" element={<WorkoutBuilder />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/community" element={<Community />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/ranks" element={<Ranks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

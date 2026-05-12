import { BarChart3, Dumbbell, Grid2X2, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: Grid2X2,
    activePaths: ["/dashboard"],
  },
  {
    path: "/workouts",
    label: "Workouts",
    icon: Dumbbell,
    activePaths: ["/workouts", "/workout"],
    featured: true,
  },
  {
    path: "/ranks",
    label: "Progress",
    icon: BarChart3,
    activePaths: ["/ranks", "/feed", "/community"],
  },
  {
    path: "/settings",
    label: "Profile",
    icon: UserRound,
    activePaths: ["/settings", "/privacy", "/terms"],
  },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <main className="content">
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.activePaths.some((path) => location.pathname.startsWith(path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`mobile-link ${item.featured ? "featured" : ""} ${isActive ? "active" : ""}`}
            >
              <Icon size={item.featured ? 35 : 32} strokeWidth={2.4} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

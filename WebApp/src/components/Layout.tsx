import { Activity, Dumbbell, Home, LogOut, MessageSquare, Settings, Trophy, Users, Utensils } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/workouts", label: "Workouts", icon: Dumbbell },
  { path: "/feed", label: "Feed", icon: MessageSquare },
  { path: "/nutrition", label: "Nutrition", icon: Utensils },
  { path: "/community", label: "Community", icon: Users },
  { path: "/ranks", label: "Ranks", icon: Trophy },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Activity size={22} /></span>
          <span>Peak Lift</span>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{profile?.photoURL || user?.photoURL ? <img src={profile?.photoURL || user?.photoURL || ""} alt="" /> : (profile?.username || user?.email || "P").slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{profile?.username || user?.displayName || "Peak Lifter"}</strong>
            <small>{user?.isAnonymous ? "Guest account" : user?.email}</small>
          </div>
          <Button variant="ghost" onClick={logout} aria-label="Sign out">
            <LogOut size={18} />
          </Button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

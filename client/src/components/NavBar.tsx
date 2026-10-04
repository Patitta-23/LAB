import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../api";

// ── Role badge colors per ui-spec.md §2 ─────────────────────────────────

const ROLE_BADGE: Record<UserRole, { bg: string; color: string; label: string }> = {
  Requester:     { bg: "#E8F5EF", color: "#2D7A5B", label: "Requester" },
  IT_Staff:      { bg: "#EAF4FE", color: "#1A6FAC", label: "IT Staff" },
  Administrator: { bg: "#F3E8FE", color: "#7C3AED", label: "Admin" },
};

// ── Nav links by role ────────────────────────────────────────────────────

interface NavLink {
  label: string;
  page: string;
}

const ROLE_NAV_LINKS: Record<UserRole, NavLink[]> = {
  Requester:     [{ label: "My Tickets", page: "list" }, { label: "Create Ticket", page: "create" }],
  IT_Staff:      [{ label: "Ticket Queue", page: "it-queue" }],
  Administrator: [{ label: "User Management", page: "admin-users" }],
};

// ── Props ────────────────────────────────────────────────────────────────

interface NavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────

export default function NavBar({ currentPage, onNavigate }: NavBarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const badge = ROLE_BADGE[user.role];
  const navLinks = ROLE_NAV_LINKS[user.role];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      onNavigate("login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <button style={styles.logo} onClick={() => onNavigate(navLinks[0].page)}>
          🎫 <span style={styles.logoText}>TokTickIT</span>
        </button>

        {/* Desktop nav links */}
        <div style={styles.links}>
          {navLinks.map((link) => (
            <button
              key={link.page}
              style={{
                ...styles.navBtn,
                ...(currentPage === link.page ? styles.navBtnActive : {}),
              }}
              onClick={() => onNavigate(link.page)}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: role badge + user + logout */}
        <div style={styles.right}>
          <span
            style={{
              ...styles.roleBadge,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
          <span style={styles.userName}>{user.name}</span>
          <button
            id="navbar-logout-btn"
            style={{ ...styles.logoutBtn, opacity: loggingOut ? 0.6 : 1 }}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>

          {/* Mobile hamburger */}
          <button
            style={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map((link) => (
            <button
              key={link.page}
              style={styles.mobileLink}
              onClick={() => { onNavigate(link.page); setMenuOpen(false); }}
            >
              {link.label}
            </button>
          ))}
          <button style={styles.mobileLogout} onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #D0DED8",
    boxShadow: "0 1px 8px rgba(45,122,91,0.08)",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 1.25rem",
    height: 60,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logo: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#2D7A5B",
    padding: 0,
  },
  logoText: {
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  links: {
    display: "flex",
    gap: "0.25rem",
    flex: 1,
  },
  navBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.4rem 0.9rem",
    borderRadius: 8,
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#6B7C74",
    transition: "all 0.15s ease",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  navBtnActive: {
    background: "#E8F5EF",
    color: "#2D7A5B",
    fontWeight: 600,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginLeft: "auto",
  },
  roleBadge: {
    padding: "0.2rem 0.65rem",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#1A2E26",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    whiteSpace: "nowrap" as const,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #D0DED8",
    borderRadius: 8,
    cursor: "pointer",
    padding: "0.35rem 0.8rem",
    fontSize: "0.825rem",
    color: "#6B7C74",
    transition: "all 0.15s ease",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.25rem",
    color: "#2D7A5B",
    padding: "0.25rem",
  },
  mobileMenu: {
    background: "#fff",
    borderTop: "1px solid #D0DED8",
    padding: "0.75rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  mobileLink: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem 0",
    fontSize: "0.95rem",
    color: "#1A2E26",
    textAlign: "left" as const,
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  mobileLogout: {
    background: "none",
    border: "1px solid #C0392B",
    borderRadius: 8,
    cursor: "pointer",
    padding: "0.5rem 0.9rem",
    fontSize: "0.875rem",
    color: "#C0392B",
    marginTop: "0.25rem",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
};

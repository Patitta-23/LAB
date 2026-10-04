import React, { useEffect } from "react";
import "./index.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import TicketListPage from "./pages/TicketListPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import ItQueuePage from "./pages/ItQueuePage";
import ItTicketDetailPage from "./pages/ItTicketDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";

// ── Page type (Lab 3 — real auth routing) ────────────────────────────────

type Page =
  | { name: "login" }
  | { name: "change-password" }
  | { name: "list" }
  | { name: "create" }
  | { name: "detail"; ticketId: number }
  | { name: "it-queue" }
  | { name: "it-detail"; ticketId: number }
  | { name: "admin-users" };

// ── Inner App (needs AuthContext) ─────────────────────────────────────────

function AppInner() {
  const { user, loading } = useAuth();

  // Derive page from URL on first load
  const [page, setPage] = React.useState<Page>({ name: "login" });
  const [initialized, setInitialized] = React.useState(false);

  // Once auth is resolved, determine the correct starting page
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setPage({ name: "login" });
      setInitialized(true);
      return;
    }

    if (user.mustChangePassword) {
      setPage({ name: "change-password" });
      setInitialized(true);
      return;
    }

    // Parse URL to restore deep-link
    const path = window.location.pathname;

    if (user.role === "IT_Staff" || user.role === "Administrator") {
      const matchItDetail = path.match(/^\/it-staff\/tickets\/(\d+)$/);
      if (matchItDetail) {
        setPage({ name: "it-detail", ticketId: parseInt(matchItDetail[1], 10) });
        setInitialized(true);
        return;
      }
      if (user.role === "Administrator" && path.startsWith("/admin")) {
        setPage({ name: "admin-users" });
        setInitialized(true);
        return;
      }
      setPage({ name: "it-queue" });
    } else {
      // Requester
      const matchDetail = path.match(/^\/tickets\/(\d+)$/);
      if (matchDetail) {
        setPage({ name: "detail", ticketId: parseInt(matchDetail[1], 10) });
        setInitialized(true);
        return;
      }
      if (path === "/tickets/new") {
        setPage({ name: "create" });
        setInitialized(true);
        return;
      }
      setPage({ name: "list" });
    }
    setInitialized(true);
  }, [loading, user]);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      if (!user) return;
      const path = window.location.pathname;
      if (user.role === "IT_Staff" || user.role === "Administrator") {
        const m = path.match(/^\/it-staff\/tickets\/(\d+)$/);
        if (m) { setPage({ name: "it-detail", ticketId: parseInt(m[1], 10) }); return; }
        setPage({ name: "it-queue" });
      } else {
        const m = path.match(/^\/tickets\/(\d+)$/);
        if (m) { setPage({ name: "detail", ticketId: parseInt(m[1], 10) }); return; }
        if (path === "/tickets/new") { setPage({ name: "create" }); return; }
        setPage({ name: "list" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [user]);

  const navigateTo = (newPage: Page | string) => {
    // Accept string shortcuts from NavBar
    const p: Page =
      typeof newPage === "string"
        ? resolvePageString(newPage)
        : newPage;

    setPage(p);

    // Update URL
    if (p.name === "detail") {
      window.history.pushState(null, "", `/tickets/${p.ticketId}`);
    } else if (p.name === "create") {
      window.history.pushState(null, "", "/tickets/new");
    } else if (p.name === "list") {
      window.history.pushState(null, "", "/");
    } else if (p.name === "it-queue") {
      window.history.pushState(null, "", "/it-staff/queue");
    } else if (p.name === "it-detail") {
      window.history.pushState(null, "", `/it-staff/tickets/${p.ticketId}`);
    } else if (p.name === "admin-users") {
      window.history.pushState(null, "", "/admin/users");
    } else if (p.name === "login") {
      window.history.pushState(null, "", "/login");
    } else if (p.name === "change-password") {
      window.history.pushState(null, "", "/change-password");
    }
  };

  const handleNavBarNavigate = (pageStr: string) => navigateTo(resolvePageString(pageStr));

  // Loading splash
  if (loading || !initialized) {
    return (
      <div style={splashStyle}>
        <span style={{ fontSize: "2.5rem" }}>🎫</span>
        <p style={{ color: "#2D7A5B", fontWeight: 600, fontFamily: "'Inter','Outfit',sans-serif" }}>
          Loading TokTickIT…
        </p>
      </div>
    );
  }

  // Auth guard: redirect to login if not authenticated
  if (!user && page.name !== "login") {
    return <LoginPage />;
  }

  // Force change password if flag is set
  if (user?.mustChangePassword && page.name !== "change-password") {
    return <ChangePasswordPage />;
  }

  // Show login page
  if (page.name === "login") {
    return <LoginPage />;
  }

  // Show change password page
  if (page.name === "change-password") {
    return <ChangePasswordPage />;
  }

  // All other pages require authenticated user
  if (!user) return <LoginPage />;

  // Role-based routing guard
  const isITorAdmin = user.role === "IT_Staff" || user.role === "Administrator";
  const isAdmin = user.role === "Administrator";

  // Guard: Requester cannot access IT/Admin pages
  if (!isITorAdmin && (page.name === "it-queue" || page.name === "it-detail")) {
    return renderWithNav(<ForbiddenPage />, page.name, handleNavBarNavigate);
  }
  if (!isAdmin && page.name === "admin-users") {
    return renderWithNav(<ForbiddenPage />, page.name, handleNavBarNavigate);
  }

  // Requester pages
  if (page.name === "list") {
    return renderWithNav(
      <TicketListPage
        requesterId={user.id}
        onCreateNew={() => navigateTo({ name: "create" })}
        onSelectTicket={(id: number) => navigateTo({ name: "detail", ticketId: id })}
      />,
      page.name, handleNavBarNavigate
    );
  }

  if (page.name === "create") {
    return renderWithNav(
      <CreateTicketPage
        requesterId={user.id}
        onCancel={() => navigateTo({ name: "list" })}
        onSuccess={(id: number) => navigateTo({ name: "detail", ticketId: id })}
      />,
      page.name, handleNavBarNavigate
    );
  }

  if (page.name === "detail") {
    return renderWithNav(
      <TicketDetailPage
        requesterId={user.id}
        ticketId={page.ticketId}
        onBack={() => navigateTo({ name: "list" })}
      />,
      page.name, handleNavBarNavigate
    );
  }

  // IT Staff pages
  if (page.name === "it-queue") {
    return renderWithNav(
      <ItQueuePage onViewTicket={(id) => navigateTo({ name: "it-detail", ticketId: id })} />,
      page.name, handleNavBarNavigate
    );
  }

  if (page.name === "it-detail") {
    return renderWithNav(
      <ItTicketDetailPage
        ticketId={page.ticketId}
        onBack={() => navigateTo({ name: "it-queue" })}
      />,
      page.name, handleNavBarNavigate
    );
  }

  // Admin pages
  if (page.name === "admin-users") {
    return renderWithNav(
      <AdminUsersPage />,
      page.name, handleNavBarNavigate
    );
  }

  return <LoginPage />;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function resolvePageString(s: string): Page {
  if (s === "list") return { name: "list" };
  if (s === "create") return { name: "create" };
  if (s === "it-queue") return { name: "it-queue" };
  if (s === "admin-users") return { name: "admin-users" };
  if (s === "login") return { name: "login" };
  if (s === "change-password") return { name: "change-password" };
  return { name: "list" };
}

function renderWithNav(
  content: React.ReactNode,
  currentPage: string,
  onNavigate: (p: string) => void
) {
  return (
    <div style={{ paddingTop: 60 }}>
      <NavBar currentPage={currentPage} onNavigate={onNavigate} />
      {content}
    </div>
  );
}

function ForbiddenPage() {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
      <h1 style={{ color: "#C0392B", fontFamily: "'Inter','Outfit',sans-serif" }}>403 — Forbidden</h1>
      <p style={{ color: "#6B7C74", fontFamily: "'Inter','Outfit',sans-serif" }}>
        You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}

const splashStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
  background: "linear-gradient(135deg, #F4F7F5 0%, #E8F5EF 100%)",
};

// ── Root App ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

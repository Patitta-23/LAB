import React, { useState, useId } from "react";
import { useAuth } from "../context/AuthContext";

// ── Component ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation handled by App.tsx based on user.role and mustChangePassword
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>🎫</div>
          <h1 style={styles.title}>TokTickIT</h1>
          <p style={styles.subtitle}>IT Service Desk Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label htmlFor="login-email" style={styles.label}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="login-password" style={styles.label}>
              Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: "3rem" }}
              />
              <button
                type="button"
                tabIndex={-1}
                style={styles.showHideBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Error callout */}
          {error && (
            <div id="login-error" role="alert" style={styles.errorCallout}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <span style={styles.spinner} />
                Logging in…
              </span>
            ) : (
              <>Log In &nbsp;→</>
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Contact your administrator for account access.
        </p>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F4F7F5 0%, #E8F5EF 50%, #F0F9F4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  blob1: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,122,91,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    bottom: "-80px",
    left: "-80px",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,122,91,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(45,122,91,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: 420,
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoMark: {
    fontSize: "2.5rem",
    lineHeight: 1,
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1A2E26",
    margin: "0 0 0.25rem",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#6B7C74",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#1A2E26",
  },
  input: {
    padding: "0.7rem 0.9rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 10,
    fontSize: "0.95rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
  },
  showHideBtn: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: 0,
    lineHeight: 1,
  },
  errorCallout: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#FDEDEC",
    border: "1px solid #C0392B",
    borderRadius: 10,
    padding: "0.7rem 1rem",
    fontSize: "0.875rem",
    color: "#C0392B",
    fontWeight: 500,
  },
  errorIcon: {
    fontSize: "1rem",
    flexShrink: 0,
  },
  submitBtn: {
    background: "linear-gradient(135deg, #2D7A5B 0%, #1F5C42 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "0.8rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 14px rgba(45,122,91,0.3)",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  footer: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.8rem",
    color: "#6B7C74",
    marginBottom: 0,
  },
};

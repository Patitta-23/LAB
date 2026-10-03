import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";

// Password strength rules per BR-04
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one digit.";
  return null;
}

// ── Component ────────────────────────────────────────────────────────────

export default function ChangePasswordPage() {
  const { refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(newPassword, confirmPassword);
      // Refresh user — mustChangePassword should now be false
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    return score; // 0-4
  })();

  const strengthColors = ["#C0392B", "#D4A017", "#D4A017", "#2D7A5B", "#2D7A5B"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Info banner */}
        <div style={styles.banner}>
          <span style={styles.bannerIcon}>🔒</span>
          <div>
            <p style={styles.bannerTitle}>Change Your Password</p>
            <p style={styles.bannerSub}>You must set a new password before continuing.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* New Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="new-password" style={styles.label}>
              New Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                autoFocus
                style={{ ...styles.input, paddingRight: "3rem" }}
              />
              <button
                type="button"
                tabIndex={-1}
                style={styles.showHideBtn}
                onClick={() => setShowNew((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showNew ? "🙈" : "👁"}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div style={styles.strengthRow}>
                <div style={styles.strengthTrack}>
                  <div
                    style={{
                      ...styles.strengthBar,
                      width: `${(strength / 4) * 100}%`,
                      background: strengthColors[strength],
                    }}
                  />
                </div>
                <span style={{ ...styles.strengthLabel, color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="confirm-password" style={styles.label}>
              Confirm New Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                style={{ ...styles.input, paddingRight: "3rem" }}
              />
              <button
                type="button"
                tabIndex={-1}
                style={styles.showHideBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Requirements hint */}
          <div style={styles.hint}>
            <p style={styles.hintTitle}>Password requirements:</p>
            <ul style={styles.hintList}>
              {[
                { label: "At least 8 characters", ok: newPassword.length >= 8 },
                { label: "At least one uppercase letter (A–Z)", ok: /[A-Z]/.test(newPassword) },
                { label: "At least one lowercase letter (a–z)", ok: /[a-z]/.test(newPassword) },
                { label: "At least one digit (0–9)", ok: /[0-9]/.test(newPassword) },
              ].map(({ label, ok }) => (
                <li key={label} style={{ ...styles.hintItem, color: ok ? "#2D7A5B" : "#6B7C74" }}>
                  <span>{ok ? "✓" : "○"}</span> {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div id="change-password-error" role="alert" style={styles.errorCallout}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="change-password-submit"
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <span style={styles.spinner} />
                Saving…
              </span>
            ) : (
              <>Set New Password &nbsp;→</>
            )}
          </button>
        </form>
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
    top: "-100px",
    right: "-100px",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,122,91,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    bottom: "-60px",
    left: "-60px",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,122,91,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(45,122,91,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    padding: "2rem",
    width: "100%",
    maxWidth: 460,
    position: "relative",
    zIndex: 1,
  },
  banner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    background: "#E8F5EF",
    border: "1px solid #B8D9CB",
    borderRadius: 12,
    padding: "1rem 1.25rem",
    marginBottom: "1.75rem",
  },
  bannerIcon: {
    fontSize: "1.5rem",
    flexShrink: 0,
    marginTop: "0.1rem",
  },
  bannerTitle: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#1A2E26",
    margin: "0 0 0.2rem",
  },
  bannerSub: {
    fontSize: "0.85rem",
    color: "#2D7A5B",
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
  },
  strengthRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.35rem",
  },
  strengthTrack: {
    flex: 1,
    height: 5,
    background: "#E8EDE9",
    borderRadius: 4,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s, background 0.3s",
  },
  strengthLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    minWidth: 40,
    textAlign: "right" as const,
  },
  hint: {
    background: "#F4F7F5",
    borderRadius: 10,
    padding: "0.8rem 1rem",
  },
  hintTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#1A2E26",
    margin: "0 0 0.4rem",
  },
  hintList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  hintItem: {
    fontSize: "0.8rem",
    display: "flex",
    gap: "0.35rem",
    alignItems: "center",
    transition: "color 0.2s",
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
  submitBtn: {
    background: "linear-gradient(135deg, #2D7A5B 0%, #1F5C42 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "0.8rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
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
};

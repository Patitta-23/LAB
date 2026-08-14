import { useState } from "react";
import { checkSystem, Category } from "./api";

type UiState = "idle" | "loading" | "success" | "error";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px 20px",
  marginBottom: "16px",
  background: "#ffffff",
};

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setState("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Cannot connect to the server.");
      setState("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {/* Header */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 6px",
          }}
        >
          TokTickIT IT Service Desk
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#6b7280",
            margin: "0 0 24px",
          }}
        >
          Internal Service Desk Portal for IT Support Requests
        </p>

        {/* Check System Button */}
        <button
          onClick={handleCheck}
          disabled={state === "loading"}
          style={{
            width: "100%",
            padding: "14px",
            background: state === "loading" ? "#93c5fd" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: state === "loading" ? "not-allowed" : "pointer",
            marginBottom: "24px",
            transition: "background 0.2s",
          }}
        >
          {state === "loading" ? "Checking…" : "Check System"}
        </button>

        {/* Success State */}
        {state === "success" && (
          <>
            {/* Status Card */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>
                  System Status:
                </span>
                <span
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "4px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Online
                </span>
              </div>
              <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", margin: 0 }}>
                Service: <strong>TokTickIT API</strong>
              </p>
            </div>

            {/* Categories Card */}
            <div style={cardStyle}>
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: "16px",
                }}
              >
                Supported Request Categories
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {categories.map((cat, index) => (
                  <li
                    key={cat.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: index < categories.length - 1 ? "1px solid #f3f4f6" : "none",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  >
                    <span>{cat.name}</span>
                    <span
                      style={{
                        background: "#374151",
                        color: "#fff",
                        borderRadius: "20px",
                        padding: "2px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      #{index + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Error State */}
        {state === "error" && (
          <div
            style={{
              ...cardStyle,
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>
                System Status:
              </span>
              <span
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "4px 14px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Offline
              </span>
            </div>
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "4px 0 0" }}>
              ⚠ {errorMessage}
            </p>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: "6px 0 0" }}>
              Make sure the server and database are running.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

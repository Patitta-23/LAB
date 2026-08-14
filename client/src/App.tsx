import { useState } from "react";
import { checkSystem, Category } from "./api";

type UiState = "idle" | "loading" | "success" | "error";

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
      setErrorMessage(err.message || "Failed to connect to API");
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button
        className="btn btn-success mb-4"
        onClick={handleCheck}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "success" && (
        <div>
          <div className="alert alert-success d-inline-block px-3 py-1 mb-3" role="status">
            <strong>Status:</strong> Online
          </div>
          <h2 className="h5 mb-3">Available Categories</h2>
          <ul className="list-group">
            {categories.map((cat) => (
              <li key={cat.id} className="list-group-item">
                {cat.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state === "error" && (
        <div className="alert alert-danger" role="alert">
          <strong>Status:</strong> Offline
          <br />
          <span className="text-danger-emphasis small">⚠ {errorMessage}</span>
          <hr className="my-2" />
          <small className="text-muted">
            Please make sure the server is running at{" "}
            <code>http://localhost:3000</code> and the database is connected.
          </small>
        </div>
      )}
    </div>
  );
}

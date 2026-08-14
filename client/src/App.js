import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
export default function App() {
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    async function handleCheck() {
        setState("loading");
        setErrorMessage("");
        try {
            const result = await checkSystem();
            setCategories(result.categories);
            setState("success");
        }
        catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "System unavailable");
            setState("error");
        }
    }
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("h1", { className: "h3 mb-4", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsx("button", { className: "btn btn-success mb-4", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), state === "success" && (_jsxs("div", { className: "alert alert-success mt-3", role: "alert", children: [_jsx("div", { className: "fw-bold mb-2", children: "Online" }), _jsx("ul", { className: "list-group list-group-flush text-dark", children: categories.map((cat) => (_jsx("li", { className: "list-group-item bg-transparent", children: cat.name }, cat.id))) })] })), state === "error" && (_jsxs("div", { className: "alert alert-danger mt-3", role: "alert", children: [_jsx("div", { className: "fw-bold", children: "Offline" }), _jsx("div", { children: errorMessage || "API is unavailable" })] }))] }));
}

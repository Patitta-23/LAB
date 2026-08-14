import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("App", () => {
    // WORKED EXAMPLE — provided for you.
    it("renders the TokTickIT heading", () => {
        render(_jsx(App, {}));
        expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    });
    it("shows Online and the seeded categories on success", async () => {
        vi.spyOn(api, "checkSystem").mockResolvedValue({
            online: true,
            categories: [
                { id: 1, name: "Account and Access" },
                { id: 2, name: "Hardware" },
                { id: 3, name: "Software" },
                { id: 4, name: "Network" },
            ],
        });
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        await waitFor(() => {
            expect(screen.getByText(/Online/i)).toBeInTheDocument();
            expect(screen.getByText("Account and Access")).toBeInTheDocument();
            expect(screen.getByText("Hardware")).toBeInTheDocument();
            expect(screen.getByText("Software")).toBeInTheDocument();
            expect(screen.getByText("Network")).toBeInTheDocument();
        });
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("API is unavailable"));
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        await waitFor(() => {
            expect(screen.getByText(/Offline/i)).toBeInTheDocument();
            expect(screen.getByText(/API is unavailable/i)).toBeInTheDocument();
        });
    });
});

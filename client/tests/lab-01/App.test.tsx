import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App";
import * as api from "../../src/api";

const mockRequesterUser: api.AuthUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@company.com",
  role: "Requester",
  mustChangePassword: false,
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.authApi, "getMe").mockResolvedValue(mockRequesterUser);
  vi.spyOn(api, "fetchTickets").mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as any);
  vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
});

describe("App (Lab 3)", () => {
  it("renders the TokTickIT brand in the navbar when authenticated", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders the 'My Tickets' navigation link", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /My Tickets/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("renders the 'Create Ticket' navigation link", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Create Ticket/i }).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("renders user name and role badge in the navbar", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Requester")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});


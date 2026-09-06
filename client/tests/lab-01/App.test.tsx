// tests/lab-01/App.test.tsx
// Lab 2 App smoke tests — verifies the new Zen Green UI shell renders correctly.
// The old "Check System" button was replaced by the Lab 2 multi-page SPA.
// These tests cover the persistent elements: navbar brand, nav links, footer.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

beforeEach(() => {
  // Prevent real network calls; requester selector will show loading state
  vi.spyOn(api, "fetchRequesters").mockResolvedValue([]);
});

describe("App", () => {
  it("renders the TokTickIT brand in the navbar", () => {
    render(<App />);
    // The brand link contains "TokTickIT" text
    expect(screen.getByRole("link", { name: /TokTickIT/i })).toBeInTheDocument();
  });

  it("renders the 'My Tickets' navigation link", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /My Tickets/i })).toBeInTheDocument();
  });

  it("renders the '+ New Ticket' navigation link", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /New Ticket/i })).toBeInTheDocument();
  });

  it("renders the footer with CPE 334 Lab 2 text", () => {
    render(<App />);
    expect(screen.getByText(/CPE 334 Lab 2/i)).toBeInTheDocument();
  });
});

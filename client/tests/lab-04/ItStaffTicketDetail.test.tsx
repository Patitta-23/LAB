/**
 * Lab 4 — Phase 4: Direct API Authorization Evidence
 * Client UI Tests: IT Staff Ticket Detail (UI-IT-01 … UI-IT-06)
 *
 * Tests that the ItTicketDetailPage renders correctly and exposes the correct
 * UI elements for IT Staff operations per FR-06, FR-08, AC-04, AC-05.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import ItTicketDetailPage from "../../src/pages/ItTicketDetailPage";
import * as api from "../../src/api";

// ── Mock auth context ────────────────────────────────────────────────────
vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 99, name: "IT Staff Test", email: "it@test.com", role: "IT_Staff", mustChangePassword: false },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

// ── Mock ticket data ─────────────────────────────────────────────────────
const mockTicketUnassigned: api.Lab3TicketDetail = {
  id: 1,
  ticketNumber: "TK-2026-0001",
  title: "VPN drops after 10 minutes",
  description: "The VPN disconnects every 10 minutes and requires manual reconnect.",
  status: "OPEN",
  itPriority: null,
  assignedStaff: null,
  requester: { id: 10, name: "Alice Requester" },
  category: { id: 1, name: "Network" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attachments: [],
  publicComments: [],
  internalNotes: [],
};

const mockTicketAssigned: api.Lab3TicketDetail = {
  ...mockTicketUnassigned,
  id: 2,
  ticketNumber: "TK-2026-0002",
  title: "Printer not found on 4th floor",
  status: "IN_PROGRESS",
  itPriority: "HIGH",
  assignedStaff: { id: 99, name: "IT Staff Test" },  // same as current user
  attachments: [],
  publicComments: [
    {
      id: 1,
      type: "PUBLIC",
      content: "Checked the printer driver — reinstalling now.",
      author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
      createdAt: new Date().toISOString(),
    },
  ],
  internalNotes: [
    {
      id: 1,
      content: "Internal: the printer needs firmware update.",
      author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
      createdAt: new Date().toISOString(),
    },
  ],
};

const mockItStaffList: api.ItStaffUser[] = [
  { id: 99, name: "IT Staff Test", email: "it@test.com" },
  { id: 100, name: "IT Staff Bob", email: "bob@test.com" },
];

// ── Setup ────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api.itStaffApi, "getItStaffUsers").mockResolvedValue(mockItStaffList);
});

// ─────────────────────────────────────────────────────────────────────────
// UI-IT-01: Renders ticket title, status badge, priority badge
// ─────────────────────────────────────────────────────────────────────────
describe("IT Staff Ticket Detail Page", () => {
  it("UI-IT-01: renders ticket title, status badge when unassigned + no priority", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketUnassigned);

    render(<ItTicketDetailPage ticketId={1} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN drops after 10 minutes")).toBeInTheDocument();
      expect(screen.getAllByText(/TK-2026-0001/).length).toBeGreaterThanOrEqual(1);
    });

    // Status badge should show Open
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("UI-IT-01b: renders priority badge when itPriority is set", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketAssigned);

    render(<ItTicketDetailPage ticketId={2} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Printer not found on 4th floor")).toBeInTheDocument();
    });

    // Priority badge HIGH should be visible (as badge and in select)
    expect(screen.getAllByText("HIGH").length).toBeGreaterThanOrEqual(1);
    // Status badge IN_PROGRESS
    expect(screen.getAllByText(/In Progress/).length).toBeGreaterThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────
  // UI-IT-02: Shows Claim button when unassigned
  // ─────────────────────────────────────────────────────────────────────
  it("UI-IT-02: shows Claim Ticket button when ticket is unassigned", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketUnassigned);

    render(<ItTicketDetailPage ticketId={1} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN drops after 10 minutes")).toBeInTheDocument();
    });

    // Claim button should be present
    const claimBtn = document.getElementById("claim-ticket-btn");
    expect(claimBtn).toBeInTheDocument();
    expect(claimBtn?.textContent).toMatch(/Claim Ticket/i);
  });

  // ─────────────────────────────────────────────────────────────────────
  // UI-IT-03: Shows "Assigned to you" badge when assigned to current user
  // ─────────────────────────────────────────────────────────────────────
  it("UI-IT-03: shows assigned badge and Reassign dropdown when assigned to me", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketAssigned);

    render(<ItTicketDetailPage ticketId={2} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Printer not found on 4th floor")).toBeInTheDocument();
    });

    // "Assigned to you" badge should appear (not the Claim button)
    expect(screen.getByText(/Assigned to you/i)).toBeInTheDocument();
    expect(document.getElementById("claim-ticket-btn")).not.toBeInTheDocument();

    // Reassign select should be present
    const assigneeSelect = document.getElementById("assignee-select");
    expect(assigneeSelect).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────────
  // UI-IT-04: Priority dropdown present with all 4 values
  // ─────────────────────────────────────────────────────────────────────
  it("UI-IT-04: priority dropdown shows LOW/MEDIUM/HIGH/CRITICAL options", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketUnassigned);

    render(<ItTicketDetailPage ticketId={1} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN drops after 10 minutes")).toBeInTheDocument();
    });

    const prioritySelect = document.getElementById("priority-select") as HTMLSelectElement;
    expect(prioritySelect).toBeInTheDocument();

    const options = Array.from(prioritySelect.options).map((o) => o.value);
    expect(options).toContain("LOW");
    expect(options).toContain("MEDIUM");
    expect(options).toContain("HIGH");
    expect(options).toContain("CRITICAL");
  });

  // ─────────────────────────────────────────────────────────────────────
  // UI-IT-05: Status dropdown shows only permitted next statuses
  // OPEN → only IN_PROGRESS is a valid next state
  // ─────────────────────────────────────────────────────────────────────
  it("UI-IT-05: status dropdown for OPEN ticket shows only IN_PROGRESS as next option", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketUnassigned);

    render(<ItTicketDetailPage ticketId={1} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN drops after 10 minutes")).toBeInTheDocument();
    });

    const statusSelect = document.getElementById("status-select") as HTMLSelectElement;
    expect(statusSelect).toBeInTheDocument();

    const options = Array.from(statusSelect.options).map((o) => o.value);
    // OPEN is current, IN_PROGRESS is only valid next
    expect(options).toContain("OPEN");
    expect(options).toContain("IN_PROGRESS");
    // These are NOT valid transitions from OPEN
    expect(options).not.toContain("RESOLVED");
    expect(options).not.toContain("CLOSED");
    expect(options).not.toContain("PENDING");
  });

  // ─────────────────────────────────────────────────────────────────────
  // UI-IT-06: Internal Notes shown (unified thread with lock icon)
  // ─────────────────────────────────────────────────────────────────────
  it("UI-IT-06: unified comment thread renders INTERNAL notes with 🔒 toggle visible", async () => {
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockTicketAssigned);

    render(<ItTicketDetailPage ticketId={2} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Printer not found on 4th floor")).toBeInTheDocument();
    });

    // Internal note content should be visible for IT Staff
    expect(screen.getByText(/Internal: the printer needs firmware update/i)).toBeInTheDocument();

    // Toggle buttons must exist
    const publicToggle = document.getElementById("toggle-comment-public");
    const internalToggle = document.getElementById("toggle-comment-internal");
    expect(publicToggle).toBeInTheDocument();
    expect(internalToggle).toBeInTheDocument();

    // Unified textarea and send button
    expect(document.getElementById("add-unified-comment")).toBeInTheDocument();
    expect(document.getElementById("send-unified-comment")).toBeInTheDocument();
  });
});

/**
 * Lab 4 — Phase 4: Direct API Authorization Evidence
 * Client UI Tests: Requester Ticket Detail (UI-REQ-01 … UI-REQ-06)
 *
 * Tests that the TicketDetailPage renders correctly for a Requester:
 * - Ticket info rendered
 * - "Problem Appears Resolved" button visibility based on status
 * - Resolve confirmation modal
 * - Comment form has no Internal Note toggle
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import TicketDetailPage from "../../src/pages/TicketDetailPage";
import * as api from "../../src/api";

const mockTicketInProgress: api.TicketDetail = {
  id: 101,
  title: "VPN connection unstable at home",
  description: "Frequent disconnects when using corporate VPN on Wi-Fi.",
  status: "IN_PROGRESS",
  categoryId: 1,
  requesterId: 42,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 1, name: "Network" },
  attachments: [],
};

const mockTicketClosed: api.TicketDetail = {
  ...mockTicketInProgress,
  id: 102,
  status: "CLOSED",
};

const mockComments: api.PublicComment[] = [
  {
    id: 1,
    type: "PUBLIC",
    content: "Please restart your router and try again.",
    author: { id: 2, name: "IT Bob", role: "IT_Staff" },
    createdAt: new Date().toISOString(),
  },
];

describe("Requester Ticket Detail Page (UI-REQ-01 … UI-REQ-06)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicketInProgress);
    vi.spyOn(api.commentsApi, "getComments").mockResolvedValue({ comments: mockComments });
    vi.spyOn(api.commentsApi, "resolveTicket").mockResolvedValue({ message: "Resolved", status: "RESOLVED" });
  });

  // UI-REQ-01: Renders ticket info (own ticket)
  it("UI-REQ-01: renders ticket title, category, and status", async () => {
    render(<TicketDetailPage requesterId={42} ticketId={101} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN connection unstable at home")).toBeInTheDocument();
      expect(screen.getAllByText(/Network/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/In Progress/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  // UI-REQ-02: "Problem Appears Resolved" shown when status = IN_PROGRESS
  it("UI-REQ-02: 'Problem Appears Resolved' button shown when status is IN_PROGRESS", async () => {
    render(<TicketDetailPage requesterId={42} ticketId={101} onBack={vi.fn()} />);

    await waitFor(() => {
      const btn = document.getElementById("btn-problem-resolved");
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent(/Problem Appears Resolved/i);
    });
  });

  // UI-REQ-03: "Problem Appears Resolved" hidden when status = CLOSED
  it("UI-REQ-03: 'Problem Appears Resolved' button is NOT rendered when status is CLOSED", async () => {
    vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicketClosed);

    render(<TicketDetailPage requesterId={42} ticketId={102} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN connection unstable at home")).toBeInTheDocument();
    });

    const btn = document.getElementById("btn-problem-resolved");
    expect(btn).not.toBeInTheDocument();
  });

  // UI-REQ-04: Comment toggle (Public/Internal) NOT shown for Requester
  it("UI-REQ-04: comment toggle (Public/Internal) is absent in requester ticket detail", async () => {
    render(<TicketDetailPage requesterId={42} ticketId={101} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("VPN connection unstable at home")).toBeInTheDocument();
    });

    // Requesters should not see internal note toggle buttons
    expect(document.getElementById("toggle-comment-internal")).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal Note/i)).not.toBeInTheDocument();
  });

  // UI-REQ-05: Internal Notes NOT visible in comment list
  it("UI-REQ-05: renders public comments and does not show internal notes to requester", async () => {
    render(<TicketDetailPage requesterId={42} ticketId={101} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Please restart your router and try again.")).toBeInTheDocument();
    });

    // No internal note markers or secret content
    expect(screen.queryByText(/🔒/)).not.toBeInTheDocument();
  });

  // UI-REQ-06: Confirmation dialog appears on resolve click and calls resolve API
  it("UI-REQ-06: shows confirmation dialog on resolve click and calls resolveTicket on confirm", async () => {
    render(<TicketDetailPage requesterId={42} ticketId={101} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(document.getElementById("btn-problem-resolved")).toBeInTheDocument();
    });

    // Click "Problem Appears Resolved"
    fireEvent.click(document.getElementById("btn-problem-resolved")!);

    // Confirmation dialog should be visible
    expect(screen.getByText("Confirm Resolution")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure the problem has been resolved/i)).toBeInTheDocument();

    // Confirm resolve
    const confirmBtn = document.getElementById("btn-resolve-confirm");
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn!);

    await waitFor(() => {
      expect(api.commentsApi.resolveTicket).toHaveBeenCalledWith(101);
    });
  });
});

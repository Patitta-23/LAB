import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ItQueuePage from "../../src/pages/ItQueuePage";
import * as api from "../../src/api";

const mockTickets: api.Lab3Ticket[] = [
  {
    id: 1,
    ticketNumber: "TK-2026-0001",
    title: "VPN Connection drops frequently",
    status: "OPEN",
    itPriority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requester: { id: 10, name: "Alice Requester" },
    assignedStaff: null,
    category: { id: 1, name: "Network" },
  },
  {
    id: 2,
    ticketNumber: "TK-2026-0002",
    title: "Cannot access printer on 4th floor",
    status: "IN_PROGRESS",
    itPriority: "LOW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requester: { id: 11, name: "Bob Worker" },
    assignedStaff: { id: 2, name: "IT Bob" },
    category: { id: 2, name: "Hardware" },
  },
];

describe("ItQueuePage (UI-08..UI-09)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.itStaffApi, "getTickets").mockResolvedValue({
      tickets: mockTickets,
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it("UI-08: renders ticket queue table with tickets and badges", async () => {
    render(<ItQueuePage onViewTicket={vi.fn()} />);

    expect(screen.getByText("Ticket Queue")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("#TK-2026-0001")).toBeInTheDocument();
      expect(screen.getByText("VPN Connection drops frequently")).toBeInTheDocument();
      expect(screen.getByText("#TK-2026-0002")).toBeInTheDocument();
      expect(screen.getByText("Cannot access printer on 4th floor")).toBeInTheDocument();
    });
  });

  it("UI-09: typing in search input calls itStaffApi.getTickets with search parameter", async () => {
    const getSpy = vi.spyOn(api.itStaffApi, "getTickets").mockResolvedValue({
      tickets: [mockTickets[0]],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    render(<ItQueuePage onViewTicket={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search by ticket number or summary…/i);
    fireEvent.change(searchInput, { target: { value: "VPN" } });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "VPN",
        })
      );
    });
  });
});

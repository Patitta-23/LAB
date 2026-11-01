/**
 * Lab 4 — Phase 4: Direct API Authorization Evidence
 * Client UI Tests: Comment Section (UI-CMT-01 … UI-CMT-05)
 *
 * Tests the Comment Section behavior:
 * - UI-CMT-01: Renders public comments
 * - UI-CMT-02: IT Staff sees type toggle (Public / Internal Note)
 * - UI-CMT-03: Requester has no type toggle
 * - UI-CMT-04: Submit disabled on empty content
 * - UI-CMT-05: Submit posts and clears form
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ItTicketDetailPage from "../../src/pages/ItTicketDetailPage";
import TicketDetailPage from "../../src/pages/TicketDetailPage";
import * as api from "../../src/api";

// ── Mock auth context for IT Staff ───────────────────────────────────────
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

const mockItTicket: api.Lab3TicketDetail = {
  id: 201,
  ticketNumber: "TK-2026-0201",
  title: "Email sync issue on Outlook",
  description: "New emails do not appear unless manually synced.",
  status: "IN_PROGRESS",
  itPriority: "MEDIUM",
  assignedStaff: { id: 99, name: "IT Staff Test" },
  requester: { id: 50, name: "Charlie Worker" },
  category: { id: 1, name: "Software" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attachments: [],
  publicComments: [
    {
      id: 11,
      type: "PUBLIC",
      content: "Have you tried disabling add-ins in Outlook?",
      author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
      createdAt: new Date().toISOString(),
    },
  ],
  internalNotes: [
    {
      id: 12,
      type: "INTERNAL",
      content: "Exchange server had a brief sync throttle.",
      author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
      createdAt: new Date().toISOString(),
    },
  ],
};

const mockRequesterTicket: api.TicketDetail = {
  id: 201,
  title: "Email sync issue on Outlook",
  description: "New emails do not appear unless manually synced.",
  status: "IN_PROGRESS",
  categoryId: 1,
  requesterId: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 1, name: "Software" },
  attachments: [],
};

describe("Comment Section Component Tests (UI-CMT-01 … UI-CMT-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.itStaffApi, "getTicketById").mockResolvedValue(mockItTicket);
    vi.spyOn(api.itStaffApi, "getItStaffUsers").mockResolvedValue([]);
    vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockRequesterTicket);
    vi.spyOn(api.commentsApi, "getComments").mockResolvedValue({
      comments: [
        {
          id: 11,
          type: "PUBLIC",
          content: "Have you tried disabling add-ins in Outlook?",
          author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.spyOn(api.commentsApi, "addComment").mockResolvedValue({
      comment: {
        id: 999,
        type: "PUBLIC",
        content: "New test comment",
        author: { id: 99, name: "IT Staff Test", role: "IT_Staff" },
        createdAt: new Date().toISOString(),
      },
    });
  });

  // UI-CMT-01: Renders public comments
  it("UI-CMT-01: renders public comments in the comment thread", async () => {
    render(<TicketDetailPage requesterId={50} ticketId={201} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Have you tried disabling add-ins in Outlook?")).toBeInTheDocument();
      expect(screen.getByText("IT Staff Test")).toBeInTheDocument();
    });
  });

  // UI-CMT-02: IT Staff sees type toggle (Public Comment vs Internal Note)
  it("UI-CMT-02: IT Staff sees PUBLIC and INTERNAL toggle buttons", async () => {
    render(<ItTicketDetailPage ticketId={201} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Email sync issue on Outlook")).toBeInTheDocument();
    });

    const publicToggle = document.getElementById("toggle-comment-public");
    const internalToggle = document.getElementById("toggle-comment-internal");

    expect(publicToggle).toBeInTheDocument();
    expect(internalToggle).toBeInTheDocument();
    expect(publicToggle).toHaveTextContent(/Public Comment/i);
    expect(internalToggle).toHaveTextContent(/Internal Note/i);
  });

  // UI-CMT-03: Requester has no type toggle
  it("UI-CMT-03: Requester has no comment type toggle buttons", async () => {
    render(<TicketDetailPage requesterId={50} ticketId={201} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Email sync issue on Outlook")).toBeInTheDocument();
    });

    expect(document.getElementById("toggle-comment-public")).not.toBeInTheDocument();
    expect(document.getElementById("toggle-comment-internal")).not.toBeInTheDocument();
  });

  // UI-CMT-04: Submit disabled on empty content
  it("UI-CMT-04: comment submit button is disabled when input is empty", async () => {
    render(<TicketDetailPage requesterId={50} ticketId={201} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(document.getElementById("textarea-new-comment")).toBeInTheDocument();
    });

    const sendBtn = document.getElementById("btn-send-comment") as HTMLButtonElement;
    expect(sendBtn).toBeInTheDocument();
    expect(sendBtn.disabled).toBe(true);

    // Typing spaces only should remain disabled
    fireEvent.change(document.getElementById("textarea-new-comment")!, { target: { value: "   " } });
    expect(sendBtn.disabled).toBe(true);
  });

  // UI-CMT-05: Submit posts and clears form
  it("UI-CMT-05: typing valid text enables submit, sends comment, and resets textarea", async () => {
    render(<TicketDetailPage requesterId={50} ticketId={201} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(document.getElementById("textarea-new-comment")).toBeInTheDocument();
    });

    const textarea = document.getElementById("textarea-new-comment") as HTMLTextAreaElement;
    const sendBtn = document.getElementById("btn-send-comment") as HTMLButtonElement;

    // Type comment text
    fireEvent.change(textarea, { target: { value: "I tried safe mode and it works now." } });
    expect(sendBtn.disabled).toBe(false);

    // Click Send
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(api.commentsApi.addComment).toHaveBeenCalledWith(
        201,
        "I tried safe mode and it works now.",
        "PUBLIC"
      );
      // Input form is cleared
      expect(textarea.value).toBe("");
    });
  });
});

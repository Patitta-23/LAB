import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import AdminUsersPage from "../../src/pages/AdminUsersPage";
import * as api from "../../src/api";

const mockUsers: api.AdminUser[] = [
  {
    id: 1,
    name: "Alice Requester",
    email: "alice@example.com",
    role: "Requester",
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Bob IT",
    email: "bob@company.com",
    role: "IT_Staff",
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
  },
];

describe("AdminUsersPage (UI-10..UI-12)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.adminApi, "getUsers").mockResolvedValue({
      users: mockUsers,
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it("UI-10: renders user management table with users and roles", async () => {
    render(<AdminUsersPage />);

    expect(screen.getByText("User Management")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice Requester")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Bob IT")).toBeInTheDocument();
      expect(screen.getByText("bob@company.com")).toBeInTheDocument();
    });
  });

  it("UI-11: clicking + Create User opens the modal", async () => {
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Requester")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /\+ Create User/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole("heading", { name: "Create New User" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Temp password…")).toBeInTheDocument();
  });

  it("UI-12: clicking Deactivate opens the confirmation modal", async () => {
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Requester")).toBeInTheDocument();
    });

    const deactivateButtons = screen.getAllByRole("button", { name: /Deactivate/i });
    fireEvent.click(deactivateButtons[0]);

    expect(screen.getByRole("heading", { name: "Deactivate User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirm Deactivate/i })).toBeInTheDocument();
  });
});

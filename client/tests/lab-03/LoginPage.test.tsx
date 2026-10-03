import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import LoginPage from "../../src/pages/LoginPage";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

describe("LoginPage (UI-01..UI-04)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.authApi, "getMe").mockRejectedValue(new Error("Unauthorized"));
  });

  it("UI-01: renders email and password inputs and brand header", async () => {
    renderLoginPage();
    expect(screen.getByText("TokTickIT")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log In/i })).toBeInTheDocument();
  });

  it("UI-02: shows portal subtitle and footer note", async () => {
    renderLoginPage();
    expect(screen.getByText("IT Service Desk Portal")).toBeInTheDocument();
    expect(screen.getByText(/Contact your administrator for account access/i)).toBeInTheDocument();
  });

  it("UI-03: successful login calls authApi.login", async () => {
    const loginSpy = vi.spyOn(api.authApi, "login").mockResolvedValue({
      user: {
        id: 1,
        name: "Alice Smith",
        email: "alice@example.com",
        role: "Requester",
        mustChangePassword: false,
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("alice@example.com", "Password123");
    });
  });

  it("UI-04: failed login displays error message", async () => {
    vi.spyOn(api.authApi, "login").mockRejectedValue(new Error("Invalid email or password."));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "WrongPassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password\./i)).toBeInTheDocument();
    });
  });
});

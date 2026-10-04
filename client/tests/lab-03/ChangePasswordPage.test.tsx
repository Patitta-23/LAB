import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ChangePasswordPage from "../../src/pages/ChangePasswordPage";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

const mockUserWithPasswordReset: api.AuthUser = {
  id: 1,
  name: "Alice Smith",
  email: "alice@example.com",
  role: "Requester",
  mustChangePassword: true,
};

function renderChangePasswordPage() {
  return render(
    <AuthProvider>
      <ChangePasswordPage />
    </AuthProvider>
  );
}

describe("ChangePasswordPage (UI-05..UI-07)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.authApi, "getMe").mockResolvedValue(mockUserWithPasswordReset);
  });

  it("UI-05: renders new password and confirm password inputs", async () => {
    renderChangePasswordPage();
    expect(screen.getByText(/Change Your Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Set New Password/i })).toBeInTheDocument();
  });

  it("UI-06: displays error when passwords do not match", async () => {
    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "ValidPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), {
      target: { value: "DifferentPassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Set New Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match\./i)).toBeInTheDocument();
    });
  });

  it("UI-07: displays error when password is too short or missing complexity", async () => {
    renderChangePasswordPage();

    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), {
      target: { value: "weak" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Set New Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters\./i)).toBeInTheDocument();
    });
  });
});

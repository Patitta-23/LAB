import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import SelectRequesterPage from "../../src/pages/SelectRequesterPage";
import * as api from "../../src/api";

const mockRequesters: api.Requester[] = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@company.com", department: "Finance" },
  { id: 2, name: "Michael Brown", email: "michael.brown@company.com", department: "Engineering" },
];

describe("SelectRequesterPage (Section 8.1)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the title, explanation text, and breadcrumb", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /Select Development Requester/i })).toBeInTheDocument();
    expect(screen.getByText(/Choose a development requester to simulate the current requester context for Lab 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Development Requester Selection/i)).toBeInTheDocument();
  });

  it("loads and populates the dropdown with active development requesters", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /Development Requester/i })).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox", { name: /Development Requester/i }) as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.options[0].text).toContain("Jennifer Anderson");
    expect(select.options[1].text).toContain("Michael Brown");
  });

  it("displays the info banner and Lab 3 authentication notice", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Only active development requesters are shown/i)).toBeInTheDocument();
    expect(screen.getByText(/Authentication coming in Lab 3/i)).toBeInTheDocument();
  });

  it("calls onSelect when Continue button is clicked", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    const onSelect = vi.fn();
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(onSelect).toHaveBeenCalledWith(mockRequesters[1]);
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    const onCancel = vi.fn();
    render(
      <SelectRequesterPage
        currentRequester={mockRequesters[0]}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalled();
  });

  it("handles safe API-failure state and allows retry", async () => {
    const fetchSpy = vi.spyOn(api, "fetchRequesters").mockRejectedValue(new Error("Network Error"));
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText(/Unable to connect to the backend server/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Loading/i })).toBeInTheDocument();

    // Now test retry
    fetchSpy.mockResolvedValueOnce(mockRequesters);
    fireEvent.click(screen.getByRole("button", { name: /Retry Loading/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("renders empty state if no requesters exist", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([]);
    render(
      <SelectRequesterPage
        currentRequester={null}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No active development requesters found/i)).toBeInTheDocument();
    });
  });
});

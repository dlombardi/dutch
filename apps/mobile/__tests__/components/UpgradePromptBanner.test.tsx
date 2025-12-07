import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { UpgradePromptBanner } from "@/components/ui/upgrade-prompt-banner";

describe("UpgradePromptBanner", () => {
  const mockOnClaim = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders upgrade prompt with correct text", () => {
    render(
      <UpgradePromptBanner onClaim={mockOnClaim} onDismiss={mockOnDismiss} />,
    );

    expect(
      screen.getByText("Add your email to access on all devices"),
    ).toBeTruthy();
    expect(
      screen.getByText("Keep your data safe and get notifications"),
    ).toBeTruthy();
  });

  it("renders Add button", () => {
    render(
      <UpgradePromptBanner onClaim={mockOnClaim} onDismiss={mockOnDismiss} />,
    );

    expect(screen.getByText("Add")).toBeTruthy();
  });

  it("calls onClaim when Add button is pressed", () => {
    render(
      <UpgradePromptBanner onClaim={mockOnClaim} onDismiss={mockOnDismiss} />,
    );

    fireEvent.press(screen.getByTestId("upgrade-prompt-claim-button"));
    expect(mockOnClaim).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when close button is pressed", () => {
    render(
      <UpgradePromptBanner onClaim={mockOnClaim} onDismiss={mockOnDismiss} />,
    );

    fireEvent.press(screen.getByTestId("upgrade-prompt-dismiss-button"));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("has accessible testIDs", () => {
    render(
      <UpgradePromptBanner onClaim={mockOnClaim} onDismiss={mockOnDismiss} />,
    );

    expect(screen.getByTestId("upgrade-prompt-banner")).toBeTruthy();
    expect(screen.getByTestId("upgrade-prompt-claim-button")).toBeTruthy();
    expect(screen.getByTestId("upgrade-prompt-dismiss-button")).toBeTruthy();
  });
});

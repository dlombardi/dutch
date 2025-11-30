import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('renders message when provided', () => {
    render(
      <EmptyState
        title="No items"
        message="Try adding some items to get started"
      />
    );
    expect(screen.getByText('Try adding some items to get started')).toBeTruthy();
  });

  it('does not render message when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText('Try adding')).toBeNull();
  });

  it('renders action button when both actionLabel and onAction are provided', () => {
    const mockOnAction = jest.fn();
    render(
      <EmptyState
        title="No items"
        actionLabel="Add Item"
        onAction={mockOnAction}
      />
    );
    expect(screen.getByText('Add Item')).toBeTruthy();
  });

  it('does not render action button when only actionLabel is provided', () => {
    render(<EmptyState title="No items" actionLabel="Add Item" />);
    expect(screen.queryByText('Add Item')).toBeNull();
  });

  it('does not render action button when only onAction is provided', () => {
    const mockOnAction = jest.fn();
    render(<EmptyState title="No items" onAction={mockOnAction} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onAction when button is pressed', () => {
    const mockOnAction = jest.fn();
    render(
      <EmptyState
        title="No items"
        actionLabel="Add Item"
        onAction={mockOnAction}
      />
    );

    fireEvent.press(screen.getByText('Add Item'));
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('has accessible button with label', () => {
    const mockOnAction = jest.fn();
    render(
      <EmptyState
        title="No items"
        actionLabel="Add Item"
        onAction={mockOnAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeTruthy();
  });
});

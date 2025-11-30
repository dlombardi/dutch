import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders activity indicator by default', () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with message when provided', () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('does not render message when not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('renders full screen container when fullScreen is true', () => {
    const { toJSON } = render(<LoadingSpinner fullScreen />);
    const tree = toJSON();
    // Full screen container has flex: 1
    expect(tree?.props?.style).toEqual(
      expect.objectContaining({ flex: 1 })
    );
  });

  it('renders inline container when fullScreen is false', () => {
    const { toJSON } = render(<LoadingSpinner fullScreen={false} />);
    const tree = toJSON();
    // Inline container has padding: 16, no flex
    expect(tree?.props?.style).toEqual(
      expect.objectContaining({ padding: 16 })
    );
    expect(tree?.props?.style?.flex).toBeUndefined();
  });
});

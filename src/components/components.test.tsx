import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BalanceCard } from './BalanceCard';
import { RequestForm } from './RequestForm';
import { sampleBalances } from '@/storybook/fixtures';

describe('BalanceCard', () => {
  it('renders fresh balance', () => {
    render(
      <BalanceCard
        locationName="New York"
        daysAvailable={12}
        asOf={new Date().toISOString()}
        state="fresh"
      />,
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders stale indicator', () => {
    render(
      <BalanceCard
        locationName="New York"
        daysAvailable={12}
        state="stale"
        stale
      />,
    );
    expect(screen.getByTestId('stale-indicator')).toBeInTheDocument();
  });
});

describe('RequestForm', () => {
  it('blocks submit when days exceed balance', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RequestForm
        balances={sampleBalances}
        onSubmit={onSubmit}
        isSubmitting={false}
        formState="idle"
      />,
    );

    const daysInput = screen.getByRole('spinbutton');
    await user.clear(daysInput);
    await user.type(daysInput, '999');
    expect(screen.getByTestId('insufficient-balance-message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeDisabled();
  });
});

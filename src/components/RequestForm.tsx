import { FormEvent, useState } from 'react';
import type { Balance } from '@/lib/hcm/types';

export type RequestFormState = 'idle' | 'submitting' | 'hcmRejected' | 'insufficientBalance';

type RequestFormProps = {
  balances: Balance[];
  onSubmit: (payload: {
    locationId: string;
    days: number;
    startDate: string;
    endDate: string;
  }) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  formState?: RequestFormState;
  disabled?: boolean;
};

export function RequestForm({
  balances,
  onSubmit,
  isSubmitting,
  errorMessage,
  formState = 'idle',
  disabled = false,
}: RequestFormProps) {
  const [locationId, setLocationId] = useState(balances[0]?.locationId ?? '');
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const selectedBalance = balances.find((balance) => balance.locationId === locationId);
  const insufficient = selectedBalance ? days > selectedBalance.daysAvailable : false;
  const effectiveState =
    formState === 'idle' && insufficient ? 'insufficientBalance' : formState;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!locationId || !startDate || !endDate || insufficient) {
      return;
    }
    onSubmit({ locationId, days, startDate, endDate });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid={`request-form-${effectiveState}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Request time off</h2>
        <p className="text-sm text-slate-600">Submit a request for HR system confirmation.</p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Location</span>
        <select
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          disabled={disabled || isSubmitting}
        >
          {balances.map((balance) => (
            <option key={balance.locationId} value={balance.locationId}>
              {balance.locationName}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Days</span>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          disabled={disabled || isSubmitting}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={disabled || isSubmitting}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={disabled || isSubmitting}
          />
        </label>
      </div>

      {effectiveState === 'insufficientBalance' ? (
        <p className="text-sm text-red-700" data-testid="insufficient-balance-message">
          Requested days exceed available balance.
        </p>
      ) : null}

      {effectiveState === 'hcmRejected' && errorMessage ? (
        <p className="text-sm text-red-700" data-testid="hcm-rejected-message">
          {errorMessage}
        </p>
      ) : null}

      {effectiveState === 'submitting' || isSubmitting ? (
        <p className="text-sm text-blue-700" data-testid="submitting-message">
          Submitted — confirming with HR system…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isSubmitting || insufficient || !startDate || !endDate}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}

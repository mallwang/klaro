import { useState } from 'react';
import {
  Category,
  ContractStatus,
  BillingInterval,
  CATEGORY_LABELS,
  BILLING_INTERVAL_LABELS,
  CANCELLATION_PERIOD_UNIT_LABELS,
} from '@pcm/shared';
import type { CreateContractBody, CancellationPeriodUnit } from '@pcm/shared';

interface ContractFormValues {
  name: string;
  category: string;
  amount: string;
  billingInterval: string;
  status: string;
  endDate: string;
  startDate: string;
  details: string;
  serviceUrl: string;
  cancellationPeriodValue: string;
  cancellationPeriodUnit: string;
}

interface ContractFormProps {
  defaultValues?: Partial<ContractFormValues>;
  onSubmit: (data: CreateContractBody) => void;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
  isPending?: boolean;
}

export function ContractForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  error,
  isPending,
}: ContractFormProps) {
  const [values, setValues] = useState<ContractFormValues>({
    name: defaultValues?.name ?? '',
    category: defaultValues?.category ?? Category.SUBSCRIPTIONS,
    amount: defaultValues?.amount ?? '',
    billingInterval: defaultValues?.billingInterval ?? BillingInterval.MONTHLY,
    status: defaultValues?.status ?? ContractStatus.ACTIVE,
    endDate: defaultValues?.endDate ?? '',
    startDate: defaultValues?.startDate ?? '',
    details: defaultValues?.details ?? '',
    serviceUrl: defaultValues?.serviceUrl ?? '',
    cancellationPeriodValue: defaultValues?.cancellationPeriodValue ?? '',
    cancellationPeriodUnit: defaultValues?.cancellationPeriodUnit ?? 'MONTHS',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!values.name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount < 0) {
      setValidationError('Amount must be a non-negative number.');
      return;
    }

    const cancellationPeriodValueNum = values.cancellationPeriodValue
      ? parseInt(values.cancellationPeriodValue, 10)
      : null;

    onSubmit({
      name: values.name.trim(),
      category: values.category as CreateContractBody['category'],
      amount,
      billingInterval: values.billingInterval as CreateContractBody['billingInterval'],
      status: values.status as CreateContractBody['status'],
      endDate: values.endDate || null,
      startDate: values.startDate || null,
      details: values.details || null,
      serviceUrl: values.serviceUrl || null,
      cancellationPeriod:
        cancellationPeriodValueNum !== null
          ? {
              value: cancellationPeriodValueNum,
              unit: values.cancellationPeriodUnit as CancellationPeriodUnit,
            }
          : null,
    });
  }

  function field(id: string, label: string, input: React.ReactNode) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {input}
      </div>
    );
  }

  let serviceUrlLink: React.ReactNode = null;
  try {
    if (values.serviceUrl) {
      new URL(values.serviceUrl);
      serviceUrlLink = (
        <a
          href={values.serviceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-blue-600 hover:underline"
        >
          {values.serviceUrl}
        </a>
      );
    }
  } catch {
    // invalid URL — no link shown
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {(validationError ?? error) && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {validationError ?? error}
        </p>
      )}

      {field(
        'name',
        'Name *',
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="e.g. Netflix"
        />,
      )}

      {field(
        'category',
        'Category *',
        <select
          id="category"
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>,
      )}

      {field(
        'amount',
        'Amount *',
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={values.amount}
          onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="0.00"
        />,
      )}

      {field(
        'billingInterval',
        'Billing Interval *',
        <select
          id="billingInterval"
          value={values.billingInterval}
          onChange={(e) => setValues((v) => ({ ...v, billingInterval: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {Object.entries(BILLING_INTERVAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>,
      )}

      {field(
        'status',
        'Status *',
        <select
          id="status"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value={ContractStatus.ACTIVE}>Active</option>
          <option value={ContractStatus.INACTIVE}>Inactive</option>
        </select>,
      )}

      {field(
        'endDate',
        'End Date',
        <input
          id="endDate"
          type="date"
          value={values.endDate}
          onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        />,
      )}

      {field(
        'startDate',
        'Start Date',
        <input
          id="startDate"
          type="date"
          value={values.startDate}
          onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        />,
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="details" className="text-sm font-medium">
          Details
        </label>
        <textarea
          id="details"
          value={values.details}
          onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          rows={3}
          maxLength={2000}
          placeholder="Additional notes about this contract"
        />
        <span
          className={`text-right text-xs ${values.details.length >= 1900 ? 'text-red-600' : 'text-[--color-muted-foreground]'}`}
        >
          {values.details.length}/2000
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="serviceUrl" className="text-sm font-medium">
          Service URL
        </label>
        <input
          id="serviceUrl"
          type="url"
          value={values.serviceUrl}
          onChange={(e) => setValues((v) => ({ ...v, serviceUrl: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="https://example.com"
        />
        {serviceUrlLink}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cancellationPeriodValue" className="text-sm font-medium">
          Cancellation Period
        </label>
        <div className="flex gap-2">
          <input
            id="cancellationPeriodValue"
            type="number"
            min="1"
            value={values.cancellationPeriodValue}
            onChange={(e) => setValues((v) => ({ ...v, cancellationPeriodValue: e.target.value }))}
            className="w-24 rounded border px-3 py-1.5 text-sm"
            placeholder="e.g. 30"
          />
          <select
            id="cancellationPeriodUnit"
            aria-label="Cancellation Unit"
            value={values.cancellationPeriodUnit}
            onChange={(e) => setValues((v) => ({ ...v, cancellationPeriodUnit: e.target.value }))}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {Object.entries(CANCELLATION_PERIOD_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-1.5 text-sm hover:bg-[--color-muted]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

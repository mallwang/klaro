import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Checkbox,
  Button,
  Group,
  Stack,
  Alert,
  Text,
  Anchor,
} from '@mantine/core';
import dayjs from 'dayjs';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { Category, ContractStatus, BillingInterval, CancellationPeriodUnit } from '@pcm/shared';
import type { CreateContractBody } from '@pcm/shared';
import { ProviderLogo } from './ProviderLogo.js';
import classes from './ContractForm.module.css';

/**
 * Reusable contract creation/editing form with validation, field defaults, and a compact
 * multi-column layout. The first row shows a live provider logo alongside the name and
 * category fields; the amount field uses a NumberInput with a static EUR badge in the right
 * section; start and end dates use Mantine DatePickerInput with deselection support;
 * amount+interval and status+start+end each share a row; the cancellation period and
 * anonymize checkbox share a row; the logo search name occupies the left half.
 * Used by both the new-contract and edit-contract pages.
 */

/** Internal form state — date fields are Date | null for DatePickerInput binding. */
interface ContractFormValues {
  name: string;
  category: string;
  amount: string | number;
  billingInterval: string;
  status: string;
  endDate: Date | null;
  startDate: Date | null;
  details: string;
  serviceUrl: string;
  cancellationPeriodValue: string | number;
  cancellationPeriodUnit: string;
  anonymize: boolean;
  logoName: string;
  useGenericIcon: boolean;
}

/**
 * Pre-fill values accepted by callers — date fields are ISO strings as returned by the API.
 * The form converts them to Date objects internally.
 */
interface ContractFormDefaultValues {
  name: string;
  category: string;
  amount: string | number;
  billingInterval: string;
  status: string;
  endDate: string | null;
  startDate: string | null;
  details: string;
  serviceUrl: string;
  cancellationPeriodValue: string | number;
  cancellationPeriodUnit: string;
  anonymize: boolean;
  logoName: string;
  useGenericIcon: boolean;
}

interface ContractFormProps {
  readonly defaultValues?: Partial<ContractFormDefaultValues>;
  readonly onSubmit: (data: CreateContractBody) => void;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
  readonly isPending?: boolean;
}

/**
 * Renders a contract creation/editing form with validation and submission handling.
 *
 * @param props.defaultValues - optional pre-filled values for edit mode
 * @param props.onSubmit - callback invoked with the validated contract body
 * @param props.onCancel - callback invoked when the user cancels the form
 * @param props.submitLabel - optional custom label for the submit button
 * @param props.isPending - whether a submission is currently in progress
 */
export function ContractForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
}: ContractFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ContractFormValues>({
    name: defaultValues?.name ?? '',
    category: defaultValues?.category ?? Category.SUBSCRIPTIONS,
    amount: defaultValues?.amount ?? '',
    billingInterval: defaultValues?.billingInterval ?? BillingInterval.MONTHLY,
    status: defaultValues?.status ?? ContractStatus.ACTIVE,
    endDate: defaultValues?.endDate ? dayjs(defaultValues.endDate).toDate() : null,
    startDate: defaultValues?.startDate ? dayjs(defaultValues.startDate).toDate() : null,
    details: defaultValues?.details ?? '',
    serviceUrl: defaultValues?.serviceUrl ?? '',
    cancellationPeriodValue: defaultValues?.cancellationPeriodValue ?? '',
    cancellationPeriodUnit: defaultValues?.cancellationPeriodUnit ?? 'MONTHS',
    anonymize: defaultValues?.anonymize ?? false,
    logoName: defaultValues?.logoName ?? '',
    useGenericIcon: defaultValues?.useGenericIcon ?? false,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (String(values.name).trim() === '') {
      setValidationError(t('contractForm.nameRequired'));
      return;
    }
    const amount =
      typeof values.amount === 'number' ? values.amount : Number.parseFloat(String(values.amount));
    if (Number.isNaN(amount) || amount < 0) {
      setValidationError(t('contractForm.amountInvalid'));
      return;
    }

    const cancellationPeriodValueNum =
      values.cancellationPeriodValue === '' ? null : Number(values.cancellationPeriodValue);

    onSubmit({
      name: String(values.name).trim(),
      category: values.category as CreateContractBody['category'],
      amount,
      billingInterval: values.billingInterval as CreateContractBody['billingInterval'],
      status: values.status as CreateContractBody['status'],
      endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
      startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : null,
      details: values.details || null,
      serviceUrl: values.serviceUrl || null,
      cancellationPeriod:
        cancellationPeriodValueNum === null
          ? null
          : {
              value: cancellationPeriodValueNum,
              unit: values.cancellationPeriodUnit as CancellationPeriodUnit,
            },
      anonymize: values.anonymize,
      logoName: values.logoName || null,
      useGenericIcon: values.useGenericIcon,
    });
  }

  let serviceUrlLink: React.ReactNode = null;
  try {
    if (values.serviceUrl) {
      new URL(String(values.serviceUrl));
      serviceUrlLink = (
        <Anchor
          href={String(values.serviceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          size="xs"
          truncate="end"
        >
          {values.serviceUrl}
        </Anchor>
      );
    }
  } catch {
    // invalid URL — no link shown
  }

  const categoryOptions = Object.values(Category).map((value) => ({
    value,
    label: t(`category.${value}`),
  }));

  const billingIntervalOptions = Object.values(BillingInterval).map((value) => ({
    value,
    label: t(`billingInterval.${value}`),
  }));

  const statusOptions = [
    { value: ContractStatus.ACTIVE, label: t('status.ACTIVE') },
    { value: ContractStatus.INACTIVE, label: t('status.INACTIVE') },
  ];

  const cancellationUnitOptions = Object.values(CancellationPeriodUnit).map((value) => ({
    value,
    label: t(`cancellationUnit.${value}`),
  }));

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {validationError && (
          <Alert role="alert" color="red">
            {validationError}
          </Alert>
        )}

        <div className={classes.nameRow}>
          {values.useGenericIcon ? (
            <ProviderLogo name="" isAnonymized size={40} />
          ) : (
            <ProviderLogo name={String(values.logoName || values.name)} size={40} />
          )}
          <TextInput
            id="name"
            label={t('contractForm.nameLabel')}
            variant="filled"
            value={String(values.name)}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder={t('contractForm.namePlaceholder')}
          />
          <Select
            id="category"
            label={t('contractForm.categoryLabel')}
            variant="filled"
            data={categoryOptions}
            value={String(values.category)}
            onChange={(val) =>
              setValues((v) => ({ ...v, category: val ?? Category.SUBSCRIPTIONS }))
            }
            allowDeselect={false}
          />
        </div>

        <div className={classes.twoColumnRow}>
          <NumberInput
            id="amount"
            label={t('contractForm.amountLabel')}
            variant="filled"
            decimalScale={2}
            min={0}
            value={values.amount === '' ? '' : Number(values.amount)}
            onChange={(val) => setValues((v) => ({ ...v, amount: val }))}
            placeholder="0.00"
            rightSection={
              <Text size="sm" fw={500} c="dimmed" pr="xs">
                EUR
              </Text>
            }
            rightSectionWidth={52}
          />

          <Select
            id="billingInterval"
            label={t('contractForm.billingIntervalLabel')}
            variant="filled"
            data={billingIntervalOptions}
            value={String(values.billingInterval)}
            onChange={(val) =>
              setValues((v) => ({ ...v, billingInterval: val ?? BillingInterval.MONTHLY }))
            }
            allowDeselect={false}
          />
        </div>

        <div className={classes.statusDateRow}>
          <Select
            id="status"
            label={t('contractForm.statusLabel')}
            variant="filled"
            data={statusOptions}
            value={String(values.status)}
            onChange={(val) => setValues((v) => ({ ...v, status: val ?? ContractStatus.ACTIVE }))}
            allowDeselect={false}
          />
          <DatePickerInput
            id="startDate"
            label={t('contractForm.startDateLabel')}
            placeholder={t('contractForm.startDatePlaceholder')}
            variant="filled"
            value={values.startDate}
            onChange={(val) => setValues((v) => ({ ...v, startDate: val }))}
            valueFormat={t('contractForm.datePickerValueFormat')}
            clearable
          />
          <DatePickerInput
            id="endDate"
            label={t('contractForm.endDateLabel')}
            placeholder={t('contractForm.endDatePlaceholder')}
            variant="filled"
            value={values.endDate}
            onChange={(val) => setValues((v) => ({ ...v, endDate: val }))}
            valueFormat={t('contractForm.datePickerValueFormat')}
            clearable
          />
        </div>

        <div>
          <Textarea
            id="details"
            label={t('contractForm.detailsLabel')}
            variant="filled"
            value={String(values.details)}
            onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
            rows={3}
            maxLength={2000}
            placeholder={t('contractForm.detailsPlaceholder')}
          />
          <Text size="xs" ta="right" c={String(values.details).length >= 1900 ? 'red' : 'dimmed'}>
            {String(values.details).length}/2000
          </Text>
        </div>

        <div>
          <TextInput
            id="serviceUrl"
            label={t('contractForm.serviceUrlLabel')}
            variant="filled"
            type="url"
            value={String(values.serviceUrl)}
            onChange={(e) => setValues((v) => ({ ...v, serviceUrl: e.target.value }))}
            placeholder={t('contractForm.serviceUrlPlaceholder')}
          />
          {serviceUrlLink}
        </div>

        <div className={classes.cancellationAnonymizeRow}>
          <div>
            <Text size="sm" fw={500} mb={4}>
              {t('contractForm.cancellationPeriodLabel')}
            </Text>
            <div className={classes.cancellationRow}>
              <NumberInput
                id="cancellationPeriodValue"
                aria-label={t('contractForm.cancellationPeriodLabel')}
                variant="filled"
                min={1}
                value={
                  values.cancellationPeriodValue === ''
                    ? ''
                    : Number(values.cancellationPeriodValue)
                }
                onChange={(val) => setValues((v) => ({ ...v, cancellationPeriodValue: val }))}
                placeholder="e.g. 30"
                className={classes.cancellationNumber}
              />
              <Select
                id="cancellationPeriodUnit"
                aria-label={t('contractForm.cancellationUnitAriaLabel')}
                variant="filled"
                data={cancellationUnitOptions}
                value={String(values.cancellationPeriodUnit)}
                onChange={(val) =>
                  setValues((v) => ({ ...v, cancellationPeriodUnit: val ?? 'MONTHS' }))
                }
                allowDeselect={false}
                className={classes.cancellationUnit}
              />
            </div>
          </div>

          <Checkbox
            id="anonymize"
            label={t('anonymization.anonymizeContract')}
            description={t('anonymization.anonymizeContractHint')}
            checked={values.anonymize}
            onChange={(e) => setValues((v) => ({ ...v, anonymize: e.target.checked }))}
            mt="lg"
          />
        </div>

        <div className={classes.twoColumnRow}>
          <div>
            <TextInput
              id="logoName"
              label={t('contractForm.logoNameLabel')}
              description={t('contractForm.logoNameDescription')}
              variant="filled"
              value={String(values.logoName)}
              onChange={(e) => setValues((v) => ({ ...v, logoName: e.target.value }))}
              placeholder={t('contractForm.logoNamePlaceholder')}
              disabled={values.useGenericIcon}
            />
            <Anchor
              href="https://www.logo.dev/search"
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              mt={4}
              display="inline-block"
            >
              {t('contractForm.logoNameSearchLink')}
            </Anchor>
          </div>
          <Checkbox
            id="useGenericIcon"
            label={t('contractForm.useGenericIconLabel')}
            description={t('contractForm.useGenericIconDescription')}
            checked={values.useGenericIcon}
            onChange={(e) => setValues((v) => ({ ...v, useGenericIcon: e.target.checked }))}
            mt="lg"
          />
        </div>

        <Group gap="sm" pt="xs">
          <Button type="submit" loading={isPending}>
            {isPending ? t('common.saving') : (submitLabel ?? t('common.save'))}
          </Button>
          <Button type="button" variant="default" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

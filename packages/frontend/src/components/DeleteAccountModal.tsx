import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Modal, Stack, Text, Button, Alert, Group } from '@mantine/core';
import type { ContractData } from '@pcm/shared';
import { deleteSelf } from '../services/profile.js';
import { exportToJson } from '../services/export.js';
import { showError } from '../lib/notifications.js';

/**
 * Two-step confirmation modal for permanent self-service account deletion, with an optional
 * contract data export step before confirmation.
 */

interface DeleteAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onDeleted: () => void;
  contracts: ContractData[];
  isSoleAdmin: boolean;
}

/**
 * Renders a two-step modal guiding the user through an optional data export and a final
 * deletion confirmation.
 *
 * @param props - opened: modal open state; onClose: close callback; onDeleted: called on
 *   successful deletion; contracts: the user's contracts offered for export; isSoleAdmin:
 *   disables deletion when the user is the last active admin
 */
export function DeleteAccountModal({
  opened,
  onClose,
  onDeleted,
  contracts,
  isSoleAdmin,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  const deleteMutation = useMutation({
    mutationFn: deleteSelf,
    onSuccess: onDeleted,
    onError: () => showError(t('deleteModal.deleteError')),
  });

  /**
   * Resets the modal to step 1 and clears any mutation state before closing.
   */
  function handleClose() {
    setStep(1);
    deleteMutation.reset();
    onClose();
  }

  /**
   * Advances the modal from the export advisory step to the final confirmation step.
   */
  function handleSkip() {
    setStep(2);
  }

  /**
   * Submits the account deletion request.
   */
  function handleConfirm() {
    deleteMutation.mutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('deleteModal.title')}
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
      {step === 1 ? (
        <Stack gap="md">
          <Text>{t('deleteModal.warningText')}</Text>

          {contracts.length > 0 ? (
            <Button variant="default" onClick={() => exportToJson(contracts)}>
              {t('deleteModal.exportButton')}
            </Button>
          ) : (
            <Text size="sm" c="dimmed">
              {t('deleteModal.emptyContractsNotice')}
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleSkip}>
              {t('deleteModal.skipButton')}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text fw={600}>{t('deleteModal.confirmTitle')}</Text>

          {isSoleAdmin && <Alert color="orange">{t('deleteModal.soleAdminWarning')}</Alert>}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleClose}>
              {t('deleteModal.cancelButton')}
            </Button>
            <Button
              color="red"
              disabled={isSoleAdmin}
              loading={deleteMutation.isPending}
              onClick={handleConfirm}
            >
              {deleteMutation.isPending
                ? t('deleteModal.deleting')
                : t('deleteModal.confirmButton')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

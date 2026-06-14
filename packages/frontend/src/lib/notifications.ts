import { notifications } from '@mantine/notifications';

/**
 * Thin wrappers around @mantine/notifications for displaying success and error
 * toast messages with consistent styling and auto-dismiss behaviour.
 */

/**
 * Shows a green success toast notification that auto-dismisses after 5 seconds.
 *
 * @param message - the text to display in the notification
 */
export function showSuccess(message: string): void {
  notifications.show({ message, color: 'green', autoClose: 5000 });
}

/**
 * Shows a red error toast notification that auto-dismisses after 5 seconds.
 *
 * @param message - the text to display in the notification
 */
export function showError(message: string): void {
  notifications.show({ message, color: 'red', autoClose: 5000 });
}

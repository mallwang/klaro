import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { showSuccess, showError } from '../../src/lib/notifications.js';

function renderWithNotificationsHost() {
  return render(createElement(MantineProvider, {}, createElement(Notifications)));
}

describe('notifications utility', () => {
  beforeEach(() => {
    cleanup();
    notifications.clean();
  });

  it('showSuccess renders the message text in the DOM', async () => {
    renderWithNotificationsHost();
    showSuccess('Great job!');
    expect(await screen.findByText('Great job!')).toBeInTheDocument();
  });

  it('showError renders the message text in the DOM', async () => {
    renderWithNotificationsHost();
    showError('Something went wrong');
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });
});

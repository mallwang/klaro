import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { Faq } from '../../src/pages/Faq.js';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe('Faq', () => {
  it('renders the FAQ section heading', () => {
    render(<Faq />, { wrapper });
    expect(
      screen.getByRole('heading', { name: /frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it('renders one accordion item per FAQ entry', () => {
    render(<Faq />, { wrapper });
    const buttons = screen.getAllByRole('button');
    // Each accordion item renders a button for its control
    expect(buttons.length).toBeGreaterThanOrEqual(10);
  });

  it('renders question text as accordion control labels', () => {
    render(<Faq />, { wrapper });
    expect(
      screen.getByText(/What is Klaro and what problems does it solve\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/How do I add a new contract\?/i)).toBeInTheDocument();
  });

  it('answer panels are initially collapsed (not visible)', () => {
    render(<Faq />, { wrapper });
    // All answer panels start hidden; query by a known phrase in the first answer
    const answerTexts = screen.queryAllByText(/self-hosted app/i);
    answerTexts.forEach((el) => {
      expect(el).not.toBeVisible();
    });
  });

  it('expands an answer when the question button is clicked', async () => {
    const user = userEvent.setup();
    render(<Faq />, { wrapper });
    const firstButton = screen
      .getByText(/What is Klaro and what problems does it solve\?/i)
      .closest('button');
    expect(firstButton).toBeTruthy();
    await user.click(firstButton!);
    const panel = screen.getByText(/self-hosted app/i);
    expect(panel).toBeVisible();
  });

  it('renders without crashing when the component mounts', () => {
    expect(() => render(<Faq />, { wrapper })).not.toThrow();
  });
});

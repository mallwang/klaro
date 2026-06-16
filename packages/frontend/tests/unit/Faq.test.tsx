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
    expect(buttons.length).toBeGreaterThanOrEqual(8);
  });

  it('renders question text as accordion control labels', () => {
    render(<Faq />, { wrapper });
    expect(screen.getByText(/How do I add a new contract\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Can I export my contracts\?/i)).toBeInTheDocument();
  });

  it('answer panel is initially collapsed (not visible)', () => {
    render(<Faq />, { wrapper });
    // Answers contain the word "Lorem" — none should be visible by default
    const answerTexts = screen.queryAllByText(/Lorem ipsum/i);
    answerTexts.forEach((el) => {
      expect(el).not.toBeVisible();
    });
  });

  it('expands an answer when the question button is clicked', async () => {
    const user = userEvent.setup();
    render(<Faq />, { wrapper });
    const firstButton = screen.getByText(/How do I add a new contract\?/i).closest('button');
    expect(firstButton).toBeTruthy();
    await user.click(firstButton!);
    const panel = screen.getByText(/Navigate to the Contracts page/i);
    expect(panel).toBeVisible();
  });

  it('renders without crashing when the component mounts', () => {
    expect(() => render(<Faq />, { wrapper })).not.toThrow();
  });
});

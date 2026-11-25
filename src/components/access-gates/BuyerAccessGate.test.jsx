import { afterEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuyerAccessGate } from './BuyerAccessGate';
import { clearAll } from '../../lib/storage';

/**
 * Buyer self-registration is wired all the way from App (onRegister creates the
 * account), but the form is only reachable through the "Create a buyer account"
 * trigger and only submits once the terms checkbox is ticked. These tests pin
 * both halves: the flow is reachable, and it is gated on consent.
 */

afterEach(() => clearAll());

function renderGate(overrides = {}) {
  const props = {
    onSignedIn: () => {},
    startSignIn: vi.fn(),
    confirmCode: vi.fn(),
    generatedCode: '',
    identifier: '',
    error: '',
    onRegister: vi.fn(),
    accountExists: () => false,
    onGoogle: () => {},
    onMeta: () => {},
    showNotice: vi.fn(),
    ...overrides,
  };
  render(<BuyerAccessGate {...props} />);
  return props;
}

test('the create-account action is reachable from the sign-in form', async () => {
  const user = userEvent.setup();
  renderGate();
  await user.click(screen.getByRole('button', { name: /create a buyer account/i }));
  expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument();
});

test('registration is blocked until the terms checkbox is accepted', async () => {
  const user = userEvent.setup();
  const props = renderGate();
  await user.click(screen.getByRole('button', { name: /create a buyer account/i }));

  const create = screen.getByRole('button', { name: /^create account$/i });
  expect(create).toBeDisabled();

  await user.click(screen.getByRole('checkbox'));
  expect(create).toBeEnabled();

  await user.click(create);
  expect(props.onRegister).toHaveBeenCalledTimes(1);
});
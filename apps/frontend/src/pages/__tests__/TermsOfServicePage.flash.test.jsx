import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TermsOfServicePage from '../TermsOfServicePage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, isAuthenticated: false }))
}));

vi.mock('../../components/SEO/SEOWrapper', () => ({
  default: ({ children }) => <div>{children}</div>
}));

// Regression: the flash-service terms section once rendered `{BANKING}` — an
// undefined JS identifier — crashing the whole Terms page in production.
// Rendering the page at all is the guard; the disclaimer text is asserted so
// the wording stays visible to customers.
describe('TermsOfServicePage — flash service section', () => {
  it('renders without crashing and shows the banking/verified-boot disclaimer', () => {
    render(
      <BrowserRouter>
        <TermsOfServicePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Flashing Service — Refunds, Inspection and Liability/i)).toBeInTheDocument();
    expect(screen.getByText(/GrapheneOS alters the device's verified boot state/i)).toBeInTheDocument();
    expect(screen.getByText(/banking apps may not function on the flashed device/i)).toBeInTheDocument();
    expect(screen.getByText(/not responsible for software incompatibility post-flash/i)).toBeInTheDocument();
  });
});

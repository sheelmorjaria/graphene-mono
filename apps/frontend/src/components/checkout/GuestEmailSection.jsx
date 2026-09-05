import React, { useState } from 'react';
import { useCheckout, isValidEmail } from '../../contexts/CheckoutContext';

// Email capture for guest checkout — the receipt/contact address for
// customers without an account (logged-in users never see this section).
const GuestEmailSection = () => {
  const { guestEmail, setGuestEmail } = useCheckout();
  const [touched, setTouched] = useState(false);

  const invalid = touched && !isValidEmail(guestEmail);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-testid="guest-email-section">
      <label
        htmlFor="guest-email-input"
        className="block text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2"
      >
        Email Address <span className="text-red-500">*</span>
      </label>
      <input
        type="email"
        id="guest-email-input"
        data-testid="guest-email-input"
        value={guestEmail}
        onChange={(e) => setGuestEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-describedby={invalid ? 'guest-email-error' : undefined}
        aria-invalid={invalid}
        autoComplete="email"
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        placeholder="your@email.com"
      />
      {invalid ? (
        <p id="guest-email-error" className="mt-2 text-sm text-red-600" data-testid="guest-email-error">
          Please enter a valid email address — your order confirmation will be sent there.
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Your order confirmation and receipt will be emailed to this address.
        </p>
      )}
    </div>
  );
};

export default GuestEmailSection;

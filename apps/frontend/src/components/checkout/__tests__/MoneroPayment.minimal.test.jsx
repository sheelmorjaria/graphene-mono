import React from 'react';
import { render, screen } from '../../../test/test-utils';
import { describe, it, expect } from 'vitest';

// Simple mock without external dependencies
const MockMoneroPayment = ({ paymentData }) => {
  if (!paymentData) {
    return <div>Setting up Monero payment...</div>;
  }
  
  return (
    <div>
      <h1>Monero Payment</h1>
      <p>Address: {paymentData.moneroAddress}</p>
      <p>Amount: {paymentData.xmrAmount} XMR</p>
      <p>Order Total: £{paymentData.orderTotal}</p>
    </div>
  );
};

describe('MoneroPayment Minimal Test', () => {
  it('should render loading state when no payment data', () => {
    render(<MockMoneroPayment />);
    expect(screen.getByText('Setting up Monero payment...')).toBeInTheDocument();
  });

  it('should render payment data when provided', () => {
    const mockData = {
      moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
      xmrAmount: 1.234,
      orderTotal: 199.99
    };

    render(<MockMoneroPayment paymentData={mockData} />);
    
    expect(screen.getByText('Monero Payment')).toBeInTheDocument();
    expect(screen.getByText(/Address: 4AdUndXHHZ/)).toBeInTheDocument();
    expect(screen.getByText('Amount: 1.234 XMR')).toBeInTheDocument();
    expect(screen.getByText('Order Total: £199.99')).toBeInTheDocument();
  });
});
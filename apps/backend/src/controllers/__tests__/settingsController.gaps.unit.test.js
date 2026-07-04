import { vi, describe, test, beforeEach, expect } from 'vitest';

// ---- Mock models ----
// Each model is a plain constructor function whose instances expose .save().
// We define the constructor inside the factory so that `vi.clearAllMocks()`
// (which resets vi.fn implementations) does NOT destroy the constructor
// behaviour needed by `new Model(data)` in the controller.

vi.mock('../../models/GeneralSettings.js', () => {
  function GeneralSettings() {}
  GeneralSettings.getCurrentSettings = vi.fn();
  GeneralSettings.updateSettings = vi.fn();
  return { default: GeneralSettings };
});

vi.mock('../../models/TaxRate.js', () => {
  function TaxRate(data) { Object.assign(this, data); }
  TaxRate.prototype.save = vi.fn().mockResolvedValue(true);
  TaxRate.find = vi.fn();
  TaxRate.findByIdAndUpdate = vi.fn();
  TaxRate.countDocuments = vi.fn();
  return { default: TaxRate };
});

vi.mock('../../models/PaymentGateway.js', () => {
  function PaymentGateway(data) { Object.assign(this, data); }
  PaymentGateway.prototype.save = vi.fn().mockResolvedValue(true);
  PaymentGateway.getAllWithStatus = vi.fn();
  PaymentGateway.findByIdAndUpdate = vi.fn();
  return { default: PaymentGateway };
});

vi.mock('../../models/ShippingMethod.js', () => {
  function ShippingMethod(data) { Object.assign(this, data); }
  ShippingMethod.prototype.save = vi.fn().mockResolvedValue(true);
  ShippingMethod.find = vi.fn();
  ShippingMethod.findByIdAndUpdate = vi.fn();
  ShippingMethod.countDocuments = vi.fn();
  return { default: ShippingMethod };
});

import {
  getGeneralSettings,
  updateGeneralSettings,
  getShippingSettings,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getTaxSettings,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getPaymentSettings,
  updatePaymentGateway,
  createPaymentGateway,
  togglePaymentGateway
} from '../settingsController.js';

import GeneralSettings from '../../models/GeneralSettings.js';
import TaxRate from '../../models/TaxRate.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import ShippingMethod from '../../models/ShippingMethod.js';

// Chainable query for find().sort().skip().limit().populate().exec() and/or await.
const chainable = (data) => {
  const chain = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(data)
  };
  // Make it thenable so `await Model.find(...)` (no exec) works too.
  chain.then = (resolve, reject) => Promise.resolve(data).then(resolve, reject);
  return chain;
};

const validGeneral = {
  storeName: 'Shop',
  storeEmail: 'shop@example.com',
  defaultCurrency: 'GBP',
  defaultLanguage: 'en-gb'
};

describe('Settings Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks resets mock implementations; re-establish the default
    // instance save() for models that the controller creates via `new Model()`.
    TaxRate.prototype.save = vi.fn().mockResolvedValue(true);
    PaymentGateway.prototype.save = vi.fn().mockResolvedValue(true);
    ShippingMethod.prototype.save = vi.fn().mockResolvedValue(true);
    req = { params: {}, query: {}, body: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  });

  // ---------------- General Settings ----------------
  describe('getGeneralSettings', () => {
    test('happy path', async () => {
      GeneralSettings.getCurrentSettings.mockResolvedValue({ storeName: 'Shop' });
      await getGeneralSettings(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { storeName: 'Shop' } }));
    });
    test('error: 500', async () => {
      GeneralSettings.getCurrentSettings.mockRejectedValue(new Error('fail'));
      await getGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateGeneralSettings', () => {
    test('happy path', async () => {
      const saved = { ...validGeneral };
      GeneralSettings.updateSettings.mockResolvedValue(saved);
      req.body = { ...validGeneral };
      await updateGeneralSettings(req, res);
      expect(GeneralSettings.updateSettings).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('400 when required field missing', async () => {
      req.body = { storeName: 'Shop', storeEmail: 'a@b.com', defaultCurrency: 'GBP' };
      await updateGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'defaultLanguage is required' }));
    });
    test('400 for invalid email format', async () => {
      req.body = { ...validGeneral, storeEmail: 'not-an-email' };
      await updateGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid email format' }));
    });
    test('400 for invalid currency code', async () => {
      req.body = { ...validGeneral, defaultCurrency: 'GB' };
      await updateGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    test('400 for invalid language code', async () => {
      req.body = { ...validGeneral, defaultLanguage: 'ENGLISH' };
      await updateGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    test('500 on update failure', async () => {
      GeneralSettings.updateSettings.mockRejectedValue(new Error('boom'));
      req.body = { ...validGeneral };
      await updateGeneralSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- Shipping Settings ----------------
  describe('getShippingSettings', () => {
    test('happy path with search filter', async () => {
      const methods = [{ name: 'Standard' }];
      ShippingMethod.find.mockReturnValue(chainable(methods));
      ShippingMethod.countDocuments.mockResolvedValue(1);
      req.query = { page: 1, limit: 10, search: 'stan' };
      await getShippingSettings(req, res);
      const filter = ShippingMethod.find.mock.calls[0][0];
      expect(filter.$or).toBeInstanceOf(Array);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('error: 500', async () => {
      ShippingMethod.countDocuments.mockRejectedValue(new Error('fail'));
      await getShippingSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createShippingMethod', () => {
    const validShipping = { name: 'Standard', code: 'STD', baseCost: 5, estimatedDeliveryDays: 3 };
    test('happy path', async () => {
      req.body = { ...validShipping };
      await createShippingMethod(req, res);
      expect(ShippingMethod.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('400 when required field missing', async () => {
      req.body = { name: 'Standard', code: 'STD', baseCost: 5 };
      await createShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'estimatedDeliveryDays is required' }));
    });
    test('400 on duplicate code (11000)', async () => {
      ShippingMethod.prototype.save.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
      req.body = { ...validShipping };
      await createShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Shipping method code must be unique' }));
    });
    test('500 on other error', async () => {
      ShippingMethod.prototype.save.mockRejectedValueOnce(new Error('boom'));
      req.body = { ...validShipping };
      await createShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateShippingMethod', () => {
    test('happy path', async () => {
      ShippingMethod.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
      req.params.methodId = 'm1';
      req.body = { name: 'Updated' };
      await updateShippingMethod(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('404 when not found', async () => {
      ShippingMethod.findByIdAndUpdate.mockResolvedValue(null);
      req.params.methodId = 'm1';
      await updateShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      ShippingMethod.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.methodId = 'm1';
      await updateShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteShippingMethod', () => {
    test('happy path (soft deactivate)', async () => {
      ShippingMethod.findByIdAndUpdate.mockResolvedValue({ isActive: false });
      req.params.methodId = 'm1';
      await deleteShippingMethod(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Shipping method deactivated successfully' }));
    });
    test('404 when not found', async () => {
      ShippingMethod.findByIdAndUpdate.mockResolvedValue(null);
      req.params.methodId = 'm1';
      await deleteShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      ShippingMethod.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.methodId = 'm1';
      await deleteShippingMethod(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- Tax Settings ----------------
  describe('getTaxSettings', () => {
    test('happy path with country + isActive filters', async () => {
      const rates = [{ name: 'VAT' }];
      TaxRate.find.mockReturnValue(chainable(rates));
      TaxRate.countDocuments.mockResolvedValue(1);
      req.query = { country: 'gb', isActive: 'true' };
      await getTaxSettings(req, res);
      const filter = TaxRate.find.mock.calls[0][0];
      expect(filter.country).toBe('GB');
      expect(filter.isActive).toBe(true);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('error: 500', async () => {
      TaxRate.countDocuments.mockRejectedValue(new Error('fail'));
      await getTaxSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTaxRate', () => {
    const validTax = { name: 'VAT', region: 'UK', country: 'GB', rate: 20, type: 'percentage', calculationMethod: 'exclusive' };
    test('happy path', async () => {
      req.body = { ...validTax };
      await createTaxRate(req, res);
      expect(TaxRate.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
    test('400 when required field missing', async () => {
      req.body = { name: 'VAT', region: 'UK', country: 'GB' };
      await createTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'rate is required' }));
    });
    test('400 when rate out of range', async () => {
      req.body = { ...validTax, rate: 150 };
      await createTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Tax rate must be between 0 and 100' }));
    });
    test('400 on duplicate (11000)', async () => {
      TaxRate.prototype.save.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
      req.body = { ...validTax };
      await createTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    test('500 on other error', async () => {
      TaxRate.prototype.save.mockRejectedValueOnce(new Error('boom'));
      req.body = { ...validTax };
      await createTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTaxRate', () => {
    test('happy path', async () => {
      // findByIdAndUpdate(...).populate(...) — return a thenable supporting populate
      TaxRate.findByIdAndUpdate.mockReturnValue(chainable({ name: 'VAT' }));
      req.params.taxRateId = 't1';
      req.body = { rate: 15 };
      await updateTaxRate(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('400 when rate out of range', async () => {
      req.params.taxRateId = 't1';
      req.body = { rate: -5 };
      await updateTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    test('404 when not found', async () => {
      TaxRate.findByIdAndUpdate.mockReturnValue(chainable(null));
      req.params.taxRateId = 't1';
      await updateTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      TaxRate.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.taxRateId = 't1';
      await updateTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTaxRate', () => {
    test('happy path', async () => {
      TaxRate.findByIdAndUpdate.mockResolvedValue({ isActive: false });
      req.params.taxRateId = 't1';
      await deleteTaxRate(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Tax rate deactivated successfully' }));
    });
    test('404 when not found', async () => {
      TaxRate.findByIdAndUpdate.mockResolvedValue(null);
      req.params.taxRateId = 't1';
      await deleteTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      TaxRate.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.taxRateId = 't1';
      await deleteTaxRate(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- Payment Gateway Settings ----------------
  describe('getPaymentSettings', () => {
    test('happy path', async () => {
      PaymentGateway.getAllWithStatus.mockResolvedValue([{ code: 'paypal' }]);
      await getPaymentSettings(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { paymentGateways: [{ code: 'paypal' }] } }));
    });
    test('error: 500', async () => {
      PaymentGateway.getAllWithStatus.mockRejectedValue(new Error('fail'));
      await getPaymentSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updatePaymentGateway', () => {
    test('happy path strips sensitive config', async () => {
      PaymentGateway.findByIdAndUpdate.mockResolvedValue({ code: 'paypal' });
      req.params.gatewayId = 'g1';
      req.body = { config: { paypalSecret: 'secret-value', displayName: 'PayPal' } };
      await updatePaymentGateway(req, res);
      const passedUpdates = PaymentGateway.findByIdAndUpdate.mock.calls[0][1];
      expect(passedUpdates.config.paypalSecret).toBeUndefined();
      expect(passedUpdates.config.displayName).toBe('PayPal');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    test('404 when not found', async () => {
      PaymentGateway.findByIdAndUpdate.mockResolvedValue(null);
      req.params.gatewayId = 'g1';
      req.body = { displayName: 'Pay' };
      await updatePaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      PaymentGateway.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.gatewayId = 'g1';
      await updatePaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPaymentGateway', () => {
    const validGateway = { name: 'PayPal', code: 'paypal', type: 'digital_wallet', provider: 'paypal' };
    test('happy path', async () => {
      req.body = { ...validGateway };
      await createPaymentGateway(req, res);
      expect(PaymentGateway.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
    test('400 when required field missing', async () => {
      req.body = { name: 'PayPal', code: 'paypal' };
      await createPaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'type is required' }));
    });
    test('400 on duplicate code (11000)', async () => {
      PaymentGateway.prototype.save.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
      req.body = { ...validGateway };
      await createPaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Payment gateway code must be unique' }));
    });
    test('500 on other error', async () => {
      PaymentGateway.prototype.save.mockRejectedValueOnce(new Error('boom'));
      req.body = { ...validGateway };
      await createPaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('togglePaymentGateway', () => {
    test('happy path enable', async () => {
      PaymentGateway.findByIdAndUpdate.mockResolvedValue({ isEnabled: true });
      req.params.gatewayId = 'g1';
      req.body = { enabled: true };
      await togglePaymentGateway(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payment gateway enabled successfully' }));
    });
    test('happy path disable', async () => {
      PaymentGateway.findByIdAndUpdate.mockResolvedValue({ isEnabled: false });
      req.params.gatewayId = 'g1';
      req.body = { enabled: false };
      await togglePaymentGateway(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payment gateway disabled successfully' }));
    });
    test('404 when not found', async () => {
      PaymentGateway.findByIdAndUpdate.mockResolvedValue(null);
      req.params.gatewayId = 'g1';
      req.body = { enabled: true };
      await togglePaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test('error: 500', async () => {
      PaymentGateway.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
      req.params.gatewayId = 'g1';
      req.body = { enabled: true };
      await togglePaymentGateway(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

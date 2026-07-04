import { describe, it, expect, afterEach } from 'vitest';
import TaxRate from '../TaxRate.js';
// Import for side-effect: TaxRate.findApplicableRates() calls
// .populate('applicableCategories'), which requires the Category model to be
// registered with mongoose. Importing it here registers the ref.
import '../Category.js';

let counter = 0;
// Build a valid TaxRate doc. Each call varies a uniqueness-contributing field
// (type) so the partial unique index {country,state,postalCode,type,effectiveFrom}
// does not collide across tests in the same suite.
const validRate = (over = {}) => ({
  name: 'UK VAT Standard',
  region: 'United Kingdom',
  country: 'GB',
  rate: 20,
  type: ['VAT', 'GST', 'sales_tax', 'import_duty', 'other'][counter++ % 5],
  ...over
});

describe('TaxRate Model', () => {
  afterEach(async () => {
    await TaxRate.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid tax rate with required fields', async () => {
      const data = validRate();
      const doc = await new TaxRate(data).save();

      expect(doc._id).toBeDefined();
      expect(doc.name).toBe(data.name);
      expect(doc.region).toBe(data.region);
      expect(doc.country).toBe('GB');
      expect(doc.rate).toBe(20);
      expect(doc.type).toBe(data.type);
      expect(doc.calculationMethod).toBe('inclusive');
      expect(doc.isActive).toBe(true);
      expect(doc.createdAt).toBeDefined();
    });

    it('should apply defaults (state, postalCode, calculationMethod, isActive, priority)', async () => {
      const doc = await new TaxRate(validRate()).save();
      expect(doc.state).toBe('');
      expect(doc.postalCode).toBe('');
      expect(doc.calculationMethod).toBe('inclusive');
      expect(doc.type).toBe(doc.type); // provided
      expect(doc.isActive).toBe(true);
      expect(doc.priority).toBe(0);
      expect(doc.minimumOrderValue).toBe(0);
      expect(doc.effectiveFrom).toBeDefined();
      expect(doc.effectiveTo).toBeNull();
      expect(doc.description).toBe('');
    });

    it('should require name', async () => {
      await expect(new TaxRate(validRate({ name: undefined })).save()).rejects.toThrow();
    });

    it('should require region', async () => {
      await expect(new TaxRate(validRate({ region: undefined })).save()).rejects.toThrow();
    });

    it('should require country', async () => {
      await expect(new TaxRate(validRate({ country: undefined })).save()).rejects.toThrow();
    });

    it('should enforce 2-letter uppercase country code', async () => {
      // lowercased input is upper-cased by setter
      const ok = await new TaxRate(validRate({ country: 'us' })).save();
      expect(ok.country).toBe('US');
      // invalid length rejected by match
      await expect(new TaxRate(validRate({ country: 'USA' })).save()).rejects.toThrow();
    });

    it('should reject rate below 0', async () => {
      await expect(new TaxRate(validRate({ rate: -1 })).save()).rejects.toThrow('cannot be negative');
    });

    it('should reject rate above 100', async () => {
      await expect(new TaxRate(validRate({ rate: 101 })).save()).rejects.toThrow('cannot exceed 100');
    });

    it('should require rate', async () => {
      await expect(new TaxRate(validRate({ rate: undefined })).save()).rejects.toThrow();
    });

    it('should enforce type enum', async () => {
      await expect(new TaxRate(validRate({ type: 'bogus' })).save()).rejects.toThrow();
    });

    it('should enforce calculationMethod enum', async () => {
      await expect(new TaxRate(validRate({ calculationMethod: 'bogus' })).save()).rejects.toThrow();
    });

    it('should round rate to 4 decimal places (setter)', async () => {
      const doc = await new TaxRate(validRate({ rate: 20.123456 })).save();
      expect(doc.rate).toBe(20.1235);
    });
  });

  describe('Pre-save validation', () => {
    it('rejects when effectiveFrom is after effectiveTo', async () => {
      const doc = new TaxRate(validRate({
        effectiveFrom: new Date('2025-12-01'),
        effectiveTo: new Date('2025-01-01')
      }));
      await expect(doc.save()).rejects.toThrow('Effective from date cannot be after effective to date');
    });

    it('rejects invalid UK postcode format for GB', async () => {
      const doc = new TaxRate(validRate({ postalCode: 'NOT-A-POSTCODE!' }));
      await expect(doc.save()).rejects.toThrow('Invalid UK postcode format');
    });

    it('accepts a valid UK postcode for GB', async () => {
      const doc = await new TaxRate(validRate({ postalCode: 'SW1A 1AA' })).save();
      expect(doc.postalCode).toBe('SW1A 1AA');
    });
  });

  describe('Virtuals', () => {
    it('formattedRate returns "<rate>%"', async () => {
      const doc = await new TaxRate(validRate({ rate: 17.5 })).save();
      expect(doc.formattedRate).toBe('17.5%');
    });

    it('effectivePeriod returns from - Present when no effectiveTo', async () => {
      const doc = await new TaxRate(validRate()).save();
      expect(doc.effectivePeriod).toContain('Present');
    });
  });

  describe('Instance methods', () => {
    it('isCurrentlyEffective: true for active, in-window rate', async () => {
      const doc = await new TaxRate(validRate({ effectiveFrom: new Date('2020-01-01') })).save();
      expect(doc.isCurrentlyEffective()).toBe(true);
    });

    it('isCurrentlyEffective: false when inactive', async () => {
      const doc = await new TaxRate(validRate({ isActive: false })).save();
      expect(doc.isCurrentlyEffective()).toBe(false);
    });

    it('isCurrentlyEffective: false when effectiveTo is in the past', async () => {
      const doc = await new TaxRate(validRate({
        effectiveFrom: new Date('2010-01-01'),
        effectiveTo: new Date('2011-01-01')
      })).save();
      expect(doc.isCurrentlyEffective()).toBe(false);
    });

    it('calculateTax inclusive extracts the tax from a gross amount', async () => {
      const doc = await new TaxRate(validRate({
        rate: 20,
        calculationMethod: 'inclusive'
      })).save();
      // 120 gross @ 20% inclusive -> tax = 120 - (120/1.2) = 20
      expect(doc.calculateTax(120)).toBeCloseTo(20, 5);
    });

    it('calculateTax exclusive adds tax on top of net amount', async () => {
      const doc = await new TaxRate(validRate({
        rate: 20,
        calculationMethod: 'exclusive'
      })).save();
      // 100 net @ 20% exclusive -> tax = 20
      expect(doc.calculateTax(100)).toBeCloseTo(20, 5);
    });

    it('calculateTax returns 0 when not currently effective', async () => {
      const doc = await new TaxRate(validRate({ isActive: false })).save();
      expect(doc.calculateTax(100)).toBe(0);
    });

    it('calculateTotal inclusive returns the gross unchanged', async () => {
      const doc = await new TaxRate(validRate({
        rate: 20,
        calculationMethod: 'inclusive'
      })).save();
      expect(doc.calculateTotal(120)).toBe(120);
    });

    it('calculateTotal exclusive adds tax to the amount', async () => {
      const doc = await new TaxRate(validRate({
        rate: 20,
        calculationMethod: 'exclusive'
      })).save();
      expect(doc.calculateTotal(100)).toBe(120);
    });

    it('calculateTotal returns amount unchanged when not effective', async () => {
      const doc = await new TaxRate(validRate({ isActive: false })).save();
      expect(doc.calculateTotal(100)).toBe(100);
    });
  });

  describe('Static methods', () => {
    it('findApplicableRates returns active, in-window rates for the country', async () => {
      await new TaxRate(validRate({
        name: 'UK VAT', region: 'UK', country: 'GB', rate: 20, state: ''
      })).save();
      await new TaxRate(validRate({
        name: 'FR VAT', region: 'France', country: 'FR', rate: 20, state: ''
      })).save();

      const rates = await TaxRate.findApplicableRates({ country: 'GB' });
      expect(rates).toHaveLength(1);
      expect(rates[0].country).toBe('GB');
    });

    it('findApplicableRates filters by minimumOrderValue', async () => {
      await new TaxRate(validRate({
        name: 'High threshold', region: 'UK', country: 'GB', minimumOrderValue: 500
      })).save();

      // Order below threshold -> excluded
      const below = await TaxRate.findApplicableRates({ country: 'GB' }, [], 100);
      expect(below).toHaveLength(0);

      // Order above threshold -> included
      const above = await TaxRate.findApplicableRates({ country: 'GB' }, [], 600);
      expect(above).toHaveLength(1);
    });

    it('findApplicableRates excludes expired rates (effectiveTo in past)', async () => {
      await new TaxRate(validRate({
        name: 'Expired', region: 'UK', country: 'GB',
        effectiveFrom: new Date('2010-01-01'),
        effectiveTo: new Date('2011-01-01')
      })).save();

      const rates = await TaxRate.findApplicableRates({ country: 'GB' });
      expect(rates).toHaveLength(0);
    });

    it('calculateCartTax returns zeros when no cart items', async () => {
      const result = await TaxRate.calculateCartTax([], { country: 'GB' });
      expect(result.totalTax).toBe(0);
      expect(result.taxBreakdown).toHaveLength(0);
      expect(result.totalWithTax).toBe(0);
    });

    it('calculateCartTax returns no-tax breakdown when no applicable rates', async () => {
      const items = [{ price: 100, quantity: 2 }];
      const result = await TaxRate.calculateCartTax(items, { country: 'FR' }, 5);
      expect(result.totalTax).toBe(0);
      expect(result.taxableAmount).toBe(200);
      expect(result.totalWithTax).toBe(205); // order value + shipping
    });

    it('calculateCartTax computes inclusive tax for a matching rate', async () => {
      await new TaxRate(validRate({
        name: 'UK VAT', region: 'UK', country: 'GB', rate: 20,
        calculationMethod: 'inclusive', state: ''
      })).save();

      const items = [{ price: 50, quantity: 2 }]; // order value 100
      const result = await TaxRate.calculateCartTax(items, { country: 'GB' }, 20);
      // taxableAmount = 100 + 20 shipping = 120; inclusive tax = 20
      expect(result.taxableAmount).toBe(120);
      expect(result.totalTax).toBe(20);
      expect(result.taxBreakdown).toHaveLength(1);
      expect(result.taxBreakdown[0].name).toBe('UK VAT');
      expect(result.taxBreakdown[0].rate).toBe(20);
    });

    it('findApplicableRates GB: matches by postcode area prefix and excludes mismatches', async () => {
      // Rate scoped to SW postcode area
      await new TaxRate(validRate({
        name: 'London VAT', region: 'London', country: 'GB',
        postalCode: 'SW1A', rate: 20, state: ''
      })).save();

      // Address in SW area -> matched
      const matched = await TaxRate.findApplicableRates({ country: 'GB', postalCode: 'SW1A 1AA' });
      expect(matched).toHaveLength(1);
      expect(matched[0].postalCode).toBe('SW1A');

      // Address in a different area -> excluded by area match
      const excluded = await TaxRate.findApplicableRates({ country: 'GB', postalCode: 'M1 1AA' });
      expect(excluded).toHaveLength(0);
    });

    it('findApplicableRates: state filter matches state-specific or general (empty-state) rates', async () => {
      // General rate (no state)
      await new TaxRate(validRate({
        name: 'General US', region: 'USA', country: 'US', rate: 5, state: ''
      })).save();
      // State-specific rate
      await new TaxRate(validRate({
        name: 'CA Sales Tax', region: 'California', country: 'US', rate: 7.25, state: 'CA'
      })).save();

      const rates = await TaxRate.findApplicableRates({ country: 'US', state: 'CA' });
      const names = rates.map(r => r.name);
      expect(names).toContain('General US');
      expect(names).toContain('CA Sales Tax');
    });
  });
});

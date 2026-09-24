import { describe, it, expect } from 'vitest';
import { DEVICE_SUPPORT_TIMELINE, getSupportInfo } from '../deviceSupport.js';

describe('deviceSupport', () => {
  it('maps every catalog base model to a support window', () => {
    const catalogModels = [
      '7', '7 Pro', '7a', '8', '8 Pro', '8a', 'Fold', '9', '9 Pro XL', '9a',
      '9 Pro Fold', '10', '10a', '10 Pro', '10 Pro XL', '10 Pro Fold'
    ];
    for (const model of catalogModels) {
      const info = getSupportInfo(model);
      expect(info, `missing timeline for ${model}`).not.toBeNull();
      expect(info.supportEnd).toMatch(/^(October|May|August|June) \d{4}$/);
    }
  });

  it('matches case and spacing variants from the API ("7A", "9 pro xl")', () => {
    expect(getSupportInfo('7A').supportEnd).toBe('May 2028');
    expect(getSupportInfo('9 pro xl').supportEnd).toBe('August 2031');
    expect(getSupportInfo('Pixel 10 PRO Fold').supportEnd).toBe('October 2032');
  });

  it('accepts full "Pixel ..." names as well as bare base models', () => {
    expect(getSupportInfo('Pixel 9 Pro XL').supportEnd).toBe('August 2031');
    expect(getSupportInfo('9 Pro XL').supportEnd).toBe('August 2031');
  });

  it('returns null for unknown models and empty input', () => {
    expect(getSupportInfo('Pixel 6')).toBeNull();
    expect(getSupportInfo('')).toBeNull();
    expect(getSupportInfo(null)).toBeNull();
  });
});

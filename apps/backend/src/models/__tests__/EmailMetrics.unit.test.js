import { describe, it, expect, afterEach } from 'vitest';
import EmailMetrics from '../EmailMetrics.js';

let idCounter = 0;
const validMetrics = (over = {}) => ({
  messageId: `msg-${++idCounter}`,
  emailType: 'order_confirmation',
  recipient: 'user@example.com',
  subject: 'Your order confirmation',
  ...over
});

describe('EmailMetrics Model', () => {
  afterEach(async () => {
    await EmailMetrics.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid metrics doc with required fields', async () => {
      const data = validMetrics();
      const doc = await new EmailMetrics(data).save();

      expect(doc._id).toBeDefined();
      expect(doc.messageId).toBe(data.messageId);
      expect(doc.emailType).toBe(data.emailType);
      expect(doc.recipient).toBe(data.recipient);
      expect(doc.subject).toBe(data.subject);
      expect(doc.createdAt).toBeDefined();
    });

    it('should apply defaults (status pending, engagement flags, metadata.provider)', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      expect(doc.status).toBe('pending');
      expect(doc.sentAt).toBeDefined();
      expect(doc.engagement.opened).toBe(false);
      expect(doc.engagement.openCount).toBe(0);
      expect(doc.engagement.clicked).toBe(false);
      expect(doc.engagement.clickCount).toBe(0);
      expect(doc.error.hasError).toBe(false);
      expect(doc.metadata.provider).toBe('ses');
    });

    it('should require messageId', async () => {
      await expect(new EmailMetrics(validMetrics({ messageId: undefined })).save())
        .rejects.toThrow();
    });

    it('should require emailType', async () => {
      await expect(new EmailMetrics(validMetrics({ emailType: undefined })).save())
        .rejects.toThrow();
    });

    it('should require recipient', async () => {
      await expect(new EmailMetrics(validMetrics({ recipient: undefined })).save())
        .rejects.toThrow();
    });

    it('should require subject', async () => {
      await expect(new EmailMetrics(validMetrics({ subject: undefined })).save())
        .rejects.toThrow();
    });

    it('should enforce status enum', async () => {
      const ok = await new EmailMetrics(validMetrics({ status: 'delivered' })).save();
      expect(ok.status).toBe('delivered');
      await expect(new EmailMetrics(validMetrics({ status: 'nope' })).save()).rejects.toThrow();
    });

    it('should enforce messageId uniqueness', async () => {
      await new EmailMetrics(validMetrics({ messageId: 'DUP' })).save();
      await expect(new EmailMetrics(validMetrics({ messageId: 'DUP' })).save()).rejects.toThrow();
    });

    it('should enforce event type enum', async () => {
      const doc = new EmailMetrics(validMetrics({
        events: [{ type: 'bogus' }]
      }));
      await expect(doc.save()).rejects.toThrow();
    });
  });

  describe('Instance method: recordEvent', () => {
    it('records a "sent" event and updates status', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      const updated = await doc.recordEvent('sent');
      expect(updated.status).toBe('sent');
      expect(updated.events).toHaveLength(1);
      expect(updated.events[0].type).toBe('sent');
    });

    it('records "delivered" and updates status', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      expect((await doc.recordEvent('delivered')).status).toBe('delivered');
    });

    it('records "bounced" and updates status', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      expect((await doc.recordEvent('bounced')).status).toBe('bounced');
    });

    it('records "complained" and updates status', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      expect((await doc.recordEvent('complained')).status).toBe('complained');
    });

    it('records "failed" and sets error fields', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      const updated = await doc.recordEvent('failed', { error: 'Timeout' });
      expect(updated.status).toBe('failed');
      expect(updated.error.hasError).toBe(true);
      expect(updated.error.errorMessage).toBe('Timeout');
      expect(updated.error.errorAt).toBeDefined();
    });

    it('"failed" without details defaults error message', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      const updated = await doc.recordEvent('failed');
      expect(updated.error.errorMessage).toBe('Unknown error');
    });

    it('records "opened": sets opened flag, first openedAt, increments count', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      const once = await doc.recordEvent('opened');
      expect(once.engagement.opened).toBe(true);
      expect(once.engagement.openedAt).toBeDefined();
      expect(once.engagement.openCount).toBe(1);

      const twice = await once.recordEvent('opened');
      expect(twice.engagement.openCount).toBe(2);
      // openedAt not overwritten on subsequent opens
      expect(twice.engagement.openedAt.getTime()).toBe(once.engagement.openedAt.getTime());
    });

    it('records "clicked": sets clicked flag, increments count, stores link', async () => {
      const doc = await new EmailMetrics(validMetrics()).save();
      const updated = await doc.recordEvent('clicked', { url: 'https://shop.example.com/p/1' });
      expect(updated.engagement.clicked).toBe(true);
      expect(updated.engagement.clickedAt).toBeDefined();
      expect(updated.engagement.clickCount).toBe(1);
      expect(updated.engagement.clickedLinks).toHaveLength(1);
      expect(updated.engagement.clickedLinks[0].url).toBe('https://shop.example.com/p/1');
    });
  });

  describe('Static methods', () => {
    it('getDeliveryStats aggregates counts by status and computes rates', async () => {
      await new EmailMetrics(validMetrics({ status: 'delivered' })).save();
      await new EmailMetrics(validMetrics({ status: 'delivered' })).save();
      await new EmailMetrics(validMetrics({ status: 'bounced' })).save();

      const stats = await EmailMetrics.getDeliveryStats();
      expect(stats.total).toBe(3);
      expect(stats.delivered).toBe(2);
      expect(stats.bounced).toBe(1);
      expect(stats.deliveryRate).toBe(((2 / 3) * 100).toFixed(2));
      expect(stats.bounceRate).toBe(((1 / 3) * 100).toFixed(2));
    });

    it('getDeliveryStats returns zeros when empty', async () => {
      const stats = await EmailMetrics.getDeliveryStats();
      expect(stats.total).toBe(0);
      expect(stats.deliveryRate).toBeUndefined();
    });

    it('getEngagementStats returns zero-state when no docs', async () => {
      const stats = await EmailMetrics.getEngagementStats();
      expect(stats.totalSent).toBe(0);
      expect(stats.openRate).toBe('0.00');
      expect(stats.clickRate).toBe('0.00');
      expect(stats.clickToOpenRate).toBe('0.00');
    });

    it('getEngagementStats computes open/click rates', async () => {
      // opened
      const a = await new EmailMetrics(validMetrics()).save();
      await a.recordEvent('opened');
      // opened + clicked
      const b = await new EmailMetrics(validMetrics()).save();
      await b.recordEvent('opened');
      await b.recordEvent('clicked', { url: 'https://x' });
      // no engagement
      await new EmailMetrics(validMetrics()).save();

      const stats = await EmailMetrics.getEngagementStats();
      expect(stats.totalSent).toBe(3);
      expect(stats.totalOpened).toBe(2);
      expect(stats.totalClicked).toBe(1);
      expect(stats.openRate).toBe(((2 / 3) * 100).toFixed(2));
      expect(stats.clickToOpenRate).toBe(((1 / 2) * 100).toFixed(2));
    });

    it('getTopPerformingEmails returns clicked emails sorted by clickCount', async () => {
      const low = await new EmailMetrics(validMetrics({ subject: 'Low' })).save();
      await low.recordEvent('clicked', { url: 'https://a' });

      const high = await new EmailMetrics(validMetrics({ subject: 'High' })).save();
      await high.recordEvent('clicked', { url: 'https://b' });
      await high.recordEvent('clicked', { url: 'https://c' });

      // Non-clicked email excluded
      await new EmailMetrics(validMetrics({ subject: 'None' })).save();

      const top = await EmailMetrics.getTopPerformingEmails(10);
      expect(top).toHaveLength(2);
      expect(top[0].subject).toBe('High');
      expect(top[1].subject).toBe('Low');
      expect(top[0].engagement.clickCount).toBe(2);
    });

    it('getEmailTypeStats aggregates per emailType with rates', async () => {
      const a = await new EmailMetrics(validMetrics({ emailType: 'order_confirmation' })).save();
      await a.recordEvent('delivered');
      await a.recordEvent('opened');

      const b = await new EmailMetrics(validMetrics({ emailType: 'order_confirmation' })).save();
      await b.recordEvent('delivered');

      const c = await new EmailMetrics(validMetrics({ emailType: 'shipping' })).save();
      await c.recordEvent('delivered');

      const stats = await EmailMetrics.getEmailTypeStats();
      const orderType = stats.find(s => s.emailType === 'order_confirmation');
      expect(orderType.count).toBe(2);
      expect(orderType.delivered).toBe(2);
      expect(orderType.opened).toBe(1);
      expect(orderType.deliveryRate).toBeCloseTo(100, 5);
    });
  });
});

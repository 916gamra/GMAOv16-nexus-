import { describe, it, expect } from 'vitest';
import { calculateNextDueDate, getComplianceRate } from '@/domain/preventiveScheduling';

describe('Preventive Scheduling Unit Tests', () => {
  it('يجب حساب تاريخ الاستحقاق التالي بشكل صحيح', () => {
    const lastDate = new Date('2024-01-01');
    const frequency = 'WEEKLY';

    const nextDate = calculateNextDueDate(lastDate, frequency);
    expect(nextDate.getTime()).toBeGreaterThan(lastDate.getTime());
    // Difference should be 7 days
    const diffDays = Math.round((nextDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('يجب حساب الاستحقاق الشهري بشكل صحيح', () => {
    const lastDate = new Date('2024-01-01');
    const nextDate = calculateNextDueDate(lastDate, 'MONTHLY');
    expect(nextDate.getMonth()).toBe(1); // February
  });

  it('يجب حساب معدل الامتثال بشكل صحيح', () => {
    const completed = 8;
    const scheduled = 10;

    const rate = getComplianceRate(completed, scheduled);
    expect(rate).toBe(80);
  });

  it('يجب إرجاع 100% إذا لم تكن هناك مهام مجدولة', () => {
    const rate = getComplianceRate(0, 0);
    expect(rate).toBe(100);
  });
});

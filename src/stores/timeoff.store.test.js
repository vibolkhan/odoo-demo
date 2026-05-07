import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTimeoffStore } from './timeoff.store';

describe('Timeoff Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('calculates total entitlement correctly', () => {
    const store = useTimeoffStore();
    store.leaveAllocations = [
      { id: 1, state: 'validate', numberOfDays: 10 },
      { id: 2, state: 'validate', numberOfDays: 5 },
      { id: 3, state: 'confirm', numberOfDays: 3 }, // Should be ignored
    ];
    expect(store.totalEntitlement).toBe(15);
  });

  it('calculates total taken correctly', () => {
    const store = useTimeoffStore();
    store.leaveRequests = [
      { id: 1, state: 'validate', numberOfDays: 2 },
      { id: 2, state: 'confirm', numberOfDays: 3 },
      { id: 3, state: 'refuse', numberOfDays: 5 }, // Should be ignored
    ];
    expect(store.totalTaken).toBe(5);
  });

  it('calculates total remaining correctly', () => {
    const store = useTimeoffStore();
    store.leaveAllocations = [{ id: 1, state: 'validate', numberOfDays: 10 }];
    store.leaveRequests = [{ id: 1, state: 'validate', numberOfDays: 3 }];
    expect(store.totalRemaining).toBe(7);
  });

  it('calculates usage percentage correctly', () => {
    const store = useTimeoffStore();
    store.leaveAllocations = [{ id: 1, state: 'validate', numberOfDays: 10 }];
    store.leaveRequests = [{ id: 1, state: 'validate', numberOfDays: 4 }];
    // Remaining = 6. 6/10 = 60%
    expect(store.usagePercentage).toBe(60);
  });

  it('calculates per-type balances correctly', () => {
    const store = useTimeoffStore();
    store.leaveAllocations = [
      { id: 1, leaveType: 'Annual', numberOfDays: 10, state: 'validate' }
    ];
    store.leaveRequests = [
      { id: 1, leaveType: 'Annual', numberOfDays: 2, state: 'validate' },
      { id: 2, leaveType: 'Sick', numberOfDays: 5, state: 'validate' } // Different type
    ];
    
    const annualBalance = store.balances.find(b => b.name === 'Annual');
    expect(annualBalance.entitlement).toBe(10);
    expect(annualBalance.taken).toBe(2);
    expect(annualBalance.available).toBe(8);
  });
});

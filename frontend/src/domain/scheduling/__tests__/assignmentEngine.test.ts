import { describe, it, expect } from 'vitest';
import { validateAssignment, calculateWarnings, applyAssignment } from '../assignmentEngine';
import type { DomainStaff, DomainShift, DomainDay } from '../types';

// ---------------------------------------------------------------------------
// Factory helpers
//
// Build minimal valid domain objects. Accepting Partial<T> overrides keeps
// each test focused on the one thing that varies, rather than boilerplate.
// ---------------------------------------------------------------------------

function makeStaff(overrides: Partial<DomainStaff> = {}): DomainStaff {
  return { id: 'staff-1', name: 'Alice', role: 'Manager', ...overrides };
}

function makeShift(overrides: Partial<DomainShift> = {}): DomainShift {
  return {
    id: 'shift-1',
    shiftTemplateId: 'tmpl-1',
    startTime: '09:00',
    endTime: '17:00',   // 8-hour default
    roleRequired: 'Manager',
    quantityRequired: 2,
    assignedStaffIds: [],
    ...overrides,
  };
}

function makeDay(shifts: DomainShift[], dayOfWeek = 1): DomainDay {
  return { dayOfWeek, shifts };
}

// ---------------------------------------------------------------------------
// validateAssignment
// ---------------------------------------------------------------------------

describe('validateAssignment', () => {
  describe('hard constraint rejections', () => {
    it('rejects ROLE_MISMATCH when staff role does not match the shift requirement', () => {
      const staff = makeStaff({ role: 'Sales Assistant' });
      const shift = makeShift({ roleRequired: 'Manager' });

      const result = validateAssignment(staff, shift, makeDay([shift]));

      expect(result.valid).toBe(false);
      expect(result.rejection).toBe('ROLE_MISMATCH');
    });

    it('rejects SLOT_FULL when the shift is already at capacity', () => {
      const staff = makeStaff();
      const shift = makeShift({ quantityRequired: 1, assignedStaffIds: ['other-staff'] });

      const result = validateAssignment(staff, shift, makeDay([shift]));

      expect(result.valid).toBe(false);
      expect(result.rejection).toBe('SLOT_FULL');
    });

    it('rejects ALREADY_ASSIGNED when the staff member is already on this shift', () => {
      const staff = makeStaff({ id: 'staff-1' });
      const shift = makeShift({ assignedStaffIds: ['staff-1'] });

      const result = validateAssignment(staff, shift, makeDay([shift]));

      expect(result.valid).toBe(false);
      expect(result.rejection).toBe('ALREADY_ASSIGNED');
    });

    it('rejects OVERLAPPING_SHIFT when staff has a time-overlapping shift on the same day', () => {
      const staff = makeStaff({ id: 'staff-1' });

      // Staff is already assigned to 10:00–14:00.
      // The target shift runs 13:00–17:00 — it overlaps by one hour.
      const existingShift = makeShift({
        shiftTemplateId: 'tmpl-morning',
        startTime: '10:00',
        endTime: '14:00',
        assignedStaffIds: ['staff-1'],
      });
      const targetShift = makeShift({
        shiftTemplateId: 'tmpl-afternoon',
        startTime: '13:00',
        endTime: '17:00',
      });

      const result = validateAssignment(staff, targetShift, makeDay([existingShift, targetShift]));

      expect(result.valid).toBe(false);
      expect(result.rejection).toBe('OVERLAPPING_SHIFT');
    });
  });

  describe('valid cases', () => {
    it('returns valid: true when all hard constraints pass', () => {
      const staff = makeStaff();
      // One slot already taken, one slot remaining (quantityRequired: 2)
      const shift = makeShift({ quantityRequired: 2, assignedStaffIds: ['other-staff'] });

      const result = validateAssignment(staff, shift, makeDay([shift]));

      expect(result.valid).toBe(true);
      expect(result.rejection).toBeUndefined();
    });

    it('allows assignment when staff has an adjacent but non-overlapping shift on the same day', () => {
      const staff = makeStaff({ id: 'staff-1' });

      // Staff finishes at 13:00; target starts at 14:00 — adjacent, not overlapping.
      const morningShift = makeShift({
        shiftTemplateId: 'tmpl-morning',
        startTime: '09:00',
        endTime: '13:00',
        assignedStaffIds: ['staff-1'],
      });
      const afternoonShift = makeShift({
        shiftTemplateId: 'tmpl-afternoon',
        startTime: '14:00',
        endTime: '17:00',
      });

      const result = validateAssignment(staff, afternoonShift, makeDay([morningShift, afternoonShift]));

      expect(result.valid).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateWarnings
//
// MAX_WEEKLY_HOURS = 40, NEAR_LIMIT_THRESHOLD = 0.9
// Near-limit fires when: projected >= 36h (40 × 0.9)
// Exceeds fires when:    projected > 40h
// ---------------------------------------------------------------------------

describe('calculateWarnings', () => {
  it('returns no warnings when projected hours are well under the limit', () => {
    const shift = makeShift({ startTime: '09:00', endTime: '13:00' }); // 4h
    // projected: 20 + 4 = 24h — no threshold triggered
    expect(calculateWarnings(shift, 20)).toEqual([]);
  });

  it('returns NEAR_WEEKLY_LIMIT when projected hours reach the 90% threshold', () => {
    const shift = makeShift({ startTime: '09:00', endTime: '17:00' }); // 8h
    // projected: 28 + 8 = 36h = 40 × 0.9 — exactly at the threshold
    const result = calculateWarnings(shift, 28);

    expect(result).toContain('NEAR_WEEKLY_LIMIT');
    expect(result).not.toContain('EXCEEDS_WEEKLY_HOURS');
  });

  it('returns EXCEEDS_WEEKLY_HOURS when projected hours exceed the weekly limit', () => {
    const shift = makeShift({ startTime: '09:00', endTime: '17:00' }); // 8h
    // projected: 33 + 8 = 41h — over the 40h cap
    const result = calculateWarnings(shift, 33);

    expect(result).toContain('EXCEEDS_WEEKLY_HOURS');
    expect(result).not.toContain('NEAR_WEEKLY_LIMIT');
  });

  it('returns an empty array when the shift has no start or end time', () => {
    const shift = makeShift({ startTime: '', endTime: '' });
    // Duration cannot be calculated — treat as no warning
    expect(calculateWarnings(shift, 39)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// applyAssignment
// ---------------------------------------------------------------------------

describe('applyAssignment', () => {
  describe('SHIFT_NOT_FOUND', () => {
    it('returns SHIFT_NOT_FOUND when the shiftTemplateId does not match any shift', () => {
      const days = [makeDay([makeShift({ shiftTemplateId: 'tmpl-1' })])];

      const result = applyAssignment('staff-1', 'tmpl-does-not-exist', days);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('SHIFT_NOT_FOUND');
      }
    });

    it('returns SHIFT_NOT_FOUND when no days are provided', () => {
      const result = applyAssignment('staff-1', 'tmpl-1', []);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('SHIFT_NOT_FOUND');
      }
    });
  });

  describe('successful state transition', () => {
    it('appends the staffId to the target shift', () => {
      const shift = makeShift({ shiftTemplateId: 'tmpl-1', assignedStaffIds: [] });
      const result = applyAssignment('staff-1', 'tmpl-1', [makeDay([shift])]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.updatedDays[0].shifts[0].assignedStaffIds).toContain('staff-1');
      }
    });

    it('preserves existing assignedStaffIds when appending a new one', () => {
      const shift = makeShift({
        shiftTemplateId: 'tmpl-1',
        assignedStaffIds: ['existing-staff'],
        quantityRequired: 3,
      });
      const result = applyAssignment('new-staff', 'tmpl-1', [makeDay([shift])]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.updatedDays[0].shifts[0].assignedStaffIds).toEqual([
          'existing-staff',
          'new-staff',
        ]);
      }
    });

    it('does not affect sibling shifts on the same day', () => {
      const targetShift = makeShift({ shiftTemplateId: 'tmpl-target', assignedStaffIds: [] });
      const siblingShift = makeShift({ shiftTemplateId: 'tmpl-sibling', assignedStaffIds: ['original'] });
      const result = applyAssignment('new-staff', 'tmpl-target', [makeDay([targetShift, siblingShift])]);

      expect(result.success).toBe(true);
      if (result.success) {
        const sibling = result.updatedDays[0].shifts.find(s => s.shiftTemplateId === 'tmpl-sibling');
        expect(sibling?.assignedStaffIds).toEqual(['original']);
      }
    });

    it('does not affect other days', () => {
      const targetDay = makeDay([makeShift({ shiftTemplateId: 'tmpl-1' })], 1);
      const otherDay = makeDay([makeShift({ shiftTemplateId: 'tmpl-other' })], 2);
      const result = applyAssignment('staff-1', 'tmpl-1', [targetDay, otherDay]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Other day is structurally identical to what was passed in
        expect(result.updatedDays[1]).toEqual(otherDay);
      }
    });
  });

  describe('immutability', () => {
    it('does not mutate the original assignedStaffIds array', () => {
      const shift = makeShift({ shiftTemplateId: 'tmpl-1', assignedStaffIds: [] });
      const days = [makeDay([shift])];
      const snapshotBefore = [...shift.assignedStaffIds];

      applyAssignment('staff-1', 'tmpl-1', days);

      expect(days[0].shifts[0].assignedStaffIds).toEqual(snapshotBefore);
    });

    it('returns a new reference at every level of the updated path', () => {
      const shift = makeShift({ shiftTemplateId: 'tmpl-1' });
      const days = [makeDay([shift])];
      const result = applyAssignment('staff-1', 'tmpl-1', days);

      expect(result.success).toBe(true);
      if (result.success) {
        // The updated path (days array → day → shift) must all be new objects.
        // Unchanged nodes in the tree may still share references, but the
        // path from root to the mutated leaf must be fully reconstructed.
        expect(result.updatedDays).not.toBe(days);
        expect(result.updatedDays[0]).not.toBe(days[0]);
        expect(result.updatedDays[0].shifts[0]).not.toBe(days[0].shifts[0]);
      }
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase to keep unit tests fast and isolated
vi.mock('./firebase', () => ({
  db: {},
  auth: {},
  isFirebaseConfigured: true,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

import { verifyOrCreateStudent } from './studentService';

describe('Student Service & Identity Verification (Specification §10)', () => {
  it('registers a new student when National ID is not in database', () => {
    const data = {
      fullName: 'Ahmed Hassan',
      phone: '01012345678',
      email: 'ahmed@example.com',
      nationalId: '29901011234567',
    };

    const { student, error } = verifyOrCreateStudent(data);
    expect(error).toBeNull();
    expect(student).not.toBeNull();
    expect(student?.nationalId).toBe('29901011234567');
    expect(student?.fullName).toBe('Ahmed Hassan');
  });

  it('allows access when existing National ID matches all records (Name, Phone, Email)', () => {
    const data = {
      fullName: 'Sara Mohamed',
      phone: '01198765432',
      email: 'sara@example.com',
      nationalId: '29802021234567',
    };

    // First entry: create
    const firstResult = verifyOrCreateStudent(data);
    expect(firstResult.error).toBeNull();

    // Second entry (e.g. for Post-Test or next course): matching details
    const secondResult = verifyOrCreateStudent(data);
    expect(secondResult.error).toBeNull();
    expect(secondResult.student?.id).toBe(firstResult.student?.id);
  });

  it('blocks attempt when National ID exists but Name differs (§10)', () => {
    const initial = {
      fullName: 'Mahmoud Ali',
      phone: '01234567890',
      email: 'mahmoud@example.com',
      nationalId: '29505051234567',
    };
    verifyOrCreateStudent(initial);

    // Mismatched Name
    const conflicting = {
      fullName: 'Different Person',
      phone: '01234567890',
      email: 'mahmoud@example.com',
      nationalId: '29505051234567',
    };

    const { student, error } = verifyOrCreateStudent(conflicting);
    expect(student).toBeNull();
    expect(error).toContain('Identity Verification Failed');
    expect(error).toContain('Name');
  });

  it('blocks attempt when National ID exists but Phone differs (§10)', () => {
    const initial = {
      fullName: 'Yousef Ehab',
      phone: '01099998888',
      email: 'yousef@example.com',
      nationalId: '29707071234567',
    };
    verifyOrCreateStudent(initial);

    // Mismatched Phone
    const conflicting = {
      fullName: 'Yousef Ehab',
      phone: '01000000000',
      email: 'yousef@example.com',
      nationalId: '29707071234567',
    };

    const { student, error } = verifyOrCreateStudent(conflicting);
    expect(student).toBeNull();
    expect(error).toContain('Phone Number');
  });

  it('returns error when any required field is missing', () => {
    const invalid = {
      fullName: '',
      phone: '01012345678',
      email: 'test@example.com',
      nationalId: '29901011234567',
    };

    const { student, error } = verifyOrCreateStudent(invalid);
    expect(student).toBeNull();
    expect(error).toContain('All fields');
  });
});

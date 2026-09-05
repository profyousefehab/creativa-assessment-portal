import { describe, it, expect, vi } from 'vitest';

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
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
}));

import { createCategory, getCategories, deleteCategory } from './categoryService';
import { createCourse } from './courseService';

describe('Category Service & Management', () => {
  it('creates a new category and retrieves it', () => {
    const cat = createCategory('Cloud Computing');
    expect(cat.name).toBe('Cloud Computing');
    const all = getCategories();
    expect(all.some((c) => c.id === cat.id)).toBe(true);
  });

  it('deletes an unused category successfully', () => {
    const cat = createCategory('Robotics Automation');
    const result = deleteCategory(cat.id);
    expect(result.success).toBe(true);
    expect(getCategories().some((c) => c.id === cat.id)).toBe(false);
  });

  it('prevents deleting a category that is currently assigned to a course', () => {
    const cat = createCategory('Embedded Systems');
    createCourse({
      name: 'IoT & Microcontrollers Cohort 1',
      instructorName: 'Dr. Mahmoud',
      categoryId: cat.id,
      startDate: '2026-09-01',
      endDate: '2026-10-01',
    });

    const result = deleteCategory(cat.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot delete');
    expect(getCategories().some((c) => c.id === cat.id)).toBe(true);
  });
});

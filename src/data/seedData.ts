import {
  Category,
  Course,
  Assessment,
  Student,
  Attempt,
  AuditLog,
  CoordinatorUser,
} from '../types';

export const INITIAL_COORDINATOR: CoordinatorUser = {
  id: '',
  email: '',
  name: '',
  role: 'COORDINATOR',
};

export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_COURSES: Course[] = [];
export const INITIAL_ASSESSMENTS: Assessment[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_ATTEMPTS: Attempt[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

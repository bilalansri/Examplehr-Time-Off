import type { Balance, TimeOffRequest } from '@/lib/hcm/types';

export const sampleBalances: Balance[] = [
  {
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    locationName: 'New York',
    daysAvailable: 12,
    asOf: new Date().toISOString(),
  },
  {
    employeeId: 'emp-001',
    locationId: 'loc-sf',
    locationName: 'San Francisco',
    daysAvailable: 8,
    asOf: new Date().toISOString(),
  },
];

export const sampleRequests: TimeOffRequest[] = [
  {
    id: 'req-1',
    employeeId: 'emp-001',
    employeeName: 'Alex Rivera',
    locationId: 'loc-nyc',
    locationName: 'New York',
    days: 2,
    startDate: '2026-06-10',
    endDate: '2026-06-11',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'req-2',
    employeeId: 'emp-001',
    employeeName: 'Alex Rivera',
    locationId: 'loc-sf',
    locationName: 'San Francisco',
    days: 1,
    startDate: '2026-05-20',
    endDate: '2026-05-20',
    status: 'needs_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    silentMismatch: true,
  },
];

import type { Balance, EmployeeProfile, LocationProfile, TimeOffRequest } from './types';

export const EMPLOYEES: EmployeeProfile[] = [
  { id: 'emp-001', name: 'Alex Rivera', managerId: 'mgr-001' },
  { id: 'mgr-001', name: 'Jordan Lee', managerId: 'mgr-001' },
];

export const LOCATIONS: LocationProfile[] = [
  { id: 'loc-nyc', name: 'New York' },
  { id: 'loc-sf', name: 'San Francisco' },
  { id: 'loc-lon', name: 'London' },
];

export function createSeedBalances(): Balance[] {
  const asOf = new Date().toISOString();
  return [
    {
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      locationName: 'New York',
      daysAvailable: 12,
      asOf,
    },
    {
      employeeId: 'emp-001',
      locationId: 'loc-sf',
      locationName: 'San Francisco',
      daysAvailable: 8,
      asOf,
    },
    {
      employeeId: 'emp-001',
      locationId: 'loc-lon',
      locationName: 'London',
      daysAvailable: 5,
      asOf,
    },
  ];
}

export function createSeedRequests(): TimeOffRequest[] {
  return [];
}

import { createSeedBalances, createSeedRequests, EMPLOYEES, LOCATIONS } from './seed';
import type {
  ApproveRequestPayload,
  Balance,
  BatchBalancesResponse,
  CellBalanceResponse,
  HCMError,
  SimulationConfig,
  SubmitRequestPayload,
  TimeOffRequest,
} from './types';

type StoreState = {
  balances: Balance[];
  requests: TimeOffRequest[];
  corpusVersion: number;
  config: SimulationConfig;
  pendingSilentFailures: Set<string>;
  anniversaryTimer: ReturnType<typeof setInterval> | null;
};

const defaultConfig: SimulationConfig = {
  silentFailureRate: 0.05,
  batchDelayMs: 800,
  cellDelayMs: 200,
  anniversaryBonusDays: 3,
  anniversaryIntervalMs: 60000,
};

function createInitialState(): StoreState {
  return {
    balances: createSeedBalances(),
    requests: createSeedRequests(),
    corpusVersion: 1,
    config: { ...defaultConfig },
    pendingSilentFailures: new Set(),
    anniversaryTimer: null,
  };
}

let store: StoreState = createInitialState();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findBalance(employeeId: string, locationId: string): Balance | undefined {
  return store.balances.find(
    (balance) => balance.employeeId === employeeId && balance.locationId === locationId,
  );
}

function bumpCorpus(): void {
  store.corpusVersion += 1;
  const asOf = new Date().toISOString();
  store.balances = store.balances.map((balance) => ({ ...balance, asOf }));
}

function shouldSilentFail(): boolean {
  return Math.random() < store.config.silentFailureRate;
}

function getEmployeeName(employeeId: string): string {
  return EMPLOYEES.find((employee) => employee.id === employeeId)?.name ?? employeeId;
}

function getLocationName(locationId: string): string {
  return LOCATIONS.find((location) => location.id === locationId)?.name ?? locationId;
}

function isValidDimension(employeeId: string, locationId: string): boolean {
  const employeeExists = EMPLOYEES.some((employee) => employee.id === employeeId);
  const locationExists = LOCATIONS.some((location) => location.id === locationId);
  return employeeExists && locationExists;
}

export const hcmStore = {
  reset(config?: Partial<SimulationConfig>): void {
    if (store.anniversaryTimer) {
      clearInterval(store.anniversaryTimer);
    }
    store = createInitialState();
    if (config) {
      store.config = { ...store.config, ...config };
    }
    if (store.config.anniversaryIntervalMs > 0) {
      store.anniversaryTimer = setInterval(() => {
        hcmStore.applyAnniversaryBonus('emp-001');
      }, store.config.anniversaryIntervalMs);
    }
  },

  getConfig(): SimulationConfig {
    return { ...store.config };
  },

  setConfig(config: Partial<SimulationConfig>): void {
    store.config = { ...store.config, ...config };
  },

  async getBatchBalances(employeeId: string): Promise<BatchBalancesResponse> {
    await delay(store.config.batchDelayMs);
    const balances = store.balances.filter((balance) => balance.employeeId === employeeId);
    return {
      employeeId,
      balances,
      corpusVersion: store.corpusVersion,
    };
  },

  async getCellBalance(employeeId: string, locationId: string): Promise<CellBalanceResponse | HCMError> {
    await delay(store.config.cellDelayMs);
    const balance = findBalance(employeeId, locationId);
    if (!balance) {
      return { code: 'INVALID_DIMENSION', message: 'Balance cell not found' };
    }
    return { ...balance, corpusVersion: store.corpusVersion };
  },

  async submitRequest(payload: SubmitRequestPayload): Promise<{ request: TimeOffRequest } | HCMError> {
    if (!isValidDimension(payload.employeeId, payload.locationId)) {
      return { code: 'INVALID_DIMENSION', message: 'Invalid employee or location combination' };
    }

    const balance = findBalance(payload.employeeId, payload.locationId);
    if (!balance) {
      return { code: 'INVALID_DIMENSION', message: 'Balance cell not found' };
    }

    if (balance.daysAvailable < payload.days) {
      return { code: 'INSUFFICIENT_BALANCE', message: 'Not enough balance for this request' };
    }

    const now = new Date().toISOString();
    const request: TimeOffRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      employeeId: payload.employeeId,
      employeeName: getEmployeeName(payload.employeeId),
      locationId: payload.locationId,
      locationName: getLocationName(payload.locationId),
      days: payload.days,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      snapshotBalance: balance.daysAvailable,
    };

    const silentFail = shouldSilentFail();
    if (silentFail) {
      store.pendingSilentFailures.add(request.id);
      store.requests = [request, ...store.requests];
      return { request };
    }

    store.balances = store.balances.map((entry) =>
      entry.employeeId === payload.employeeId && entry.locationId === payload.locationId
        ? { ...entry, daysAvailable: entry.daysAvailable - payload.days, asOf: now }
        : entry,
    );
    store.requests = [request, ...store.requests];
    bumpCorpus();
    return { request };
  },

  async listRequests(status?: string): Promise<TimeOffRequest[]> {
    if (!status) {
      return [...store.requests];
    }
    return store.requests.filter((request) => request.status === status);
  },

  async getRequest(id: string): Promise<TimeOffRequest | undefined> {
    return store.requests.find((request) => request.id === id);
  },

  async updateRequest(id: string, payload: ApproveRequestPayload): Promise<{ request: TimeOffRequest } | HCMError> {
    const request = store.requests.find((entry) => entry.id === id);
    if (!request) {
      return { code: 'NOT_FOUND', message: 'Request not found' };
    }

    const balance = findBalance(request.employeeId, request.locationId);
    if (!balance) {
      return { code: 'INVALID_DIMENSION', message: 'Balance cell not found' };
    }

    if (payload.action === 'deny') {
      const now = new Date().toISOString();
      if (request.status === 'pending') {
        store.balances = store.balances.map((entry) =>
          entry.employeeId === request.employeeId && entry.locationId === request.locationId
            ? { ...entry, daysAvailable: entry.daysAvailable + request.days, asOf: now }
            : entry,
        );
        bumpCorpus();
      }
      const updated: TimeOffRequest = {
        ...request,
        status: 'denied',
        updatedAt: now,
      };
      store.requests = store.requests.map((entry) => (entry.id === id ? updated : entry));
      return { request: updated };
    }

    if (payload.action === 'approve') {
      if (
        payload.snapshotBalance !== undefined &&
        balance.daysAvailable !== payload.snapshotBalance
      ) {
        return {
          code: 'CONFLICT',
          message: 'Balance changed since review. Approval rejected.',
        };
      }

      if (balance.daysAvailable < request.days) {
        return { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance at approval time' };
      }
    }

    const now = new Date().toISOString();
    const updated: TimeOffRequest = {
      ...request,
      status: 'approved',
      updatedAt: now,
    };
    store.requests = store.requests.map((entry) => (entry.id === id ? updated : entry));
    return { request: updated };
  },

  async confirmRequest(id: string): Promise<{ request: TimeOffRequest; silentMismatch: boolean } | HCMError> {
    const request = store.requests.find((entry) => entry.id === id);
    if (!request) {
      return { code: 'NOT_FOUND', message: 'Request not found' };
    }

    const balance = findBalance(request.employeeId, request.locationId);
    if (!balance) {
      return { code: 'INVALID_DIMENSION', message: 'Balance cell not found' };
    }

    const silentMismatch = store.pendingSilentFailures.has(id);
    if (silentMismatch) {
      store.pendingSilentFailures.delete(id);
      const updated: TimeOffRequest = {
        ...request,
        status: 'needs_review',
        silentMismatch: true,
        updatedAt: new Date().toISOString(),
      };
      store.requests = store.requests.map((entry) => (entry.id === id ? updated : entry));
      return { request: updated, silentMismatch: true };
    }

    const expectedBalance = (request.snapshotBalance ?? balance.daysAvailable + request.days) - request.days;
    if (balance.daysAvailable > expectedBalance + 0.001) {
      const updated: TimeOffRequest = {
        ...request,
        status: 'needs_review',
        silentMismatch: true,
        updatedAt: new Date().toISOString(),
      };
      store.requests = store.requests.map((entry) => (entry.id === id ? updated : entry));
      return { request: updated, silentMismatch: true };
    }

    const updated: TimeOffRequest = {
      ...request,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    };
    store.requests = store.requests.map((entry) => (entry.id === id ? updated : entry));
    return { request: updated, silentMismatch: false };
  },

  applyAnniversaryBonus(employeeId: string): BatchBalancesResponse {
    const now = new Date().toISOString();
    store.balances = store.balances.map((balance) =>
      balance.employeeId === employeeId
        ? {
            ...balance,
            daysAvailable: balance.daysAvailable + store.config.anniversaryBonusDays,
            asOf: now,
          }
        : balance,
    );
    bumpCorpus();
    return {
      employeeId,
      balances: store.balances.filter((balance) => balance.employeeId === employeeId),
      corpusVersion: store.corpusVersion,
    };
  },

  forceSilentFailureNext(): void {
    store.config = { ...store.config, silentFailureRate: 1 };
  },

  restoreSilentFailureRate(): void {
    store.config = { ...store.config, silentFailureRate: defaultConfig.silentFailureRate };
  },
};

hcmStore.reset();

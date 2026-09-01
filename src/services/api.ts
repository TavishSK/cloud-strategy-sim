import type {
  Microservice,
  SimulationSession,
  Experiment,
  DashboardStats,
  AnalyticsData,
  ScalingStrategy,
  TrafficPattern
} from '../types.ts';
import { clientSim } from './clientSim.ts';

const BASE_URL = '/api';

async function fetchWithFallback<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      if (fallbackFn) {
        return fallbackFn();
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  async login(email?: string, password?: string) {
    return fetchWithFallback(
      `${BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      },
      () => ({
        success: true,
        token: 'fallback-jwt-token-2026',
        user: { name: 'Principal Cloud Architect', email: email || 'admin@cloud.infra' }
      })
    );
  },

  async getMe() {
    return fetchWithFallback(
      `${BASE_URL}/auth/me`,
      undefined,
      () => ({ name: 'Principal Cloud Architect', email: 'admin@cloud.infra' })
    );
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchWithFallback(
      `${BASE_URL}/dashboard/stats`,
      undefined,
      () => clientSim.getDashboardStats()
    );
  },

  // Services
  async getServices(): Promise<Microservice[]> {
    return fetchWithFallback(
      `${BASE_URL}/services`,
      undefined,
      () => clientSim.getServices()
    );
  },

  async getService(id: string): Promise<Microservice & { telemetry?: any[] }> {
    return fetchWithFallback(
      `${BASE_URL}/services/${id}`,
      undefined,
      () => {
        const s = clientSim.getService(id);
        if (!s) throw new Error('Microservice not found');
        return s;
      }
    );
  },

  async createService(data: {
    name: string;
    type: string;
    description: string;
    initialReplicas: number;
    minReplicas: number;
    maxReplicas: number;
    workloadPattern: TrafficPattern;
    cpuBaseline: number;
    responseBaseline: number;
    strategy?: ScalingStrategy;
    strategies?: ScalingStrategy[];
  }): Promise<Microservice> {
    return fetchWithFallback(
      `${BASE_URL}/services`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => clientSim.createService(data)
    );
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    return fetchWithFallback(
      `${BASE_URL}/services/${id}`,
      { method: 'DELETE' },
      () => clientSim.deleteService(id)
    );
  },

  // Live Simulations
  async getLiveSimulation(): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/live`,
      undefined,
      () => clientSim.getLiveSimulation()
    );
  },

  async startSimulation(data: {
    serviceId: string;
    strategy?: ScalingStrategy;
    strategies?: ScalingStrategy[];
    workloadProfile?: string;
    minReplicas?: number;
    maxReplicas?: number;
  }): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/start`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => clientSim.startSimulation(data)
    );
  },

  async pauseSimulation(id: string): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/${id}/pause`,
      { method: 'POST' },
      () => clientSim.pauseSimulation()
    );
  },

  async resumeSimulation(id: string): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/${id}/resume`,
      { method: 'POST' },
      () => clientSim.resumeSimulation()
    );
  },

  async stopSimulation(id: string): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/${id}/stop`,
      { method: 'POST' },
      () => clientSim.stopSimulation()
    );
  },

  async restartSimulation(id: string): Promise<SimulationSession> {
    return fetchWithFallback(
      `${BASE_URL}/simulations/${id}/restart`,
      { method: 'POST' },
      () => clientSim.restartSimulation()
    );
  },

  // Experiments
  async getExperiments(): Promise<Experiment[]> {
    return fetchWithFallback(
      `${BASE_URL}/experiments`,
      undefined,
      () => clientSim.getExperiments()
    );
  },

  async getExperiment(id: string): Promise<Experiment> {
    return fetchWithFallback(
      `${BASE_URL}/experiments/${id}`,
      undefined,
      () => {
        const exp = clientSim.getExperiment(id);
        if (!exp) throw new Error('Experiment not found');
        return exp;
      }
    );
  },

  async runExperiment(data: {
    strategies: ScalingStrategy[];
    durationHours: number;
    workloadProfile: string;
    serviceId?: string;
  }): Promise<Experiment> {
    return fetchWithFallback(
      `${BASE_URL}/experiments/run`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => clientSim.runExperiment(data)
    );
  },

  // Analytics
  async getAnalytics(timeframe = 'Last 1 Hour'): Promise<AnalyticsData> {
    return fetchWithFallback(
      `${BASE_URL}/analytics?timeframe=${encodeURIComponent(timeframe)}`,
      undefined,
      () => clientSim.getAnalytics(timeframe)
    );
  },

  // Settings
  async getSettings(): Promise<any> {
    return fetchWithFallback(
      `${BASE_URL}/settings`,
      undefined,
      () => clientSim.getSettings()
    );
  },

  async updateSettings(data: any): Promise<any> {
    return fetchWithFallback(
      `${BASE_URL}/settings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => clientSim.updateSettings(data)
    );
  }
};

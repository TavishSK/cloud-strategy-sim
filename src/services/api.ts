import type {
  Microservice,
  SimulationSession,
  Experiment,
  DashboardStats,
  AnalyticsData,
  ScalingStrategy,
  TrafficPattern
} from '../types.ts';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email?: string, password?: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<{ success: boolean; token: string; user: any }>(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return handleResponse<any>(res);
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Services
  async getServices(): Promise<Microservice[]> {
    const res = await fetch(`${BASE_URL}/services`);
    return handleResponse<Microservice[]>(res);
  },

  async getService(id: string): Promise<Microservice & { telemetry?: any[] }> {
    const res = await fetch(`${BASE_URL}/services/${id}`);
    return handleResponse<Microservice & { telemetry?: any[] }>(res);
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
    strategy: ScalingStrategy;
  }): Promise<Microservice> {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Microservice>(res);
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/services/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  // Live Simulations
  async getLiveSimulation(): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/live`);
    return handleResponse<SimulationSession>(res);
  },

  async startSimulation(data: {
    serviceId: string;
    strategy?: ScalingStrategy;
    workloadProfile?: string;
    minReplicas?: number;
    maxReplicas?: number;
  }): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<SimulationSession>(res);
  },

  async pauseSimulation(id: string): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/${id}/pause`, { method: 'POST' });
    return handleResponse<SimulationSession>(res);
  },

  async resumeSimulation(id: string): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/${id}/resume`, { method: 'POST' });
    return handleResponse<SimulationSession>(res);
  },

  async stopSimulation(id: string): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/${id}/stop`, { method: 'POST' });
    return handleResponse<SimulationSession>(res);
  },

  async restartSimulation(id: string): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulations/${id}/restart`, { method: 'POST' });
    return handleResponse<SimulationSession>(res);
  },

  // Experiments
  async getExperiments(): Promise<Experiment[]> {
    const res = await fetch(`${BASE_URL}/experiments`);
    return handleResponse<Experiment[]>(res);
  },

  async getExperiment(id: string): Promise<Experiment> {
    const res = await fetch(`${BASE_URL}/experiments/${id}`);
    return handleResponse<Experiment>(res);
  },

  async runExperiment(data: {
    strategies: ScalingStrategy[];
    durationHours: number;
    workloadProfile: string;
    serviceId?: string;
  }): Promise<Experiment> {
    const res = await fetch(`${BASE_URL}/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Experiment>(res);
  },

  // Analytics
  async getAnalytics(timeframe = 'Last 1 Hour'): Promise<AnalyticsData> {
    const res = await fetch(`${BASE_URL}/analytics?timeframe=${encodeURIComponent(timeframe)}`);
    return handleResponse<AnalyticsData>(res);
  },

  // Settings
  async getSettings(): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse<any>(res);
  },

  async updateSettings(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  }
};

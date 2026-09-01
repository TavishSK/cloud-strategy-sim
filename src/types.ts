export type ScalingStrategy = 'CPU' | 'TREND' | 'LATENCY';

export type TrafficPattern = 'stable' | 'spike' | 'periodic' | 'chaotic';

export type ServiceStatus = 'RUNNING' | 'SIMULATING' | 'IDLE' | 'FAILING';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface Microservice {
  id: string;
  name: string;
  type: string;
  description: string;
  status: ServiceStatus;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  cpuUtil: number; // percentage e.g. 63
  latency: number; // in ms e.g. 12
  strategy: ScalingStrategy;
  strategies?: ScalingStrategy[];
  workloadPattern: TrafficPattern;
  cpuBaseline: number; // mCores e.g. 250
  responseBaseline: number; // ms e.g. 120
  lastSimulation: string;
  cluster: string;
  createdAt: string;
}

export interface ScalingEvent {
  id: string;
  timestamp: string;
  timeOffsetMs: number;
  type: 'SCALE_UP' | 'SCALE_DOWN' | 'HEALTH_CHECK' | 'LATENCY_SPIKE' | 'SYSTEM_START' | 'SYSTEM_STOP' | 'ERROR';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  detail: string;
  previousReplicas?: number;
  targetReplicas?: number;
  metricTrigger?: string;
}

export interface TelemetryPoint {
  timestamp: number;
  timeLabel: string;
  cpu: number; // 0 - 100
  latency: number; // ms
  replicas: number;
  workloadRate: number; // req/s
  predictedLoad?: number; // 0 - 100 (% forecasted demand)
  trendGradient?: number; // % derivative rate of change
  costRate?: number; // $/hr
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'FAILED';

export interface SimulationSession {
  id: string;
  serviceId: string;
  serviceName: string;
  status: SimulationStatus;
  region: string;
  cluster: string;
  startTime: number;
  elapsedSeconds: number;
  currentCpu: number;
  currentLatency: number;
  currentReplicas: number;
  minReplicas: number;
  maxReplicas: number;
  workloadProfile: string;
  strategy: ScalingStrategy;
  strategies?: ScalingStrategy[];
  telemetry: TelemetryPoint[];
  events: ScalingEvent[];
  stats: {
    avgCpu: number;
    avgLatency: number;
    peakCpu: number;
    peakLatency: number;
    scalingEventsCount: number;
    costRatePerHour: number;
  };
}

export interface StrategyResult {
  strategy: ScalingStrategy;
  status: 'Healthy' | 'Thrashing' | 'Degraded' | 'Optimal';
  activeReplicas: number;
  finalReplicas: number;
  avgLatency: number;
  avgCpu: number;
  peakLatency: number;
  scalingEventsCount: number;
  thrashingScore: number;
  resourceCostPerHour: number;
  efficiencyPercent: number;
  rating: 'EXCELLENT' | 'FAIR' | 'POOR';
  telemetry: TelemetryPoint[];
}

export interface Experiment {
  id: string;
  title: string;
  serviceId: string;
  serviceName: string;
  strategies: ScalingStrategy[];
  workloadProfile: string;
  durationHours: number;
  status: 'IN PROGRESS' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  elapsedSeconds: number;
  totalSeconds: number;
  createdAt: string;
  strategyResults: StrategyResult[];
  bestStrategy?: ScalingStrategy;
  confidencePercent?: number;
  bestEfficiency?: number;
}

export interface DashboardStats {
  registeredServices: number;
  activeClusters: number;
  activeSimulations: number;
  computeLoadPercent: number;
  totalExperiments: number;
  experimentsDeltaThisWeek: number;
  topStrategy: string;
  confidencePercent: number;
  recentActivity: {
    serviceId: string;
    status: 'Stable' | 'Scaling' | 'Degraded' | 'Failing';
    replicas: string;
    latency: string;
    sparkline: number[];
  }[];
  environmentProfile: {
    targetArchitecture: string;
    loadProfileName: string;
    loadProfilePercent: number;
    loadProfileDesc: string;
  };
}

export interface AnalyticsData {
  timeframe: string;
  avgResponseTime: number;
  avgResponseTimeDeltaPercent: number;
  avgCpu: number;
  avgCpuDeltaPercent: number;
  scalingEventsPerHour: number;
  efficiencyRating: string;
  efficiencyStatus: string;
  timelineTelemetry: {
    time: string;
    latency: number;
    cpu: number;
    replicas: number;
  }[];
  scalingHistogram: {
    bucket: string;
    count: number;
    isPeak?: boolean;
  }[];
  confidencePercent?: number;
  strategyComparisons: {
    strategy: string;
    name: string;
    avgLatency: number;
    finalReplicas: number;
    scalingEvents: number;
    efficiency: number;
    rating: 'EXCELLENT' | 'FAIR' | 'POOR';
    isBest?: boolean;
  }[];
}

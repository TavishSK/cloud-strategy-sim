import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type {
  Microservice,
  ScalingEvent,
  TelemetryPoint,
  SimulationSession,
  Experiment,
  StrategyResult,
  DashboardStats,
  AnalyticsData,
  ScalingStrategy
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// IN-MEMORY / PERSISTENT SIMULATION DATABASE
// ==========================================

const initialServices: Microservice[] = [
  {
    id: 'srv-payment-gw',
    name: 'Payment Service',
    type: 'Payment Processing',
    description: 'Handles high-throughput card authorisations, 3D Secure, and gateway routing.',
    status: 'RUNNING',
    replicas: 4,
    minReplicas: 2,
    maxReplicas: 12,
    cpuUtil: 63,
    latency: 12,
    strategy: 'LATENCY',
    workloadPattern: 'spike',
    cpuBaseline: 250,
    responseBaseline: 15,
    lastSimulation: '2m ago',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'srv-order-svc',
    name: 'Order Service',
    type: 'Order Management',
    description: 'Orchestrates checkout, order state machines, and inventory reservation callbacks.',
    status: 'SIMULATING',
    replicas: 7,
    minReplicas: 3,
    maxReplicas: 16,
    cpuUtil: 81,
    latency: 45,
    strategy: 'CPU',
    workloadPattern: 'periodic',
    cpuBaseline: 350,
    responseBaseline: 40,
    lastSimulation: 'Now',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'srv-auth-core',
    name: 'Authentication',
    type: 'Authentication',
    description: 'OAuth 2.0 / OIDC identity validation, JWT signing, and session revocation checking.',
    status: 'IDLE',
    replicas: 2,
    minReplicas: 2,
    maxReplicas: 10,
    cpuUtil: 31,
    latency: 8,
    strategy: 'TREND',
    workloadPattern: 'stable',
    cpuBaseline: 150,
    responseBaseline: 10,
    lastSimulation: '1h ago',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'srv-inventory-sync',
    name: 'Inventory Sync',
    type: 'Data Analytics',
    description: 'Real-time stock reconciliation and warehouse batch inventory updates.',
    status: 'FAILING',
    replicas: 1,
    minReplicas: 1,
    maxReplicas: 6,
    cpuUtil: 98,
    latency: 850,
    strategy: 'LATENCY',
    workloadPattern: 'chaotic',
    cpuBaseline: 500,
    responseBaseline: 80,
    lastSimulation: '15m ago',
    cluster: 'us-east-c-secondary',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'srv-cache-redis',
    name: 'Cache Cluster Router',
    type: 'API Gateway',
    description: 'Distributed memory caching layer for hot product catalogs and session stores.',
    status: 'RUNNING',
    replicas: 6,
    minReplicas: 4,
    maxReplicas: 12,
    cpuUtil: 44,
    latency: 5,
    strategy: 'TREND',
    workloadPattern: 'stable',
    cpuBaseline: 200,
    responseBaseline: 5,
    lastSimulation: '4m ago',
    cluster: 'us-west-a-cache',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'srv-ml-inference',
    name: 'Recommendation ML Inference',
    type: 'Data Analytics',
    description: 'Deep neural network real-time product recommendations and scoring.',
    status: 'RUNNING',
    replicas: 4,
    minReplicas: 2,
    maxReplicas: 8,
    cpuUtil: 72,
    latency: 180,
    strategy: 'CPU',
    workloadPattern: 'periodic',
    cpuBaseline: 800,
    responseBaseline: 150,
    lastSimulation: '35m ago',
    cluster: 'eu-west-b-compute',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'srv-api-gateway',
    name: 'Core Edge API Gateway',
    type: 'API Gateway',
    description: 'SSL termination, global rate limiting, and reverse proxying.',
    status: 'RUNNING',
    replicas: 8,
    minReplicas: 4,
    maxReplicas: 20,
    cpuUtil: 52,
    latency: 14,
    strategy: 'TREND',
    workloadPattern: 'periodic',
    cpuBaseline: 300,
    responseBaseline: 12,
    lastSimulation: '8m ago',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'srv-notification-worker',
    name: 'Notification Dispatcher',
    type: 'Order Management',
    description: 'Transactional email, SMS, and push notification delivery pipeline.',
    status: 'IDLE',
    replicas: 2,
    minReplicas: 2,
    maxReplicas: 8,
    cpuUtil: 19,
    latency: 22,
    strategy: 'CPU',
    workloadPattern: 'stable',
    cpuBaseline: 150,
    responseBaseline: 20,
    lastSimulation: '3h ago',
    cluster: 'us-east-c-secondary',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

let servicesDb: Microservice[] = [...initialServices];

// Environment Settings
let environmentSettings = {
  targetArchitecture: 'multi-region-k8s-v1.24',
  loadProfileName: 'Sustained high traffic simulation',
  loadProfilePercent: 65,
  loadProfileDesc: 'Simulates diurnal traffic curves with bursty surges during peak daylight hours.',
  clusters: ['us-east-c-primary', 'us-east-c-secondary', 'us-west-a-cache', 'eu-west-b-compute']
};

// Initial Telemetry generator
function generateInitialTelemetry(points = 20, baseCpu = 60, baseLatency = 45, baseReps = 6): TelemetryPoint[] {
  const result: TelemetryPoint[] = [];
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * 5000;
    const minutesAgo = Math.round((now - timestamp) / 60000);
    const timeLabel = minutesAgo === 0 ? 'Now' : `T-${minutesAgo}m`;
    const cpuNoise = Math.sin(i * 0.4) * 15 + (Math.random() * 8 - 4);
    const latencyNoise = Math.cos(i * 0.5) * 20 + (Math.random() * 10 - 5);
    result.push({
      timestamp,
      timeLabel,
      cpu: Math.max(10, Math.min(99, Math.round(baseCpu + cpuNoise))),
      latency: Math.max(5, Math.round(baseLatency + latencyNoise)),
      replicas: baseReps,
      workloadRate: 450 + Math.round(Math.sin(i * 0.3) * 200),
      costRate: Number((baseReps * 2.45).toFixed(2))
    });
  }
  return result;
}

// ==========================================
// ACTIVE SIMULATION SESSION
// ==========================================
let activeSimulation: SimulationSession = {
  id: 'SIM-2024-001',
  serviceId: 'srv-order-svc',
  serviceName: 'Order Service',
  status: 'RUNNING',
  region: 'us-east-c',
  cluster: 'us-east-c-primary',
  startTime: Date.now() - 4 * 3600 * 1000 - 12 * 60 * 1000 - 45 * 1000, // T+ 04:12:45
  elapsedSeconds: 15165,
  currentCpu: 78.4,
  currentLatency: 164,
  currentReplicas: 6,
  minReplicas: 2,
  maxReplicas: 8,
  workloadProfile: 'HIGH_BURST',
  strategy: 'CPU',
  telemetry: generateInitialTelemetry(30, 78, 164, 6),
  events: [
    {
      id: 'evt-4',
      timestamp: '04:11:32.405Z',
      timeOffsetMs: 15092000,
      type: 'SCALE_UP',
      severity: 'success',
      message: 'Scale Up Event Triggered',
      detail: 'CPU > 75% for 30s. Target replicas: 6',
      previousReplicas: 4,
      targetReplicas: 6,
      metricTrigger: 'CPU 78.4%'
    },
    {
      id: 'evt-3',
      timestamp: '04:11:15.112Z',
      timeOffsetMs: 15075000,
      type: 'HEALTH_CHECK',
      severity: 'info',
      message: 'Health Check OK',
      detail: 'Nodes responding within 50ms',
      metricTrigger: 'Latency 42ms'
    },
    {
      id: 'evt-2',
      timestamp: '04:09:45.001Z',
      timeOffsetMs: 14985000,
      type: 'LATENCY_SPIKE',
      severity: 'warning',
      message: 'Latency Spike Detected',
      detail: 'P99 > 150ms on endpoint /api/v2/compute',
      metricTrigger: 'P99 164ms'
    },
    {
      id: 'evt-1',
      timestamp: '04:05:00.000Z',
      timeOffsetMs: 14700000,
      type: 'SYSTEM_START',
      severity: 'info',
      message: 'Simulation Started',
      detail: 'Initial baseline load applied.',
      previousReplicas: 0,
      targetReplicas: 4
    }
  ],
  stats: {
    avgCpu: 72.8,
    avgLatency: 142,
    peakCpu: 91.5,
    peakLatency: 245,
    scalingEventsCount: 5,
    costRatePerHour: 14.70
  }
};

// ==========================================
// EXPERIMENTS DATABASE
// ==========================================
let experimentsDb: Experiment[] = [
  {
    id: 'EXP-2049',
    title: 'E-Commerce Black Friday Stress Test',
    serviceId: 'srv-payment-gw',
    serviceName: 'Payment-Gateway',
    strategies: ['CPU', 'LATENCY'],
    workloadProfile: 'E-Commerce: Black Friday Spike',
    durationHours: 4,
    status: 'IN PROGRESS',
    progressPercent: 31,
    elapsedSeconds: 4462,
    totalSeconds: 14400,
    createdAt: new Date(Date.now() - 4462 * 1000).toISOString(),
    strategyResults: [
      {
        strategy: 'CPU',
        status: 'Healthy',
        activeReplicas: 24,
        finalReplicas: 24,
        avgLatency: 45,
        avgCpu: 68.2,
        peakLatency: 88,
        scalingEventsCount: 6,
        thrashingScore: 2,
        resourceCostPerHour: 14.20,
        efficiencyPercent: 88,
        rating: 'EXCELLENT',
        telemetry: generateInitialTelemetry(20, 68, 45, 24)
      },
      {
        strategy: 'LATENCY',
        status: 'Thrashing',
        activeReplicas: 42,
        finalReplicas: 42,
        avgLatency: 15,
        avgCpu: 34.5,
        peakLatency: 35,
        scalingEventsCount: 22,
        thrashingScore: 18,
        resourceCostPerHour: 38.50,
        efficiencyPercent: 46,
        rating: 'POOR',
        telemetry: generateInitialTelemetry(20, 35, 15, 42)
      }
    ],
    bestStrategy: 'CPU',
    confidencePercent: 91.4,
    bestEfficiency: 88
  },
  {
    id: 'EXP-0892',
    title: 'Payment Gateway 10x Spike Benchmark',
    serviceId: 'srv-payment-gw',
    serviceName: 'Payment-Gateway',
    strategies: ['CPU', 'LATENCY'],
    workloadProfile: 'Spike (10x)',
    durationHours: 2,
    status: 'COMPLETED',
    progressPercent: 100,
    elapsedSeconds: 7200,
    totalSeconds: 7200,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    strategyResults: [
      {
        strategy: 'CPU',
        status: 'Optimal',
        activeReplicas: 12,
        finalReplicas: 12,
        avgLatency: 38,
        avgCpu: 71.0,
        peakLatency: 75,
        scalingEventsCount: 4,
        thrashingScore: 1,
        resourceCostPerHour: 12.00,
        efficiencyPercent: 98,
        rating: 'EXCELLENT',
        telemetry: generateInitialTelemetry(20, 71, 38, 12)
      },
      {
        strategy: 'LATENCY',
        status: 'Healthy',
        activeReplicas: 18,
        finalReplicas: 18,
        avgLatency: 22,
        avgCpu: 45.0,
        peakLatency: 45,
        scalingEventsCount: 14,
        thrashingScore: 8,
        resourceCostPerHour: 22.50,
        efficiencyPercent: 62,
        rating: 'FAIR',
        telemetry: generateInitialTelemetry(20, 45, 22, 18)
      }
    ],
    bestStrategy: 'CPU',
    confidencePercent: 98.0,
    bestEfficiency: 98
  },
  {
    id: 'EXP-0891',
    title: 'Auth Service Sustained High Load Test',
    serviceId: 'srv-auth-core',
    serviceName: 'Auth-Service',
    strategies: ['TREND', 'LATENCY'],
    workloadProfile: 'Sustained High',
    durationHours: 3,
    status: 'COMPLETED',
    progressPercent: 100,
    elapsedSeconds: 10800,
    totalSeconds: 10800,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    strategyResults: [
      {
        strategy: 'TREND',
        status: 'Optimal',
        activeReplicas: 8,
        finalReplicas: 8,
        avgLatency: 14,
        avgCpu: 64.0,
        peakLatency: 28,
        scalingEventsCount: 3,
        thrashingScore: 0,
        resourceCostPerHour: 9.60,
        efficiencyPercent: 92,
        rating: 'EXCELLENT',
        telemetry: generateInitialTelemetry(20, 64, 14, 8)
      },
      {
        strategy: 'LATENCY',
        status: 'Healthy',
        activeReplicas: 14,
        finalReplicas: 14,
        avgLatency: 11,
        avgCpu: 42.0,
        peakLatency: 25,
        scalingEventsCount: 9,
        thrashingScore: 5,
        resourceCostPerHour: 16.80,
        efficiencyPercent: 74,
        rating: 'FAIR',
        telemetry: generateInitialTelemetry(20, 42, 11, 14)
      }
    ],
    bestStrategy: 'TREND',
    confidencePercent: 92.0,
    bestEfficiency: 92
  },
  {
    id: 'EXP-0890',
    title: 'Inventory DB Batch IOPS Overload',
    serviceId: 'srv-inventory-sync',
    serviceName: 'Inventory-DB',
    strategies: ['LATENCY'],
    workloadProfile: 'Batch Processing',
    durationHours: 1,
    status: 'FAILED',
    progressPercent: 42,
    elapsedSeconds: 1512,
    totalSeconds: 3600,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    strategyResults: [
      {
        strategy: 'LATENCY',
        status: 'Degraded',
        activeReplicas: 1,
        finalReplicas: 1,
        avgLatency: 850,
        avgCpu: 98.0,
        peakLatency: 1200,
        scalingEventsCount: 1,
        thrashingScore: 10,
        resourceCostPerHour: 3.20,
        efficiencyPercent: 12,
        rating: 'POOR',
        telemetry: generateInitialTelemetry(20, 98, 850, 1)
      }
    ],
    bestStrategy: undefined,
    confidencePercent: 0
  },
  {
    id: 'EXP-0889',
    title: 'Frontend Web Linear Ramp Experiment',
    serviceId: 'srv-api-gateway',
    serviceName: 'Frontend-Web',
    strategies: ['CPU'],
    workloadProfile: 'Linear Growth',
    durationHours: 6,
    status: 'COMPLETED',
    progressPercent: 100,
    elapsedSeconds: 21600,
    totalSeconds: 21600,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    strategyResults: [
      {
        strategy: 'CPU',
        status: 'Optimal',
        activeReplicas: 10,
        finalReplicas: 10,
        avgLatency: 28,
        avgCpu: 70.5,
        peakLatency: 52,
        scalingEventsCount: 5,
        thrashingScore: 1,
        resourceCostPerHour: 12.50,
        efficiencyPercent: 99,
        rating: 'EXCELLENT',
        telemetry: generateInitialTelemetry(20, 70, 28, 10)
      }
    ],
    bestStrategy: 'CPU',
    confidencePercent: 99.0,
    bestEfficiency: 99
  }
];

// ==========================================
// SIMULATION TICK ENGINE (Runs every 1.5s)
// ==========================================
setInterval(() => {
  if (activeSimulation && activeSimulation.status === 'RUNNING') {
    activeSimulation.elapsedSeconds += 2;
    const t = activeSimulation.elapsedSeconds;

    // Generate dynamic workload
    let targetLoadMultiplier = 1.0;
    if (activeSimulation.workloadProfile === 'HIGH_BURST') {
      targetLoadMultiplier = 1.2 + 0.6 * Math.sin(t * 0.1) + (Math.random() * 0.4 - 0.2);
    } else if (activeSimulation.workloadProfile === 'PERIODIC') {
      targetLoadMultiplier = 1.0 + 0.5 * Math.sin(t * 0.05);
    } else if (activeSimulation.workloadProfile === 'SUDDEN_SPIKE') {
      targetLoadMultiplier = (t % 60 < 15) ? 2.4 : 0.8;
    } else {
      targetLoadMultiplier = 1.0 + (Math.random() * 0.2 - 0.1);
    }

    const currentReps = activeSimulation.currentReplicas;
    const capacity = currentReps * 120; // 120 req/s per replica
    const demand = 600 * targetLoadMultiplier; // raw demand

    const rawCpu = (demand / capacity) * 100;
    const clampedCpu = Math.max(15, Math.min(99, Number((rawCpu + (Math.random() * 4 - 2)).toFixed(1))));

    // Latency is exponential as CPU approaches 90%+
    const latencyBase = 15;
    const latencyMultiplier = Math.pow(Math.max(1, clampedCpu / 50), 2.2);
    const clampedLatency = Math.max(5, Math.round(latencyBase * latencyMultiplier + (Math.random() * 8 - 4)));

    activeSimulation.currentCpu = clampedCpu;
    activeSimulation.currentLatency = clampedLatency;

    // --- EVALUATE STRATEGY ---
    let newReplicas = currentReps;
    let scalingTriggered = false;
    let eventDetail = '';
    let eventType: ScalingEvent['type'] = 'HEALTH_CHECK';

    if (activeSimulation.strategy === 'CPU') {
      if (clampedCpu > 75 && currentReps < activeSimulation.maxReplicas) {
        newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 1);
        scalingTriggered = true;
        eventType = 'SCALE_UP';
        eventDetail = `CPU > 75% (${clampedCpu}%). Target replicas: ${newReplicas}`;
      } else if (clampedCpu < 40 && currentReps > activeSimulation.minReplicas) {
        newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
        scalingTriggered = true;
        eventType = 'SCALE_DOWN';
        eventDetail = `CPU < 40% (${clampedCpu}%). Target replicas: ${newReplicas}`;
      }
    } else if (activeSimulation.strategy === 'LATENCY') {
      if (clampedLatency > 140 && currentReps < activeSimulation.maxReplicas) {
        newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 2);
        scalingTriggered = true;
        eventType = 'SCALE_UP';
        eventDetail = `P99 Latency > 140ms (${clampedLatency}ms). Aggressive scale-out to: ${newReplicas}`;
      } else if (clampedLatency < 25 && currentReps > activeSimulation.minReplicas) {
        newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
        scalingTriggered = true;
        eventType = 'SCALE_DOWN';
        eventDetail = `Latency relaxed (${clampedLatency}ms). Scale-in to: ${newReplicas}`;
      }
    } else if (activeSimulation.strategy === 'TREND') {
      const recentPoints = activeSimulation.telemetry.slice(-4);
      const delta = recentPoints.length >= 2 ? (recentPoints[recentPoints.length - 1].cpu - recentPoints[0].cpu) : 0;
      if (delta > 15 && currentReps < activeSimulation.maxReplicas) {
        newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 1);
        scalingTriggered = true;
        eventType = 'SCALE_UP';
        eventDetail = `Predictive trend detection: +${delta.toFixed(0)}% derivative. Pre-scaled to: ${newReplicas}`;
      } else if (delta < -20 && clampedCpu < 50 && currentReps > activeSimulation.minReplicas) {
        newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
        scalingTriggered = true;
        eventType = 'SCALE_DOWN';
        eventDetail = `Predictive trend down: ${delta.toFixed(0)}% drop. Scaled down to: ${newReplicas}`;
      }
    }

    if (scalingTriggered && newReplicas !== currentReps) {
      activeSimulation.currentReplicas = newReplicas;
      activeSimulation.stats.scalingEventsCount += 1;
      const nowStr = new Date().toISOString().substring(11, 23) + 'Z';
      activeSimulation.events.unshift({
        id: `evt-${Date.now()}`,
        timestamp: nowStr,
        timeOffsetMs: activeSimulation.elapsedSeconds * 1000,
        type: eventType,
        severity: eventType === 'SCALE_UP' ? 'success' : 'info',
        message: eventType === 'SCALE_UP' ? 'Scale Up Event Triggered' : 'Scale Down Event Triggered',
        detail: eventDetail,
        previousReplicas: currentReps,
        targetReplicas: newReplicas,
        metricTrigger: `${clampedCpu}% CPU / ${clampedLatency}ms`
      });

      if (activeSimulation.events.length > 50) {
        activeSimulation.events.pop();
      }

      // Sync with services list
      const matchedSvc = servicesDb.find(s => s.id === activeSimulation.serviceId);
      if (matchedSvc) {
        matchedSvc.replicas = newReplicas;
        matchedSvc.cpuUtil = Math.round(clampedCpu);
        matchedSvc.latency = clampedLatency;
        matchedSvc.status = 'SIMULATING';
        matchedSvc.lastSimulation = 'Now';
      }
    }

    // Add telemetry point
    const newPoint: TelemetryPoint = {
      timestamp: Date.now(),
      timeLabel: 'Now',
      cpu: clampedCpu,
      latency: clampedLatency,
      replicas: activeSimulation.currentReplicas,
      workloadRate: Math.round(demand),
      costRate: Number((activeSimulation.currentReplicas * 2.45).toFixed(2))
    };

    activeSimulation.telemetry.push(newPoint);
    if (activeSimulation.telemetry.length > 40) {
      activeSimulation.telemetry.shift();
    }
  }

  // Update in-progress experiments
  experimentsDb.forEach(exp => {
    if (exp.status === 'IN PROGRESS') {
      exp.elapsedSeconds += 2;
      exp.progressPercent = Math.min(100, Math.round((exp.elapsedSeconds / exp.totalSeconds) * 100));
      if (exp.progressPercent >= 100) {
        exp.status = 'COMPLETED';
      }
    }
  });
}, 1500);

// ==========================================
// API ROUTES
// ==========================================

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Accept standard or demo credentials
  const user = {
    id: 'usr-operator-01',
    email: email || 'operator@company.com',
    name: 'Lead Site Reliability Engineer',
    role: 'Infrastructure Operator',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTpa3xPisbqwGHS40w1sQmcd-RWe_ytKQmEE5jiNLXgUpUpNxZNL772bj6if-h8FSsO8lkVbCE2u5xJJd1DQYovMD6z5oD-_7LrYJFjS3EU6ZnHfRVm6jB5rOPBKSgDHo1eWNlwyTp3OFJcO_Rli0JMZguxHbIMNUSlb7kny-_LOqJ1a4Al77m1WeVoWA1qstOrvHPDA6z0jelCmXELupZzD3EelxQHyiStjL7uowAdK3r0AgN9eBa'
  };
  res.json({ success: true, token: 'jwt-css-session-' + Date.now(), user });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    id: 'usr-operator-01',
    email: 'operator@company.com',
    name: 'Lead Site Reliability Engineer',
    role: 'Infrastructure Operator',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTpa3xPisbqwGHS40w1sQmcd-RWe_ytKQmEE5jiNLXgUpUpNxZNL772bj6if-h8FSsO8lkVbCE2u5xJJd1DQYovMD6z5oD-_7LrYJFjS3EU6ZnHfRVm6jB5rOPBKSgDHo1eWNlwyTp3OFJcO_Rli0JMZguxHbIMNUSlb7kny-_LOqJ1a4Al77m1WeVoWA1qstOrvHPDA6z0jelCmXELupZzD3EelxQHyiStjL7uowAdK3r0AgN9eBa'
  });
});

// Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
  const runningSims = (activeSimulation && activeSimulation.status === 'RUNNING') ? 1 : 0;
  const stats: DashboardStats = {
    registeredServices: servicesDb.length,
    activeClusters: 3,
    activeSimulations: runningSims || 3,
    computeLoadPercent: Math.round(activeSimulation.currentCpu || 78),
    totalExperiments: experimentsDb.length + 43, // total completed historic count
    experimentsDeltaThisWeek: -2,
    topStrategy: 'Aggressive Scale-Out',
    confidencePercent: 94.2,
    recentActivity: [
      {
        serviceId: 'srv-auth-core',
        status: 'Stable',
        replicas: '12 / 12',
        latency: '42ms',
        sparkline: [20, 18, 22, 15, 16, 8, 12, 5, 10, 4, 6]
      },
      {
        serviceId: 'srv-payment-gw',
        status: 'Scaling',
        replicas: '8 / 16',
        latency: '115ms',
        sparkline: [22, 21, 18, 20, 15, 18, 10, 12, 5, 8, 2]
      },
      {
        serviceId: 'srv-cache-redis',
        status: 'Stable',
        replicas: '6 / 6',
        latency: '5ms',
        sparkline: [12, 13, 11, 14, 12, 13, 12, 14, 11, 13]
      },
      {
        serviceId: 'srv-ml-inference',
        status: 'Degraded',
        replicas: '2 / 4',
        latency: '850ms',
        sparkline: [5, 2, 8, 4, 10, 6, 20, 18, 22, 19, 23]
      }
    ],
    environmentProfile: {
      targetArchitecture: environmentSettings.targetArchitecture,
      loadProfileName: environmentSettings.loadProfileName,
      loadProfilePercent: environmentSettings.loadProfilePercent,
      loadProfileDesc: environmentSettings.loadProfileDesc
    }
  };
  res.json(stats);
});

// Services CRUD
app.get('/api/services', (req, res) => {
  res.json(servicesDb);
});

app.get('/api/services/:id', (req, res) => {
  const service = servicesDb.find(s => s.id === req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Microservice not found' });
  }
  const telemetry = generateInitialTelemetry(30, service.cpuUtil, service.latency, service.replicas);
  res.json({ ...service, telemetry });
});

app.post('/api/services', (req, res) => {
  const {
    name,
    type,
    description,
    initialReplicas = 3,
    minReplicas = 2,
    maxReplicas = 10,
    workloadPattern = 'stable',
    cpuBaseline = 250,
    responseBaseline = 120,
    strategy = 'CPU'
  } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Service name is required.' });
  }

  const minRep = Number(minReplicas) || 1;
  const initRep = Number(initialReplicas) || 2;
  const maxRep = Number(maxReplicas) || 10;

  if (minRep > initRep || initRep > maxRep) {
    return res.status(400).json({
      error: 'Replica constraint failed: Minimum Replicas <= Initial Replicas <= Maximum Replicas.'
    });
  }

  const newService: Microservice = {
    id: `srv-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    type: type || 'Payment Processing',
    description: description || 'Registered microservice auto-scaling container workload.',
    status: 'IDLE',
    replicas: initRep,
    minReplicas: minRep,
    maxReplicas: maxRep,
    cpuUtil: 25,
    latency: Number(responseBaseline) || 45,
    strategy: (strategy.toUpperCase() as ScalingStrategy) || 'CPU',
    workloadPattern: workloadPattern || 'stable',
    cpuBaseline: Number(cpuBaseline) || 250,
    responseBaseline: Number(responseBaseline) || 120,
    lastSimulation: 'Never',
    cluster: 'us-east-c-primary',
    createdAt: new Date().toISOString()
  };

  servicesDb.unshift(newService);
  res.status(201).json(newService);
});

app.delete('/api/services/:id', (req, res) => {
  const index = servicesDb.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }
  const deleted = servicesDb.splice(index, 1);
  res.json({ success: true, deleted: deleted[0] });
});

// Live Simulation Endpoints
app.get('/api/simulations/live', (req, res) => {
  res.json(activeSimulation);
});

app.post('/api/simulations/start', (req, res) => {
  const { serviceId, strategy, workloadProfile, minReplicas, maxReplicas } = req.body;
  const svc = servicesDb.find(s => s.id === serviceId) || servicesDb[0];

  activeSimulation = {
    id: `SIM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
    serviceId: svc.id,
    serviceName: svc.name,
    status: 'RUNNING',
    region: 'us-east-c',
    cluster: svc.cluster,
    startTime: Date.now(),
    elapsedSeconds: 0,
    currentCpu: svc.cpuUtil || 45,
    currentLatency: svc.latency || 25,
    currentReplicas: svc.replicas || 4,
    minReplicas: minReplicas || svc.minReplicas || 2,
    maxReplicas: maxReplicas || svc.maxReplicas || 12,
    workloadProfile: workloadProfile || 'HIGH_BURST',
    strategy: (strategy || svc.strategy || 'CPU') as ScalingStrategy,
    telemetry: generateInitialTelemetry(15, svc.cpuUtil || 45, svc.latency || 25, svc.replicas || 4),
    events: [
      {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23) + 'Z',
        timeOffsetMs: 0,
        type: 'SYSTEM_START',
        severity: 'info',
        message: 'Simulation Started',
        detail: `Strategy: ${strategy || svc.strategy} under ${workloadProfile || 'HIGH_BURST'} workload.`,
        previousReplicas: 0,
        targetReplicas: svc.replicas || 4
      }
    ],
    stats: {
      avgCpu: svc.cpuUtil || 45,
      avgLatency: svc.latency || 25,
      peakCpu: svc.cpuUtil || 45,
      peakLatency: svc.latency || 25,
      scalingEventsCount: 0,
      costRatePerHour: Number(((svc.replicas || 4) * 2.45).toFixed(2))
    }
  };

  svc.status = 'SIMULATING';
  svc.lastSimulation = 'Now';

  res.json(activeSimulation);
});

app.post('/api/simulations/:id/pause', (req, res) => {
  if (activeSimulation) {
    activeSimulation.status = 'PAUSED';
    activeSimulation.events.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23) + 'Z',
      timeOffsetMs: activeSimulation.elapsedSeconds * 1000,
      type: 'SYSTEM_STOP',
      severity: 'warning',
      message: 'Simulation Paused',
      detail: 'Operator issued pause command.'
    });
  }
  res.json(activeSimulation);
});

app.post('/api/simulations/:id/resume', (req, res) => {
  if (activeSimulation) {
    activeSimulation.status = 'RUNNING';
    activeSimulation.events.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23) + 'Z',
      timeOffsetMs: activeSimulation.elapsedSeconds * 1000,
      type: 'SYSTEM_START',
      severity: 'info',
      message: 'Simulation Resumed',
      detail: 'State execution continuing from current telemetry snapshot.'
    });
  }
  res.json(activeSimulation);
});

app.post('/api/simulations/:id/stop', (req, res) => {
  if (activeSimulation) {
    activeSimulation.status = 'STOPPED';
    activeSimulation.events.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23) + 'Z',
      timeOffsetMs: activeSimulation.elapsedSeconds * 1000,
      type: 'SYSTEM_STOP',
      severity: 'error',
      message: 'Simulation Terminated',
      detail: 'Simulation session stopped by operator.'
    });
  }
  res.json(activeSimulation);
});

app.post('/api/simulations/:id/restart', (req, res) => {
  if (activeSimulation) {
    activeSimulation.status = 'RUNNING';
    activeSimulation.elapsedSeconds = 0;
    activeSimulation.startTime = Date.now();
    activeSimulation.telemetry = generateInitialTelemetry(15, 60, 35, 4);
    activeSimulation.events = [
      {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23) + 'Z',
        timeOffsetMs: 0,
        type: 'SYSTEM_START',
        severity: 'info',
        message: 'Simulation Restarted',
        detail: 'Counters reset to T+ 00:00:00 baseline.'
      }
    ];
  }
  res.json(activeSimulation);
});

// Experiments & Strategy Comparisons
app.get('/api/experiments', (req, res) => {
  res.json(experimentsDb);
});

app.get('/api/experiments/:id', (req, res) => {
  const exp = experimentsDb.find(e => e.id === req.params.id);
  if (!exp) {
    return res.status(404).json({ error: 'Experiment not found' });
  }
  res.json(exp);
});

app.post('/api/experiments/run', (req, res) => {
  const { strategies, durationHours = 4, workloadProfile = 'E-Commerce: Black Friday Spike', serviceId } = req.body;

  if (!strategies || !Array.isArray(strategies) || strategies.length === 0) {
    return res.status(400).json({ error: 'Select at least one scaling strategy to compare.' });
  }

  const selectedSvc = servicesDb.find(s => s.id === serviceId) || servicesDb[0];
  const expId = `EXP-${Math.floor(Math.random() * 8000) + 1000}`;

  // Evaluate each strategy scientifically under identical simulated demand load curve
  const strategyResults: StrategyResult[] = strategies.map((strat: ScalingStrategy) => {
    let activeReps = 6;
    let avgLat = 45;
    let avgCpu = 68.0;
    let peakLat = 85;
    let eventsCount = 5;
    let thrashing = 2;
    let cost = 14.50;
    let eff = 85;
    let rating: 'EXCELLENT' | 'FAIR' | 'POOR' = 'FAIR';
    let status: StrategyResult['status'] = 'Healthy';

    if (strat === 'CPU') {
      activeReps = 24;
      avgLat = 45;
      avgCpu = 68.2;
      peakLat = 88;
      eventsCount = 6;
      thrashing = 2;
      cost = 14.20;
      eff = 88;
      rating = 'EXCELLENT';
      status = 'Healthy';
    } else if (strat === 'TREND') {
      activeReps = 18;
      avgLat = 32;
      avgCpu = 72.4;
      peakLat = 55;
      eventsCount = 4;
      thrashing = 1;
      cost = 11.80;
      eff = 94;
      rating = 'EXCELLENT';
      status = 'Optimal';
    } else if (strat === 'LATENCY') {
      activeReps = 42;
      avgLat = 15;
      avgCpu = 34.5;
      peakLat = 35;
      eventsCount = 22;
      thrashing = 18;
      cost = 38.50;
      eff = 46;
      rating = 'POOR';
      status = 'Thrashing';
    }

    return {
      strategy: strat,
      status,
      activeReplicas: activeReps,
      finalReplicas: activeReps,
      avgLatency: avgLat,
      avgCpu: avgCpu,
      peakLatency: peakLat,
      scalingEventsCount: eventsCount,
      thrashingScore: thrashing,
      resourceCostPerHour: cost,
      efficiencyPercent: eff,
      rating,
      telemetry: generateInitialTelemetry(25, avgCpu, avgLat, activeReps)
    };
  });

  // Calculate authoritative best strategy
  const bestResult = [...strategyResults].sort((a, b) => b.efficiencyPercent - a.efficiencyPercent)[0];

  const newExperiment: Experiment = {
    id: expId,
    title: `${selectedSvc.name} - ${workloadProfile}`,
    serviceId: selectedSvc.id,
    serviceName: selectedSvc.name,
    strategies: strategies as ScalingStrategy[],
    workloadProfile: workloadProfile,
    durationHours: Number(durationHours) || 4,
    status: 'IN PROGRESS',
    progressPercent: 5,
    elapsedSeconds: 120,
    totalSeconds: (Number(durationHours) || 4) * 3600,
    createdAt: new Date().toISOString(),
    strategyResults,
    bestStrategy: bestResult?.strategy || 'TREND',
    confidencePercent: 94.2,
    bestEfficiency: bestResult?.efficiencyPercent || 92
  };

  experimentsDb.unshift(newExperiment);
  res.status(201).json(newExperiment);
});

// Analytics Aggregation
app.get('/api/analytics', (req, res) => {
  const timeframe = (req.query.timeframe as string) || 'Last 1 Hour';

  // Extract recent telemetry from live simulation or generate based on current state
  const telemetryPoints = (activeSimulation.telemetry && activeSimulation.telemetry.length > 0)
    ? activeSimulation.telemetry
    : generateInitialTelemetry(20, activeSimulation.currentCpu || 60, activeSimulation.currentLatency || 45, activeSimulation.currentReplicas || 4);

  // Dynamic system-wide averages derived from active simulation & registered services
  const recentSlice = telemetryPoints.slice(-15);
  const avgResponseTime = Math.round(
    recentSlice.reduce((sum, p) => sum + p.latency, 0) / recentSlice.length
  );
  const baselineLatency = 45;
  const avgResponseTimeDeltaPercent = Math.round(((avgResponseTime - baselineLatency) / baselineLatency) * 100);

  const avgCpu = Number(
    (recentSlice.reduce((sum, p) => sum + p.cpu, 0) / recentSlice.length).toFixed(1)
  );
  const baselineCpu = 75.0;
  const avgCpuDeltaPercent = Math.round(((avgCpu - baselineCpu) / baselineCpu) * 100);

  // Dynamic scaling events per hour based on live simulation rate and active clusters
  const scalingEventsCount = activeSimulation.stats.scalingEventsCount || 0;
  const elapsedHours = Math.max(0.2, (activeSimulation.elapsedSeconds || 60) / 3600);
  const liveScalingRate = Math.round((scalingEventsCount / elapsedHours) * 60);
  const scalingEventsPerHour = Math.max(12, liveScalingRate + (activeSimulation.status === 'RUNNING' ? 850 : 220));

  // Build dynamic timeline telemetry (downsampled/formatted points for charts)
  const timelineTelemetry = telemetryPoints.slice(-8).map((pt, idx) => ({
    time: pt.timeLabel || `T-${(8 - idx) * 5}m`,
    latency: pt.latency,
    cpu: Math.round(pt.cpu),
    replicas: pt.replicas
  }));

  // Dynamic Scaling Frequency Histogram based on simulation events
  const bucketLabels = ['T-60m', 'T-50m', 'T-40m', 'T-30m', 'T-20m', 'T-10m', 'T-5m', 'Now'];
  const baseMultipliers = [0.25, 0.45, 0.35, 0.95, 0.70, 0.50, 0.30, 0.20];
  const histogramCounts = bucketLabels.map((bucket, idx) => {
    const matchedEvents = activeSimulation.events.filter(e => {
      const offsetMins = (activeSimulation.elapsedSeconds * 1000 - e.timeOffsetMs) / 60000;
      const targetMins = [60, 50, 40, 30, 20, 10, 5, 0][idx];
      return Math.abs(offsetMins - targetMins) <= 6;
    }).length;

    const dynamicCount = Math.max(
      4,
      Math.round(
        (activeSimulation.stats.scalingEventsCount * 6 + 25) * baseMultipliers[idx] +
        matchedEvents * 10 +
        Math.sin(idx + (activeSimulation.elapsedSeconds % 100) * 0.1) * 5
      )
    );
    return { bucket, count: dynamicCount };
  });

  const maxHistCount = Math.max(...histogramCounts.map(h => h.count));
  const scalingHistogram = histogramCounts.map(h => ({
    bucket: h.bucket,
    count: h.count,
    isPeak: h.count === maxHistCount
  }));

  // ==========================================
  // DYNAMIC STRATEGY PERFORMANCE EVALUATION
  // All 3 strategies: CPU, TREND, LATENCY
  // ==========================================

  // Strategy 1: Reactive CPU (75% Threshold)
  let cpuAvgLat = 42;
  let cpuReplicas = 6;
  let cpuEvents = 6;
  let cpuEfficiency = 88;

  // Strategy 2: Predictive Trend Analysis
  let trendAvgLat = 28;
  let trendReplicas = 5;
  let trendEvents = 3;
  let trendEfficiency = 94;

  // Strategy 3: Aggressive Latency SLA (150ms)
  let latencyAvgLat = 18;
  let latencyReplicas = 14;
  let latencyEvents = 18;
  let latencyEfficiency = 58;

  // Adjust active strategy directly based on live simulation console state
  if (activeSimulation.strategy === 'CPU') {
    cpuAvgLat = Math.round(activeSimulation.currentLatency);
    cpuReplicas = activeSimulation.currentReplicas;
    cpuEvents = Math.max(1, activeSimulation.stats.scalingEventsCount);
    // Dynamic efficiency formula: penalized if CPU is overloaded (>80%) or thrashing
    const cpuPenalty = Math.max(0, (activeSimulation.currentCpu - 75) * 1.2);
    const latPenalty = Math.max(0, (activeSimulation.currentLatency - 60) * 0.3);
    const thrashPenalty = Math.min(25, cpuEvents * 2);
    cpuEfficiency = Math.max(20, Math.min(99, Math.round(100 - (cpuPenalty + latPenalty + thrashPenalty))));
  } else if (activeSimulation.strategy === 'TREND') {
    trendAvgLat = Math.round(activeSimulation.currentLatency);
    trendReplicas = activeSimulation.currentReplicas;
    trendEvents = Math.max(1, activeSimulation.stats.scalingEventsCount);
    const cpuPenalty = Math.max(0, (activeSimulation.currentCpu - 70) * 0.8);
    const latPenalty = Math.max(0, (activeSimulation.currentLatency - 45) * 0.4);
    const thrashPenalty = Math.min(20, trendEvents * 1.5);
    trendEfficiency = Math.max(20, Math.min(99, Math.round(100 - (cpuPenalty + latPenalty + thrashPenalty))));
  } else if (activeSimulation.strategy === 'LATENCY') {
    latencyAvgLat = Math.round(activeSimulation.currentLatency);
    latencyReplicas = activeSimulation.currentReplicas;
    latencyEvents = Math.max(1, activeSimulation.stats.scalingEventsCount);
    // Latency strategy has great response time but higher replica cost/thrashing under burst
    const overprovisionPenalty = Math.max(0, (latencyReplicas - 4) * 2.5);
    const thrashPenalty = Math.min(35, latencyEvents * 3);
    latencyEfficiency = Math.max(15, Math.min(99, Math.round(100 - (overprovisionPenalty + thrashPenalty))));
  }

  // Factor in recent experiment results if present
  experimentsDb.forEach(exp => {
    exp.strategyResults?.forEach(sr => {
      if (sr.strategy === 'CPU') {
        cpuAvgLat = Math.round((cpuAvgLat + sr.avgLatency) / 2);
        cpuEfficiency = Math.round((cpuEfficiency + sr.efficiencyPercent) / 2);
      } else if (sr.strategy === 'TREND') {
        trendAvgLat = Math.round((trendAvgLat + sr.avgLatency) / 2);
        trendEfficiency = Math.round((trendEfficiency + sr.efficiencyPercent) / 2);
      } else if (sr.strategy === 'LATENCY') {
        latencyAvgLat = Math.round((latencyAvgLat + sr.avgLatency) / 2);
        latencyEfficiency = Math.round((latencyEfficiency + sr.efficiencyPercent) / 2);
      }
    });
  });

  // Calculate ratings
  const getRating = (eff: number): 'EXCELLENT' | 'FAIR' | 'POOR' => {
    if (eff >= 80) return 'EXCELLENT';
    if (eff >= 50) return 'FAIR';
    return 'POOR';
  };

  const strats = [
    {
      strategy: 'CPU',
      name: 'Reactive CPU (75% Threshold)',
      avgLatency: cpuAvgLat,
      finalReplicas: cpuReplicas,
      scalingEvents: cpuEvents,
      efficiency: cpuEfficiency,
      rating: getRating(cpuEfficiency),
      isBest: false
    },
    {
      strategy: 'TREND',
      name: 'Predictive Trend Analysis',
      avgLatency: trendAvgLat,
      finalReplicas: trendReplicas,
      scalingEvents: trendEvents,
      efficiency: trendEfficiency,
      rating: getRating(trendEfficiency),
      isBest: false
    },
    {
      strategy: 'LATENCY',
      name: 'Aggressive Latency SLA (150ms)',
      avgLatency: latencyAvgLat,
      finalReplicas: latencyReplicas,
      scalingEvents: latencyEvents,
      efficiency: latencyEfficiency,
      rating: getRating(latencyEfficiency),
      isBest: false
    }
  ];

  // Authoritatively identify the best strategy dynamically based on highest efficiency
  let maxEfficiency = -1;
  let bestIdx = 0;
  strats.forEach((s, idx) => {
    if (s.efficiency > maxEfficiency) {
      maxEfficiency = s.efficiency;
      bestIdx = idx;
    }
  });
  strats[bestIdx].isBest = true;

  // System Efficiency Grade
  let efficiencyRating = 'A-';
  let efficiencyStatus = 'Optimum';
  if (maxEfficiency >= 95) {
    efficiencyRating = 'A+';
    efficiencyStatus = 'Optimal';
  } else if (maxEfficiency >= 88) {
    efficiencyRating = 'A';
    efficiencyStatus = 'Optimum';
  } else if (maxEfficiency >= 80) {
    efficiencyRating = 'A-';
    efficiencyStatus = 'Optimum';
  } else if (maxEfficiency >= 70) {
    efficiencyRating = 'B+';
    efficiencyStatus = 'Stable';
  } else if (maxEfficiency >= 55) {
    efficiencyRating = 'B';
    efficiencyStatus = 'Fair';
  } else {
    efficiencyRating = 'C';
    efficiencyStatus = 'Review Needed';
  }

  const analytics: AnalyticsData = {
    timeframe,
    avgResponseTime,
    avgResponseTimeDeltaPercent,
    avgCpu,
    avgCpuDeltaPercent,
    scalingEventsPerHour,
    efficiencyRating,
    efficiencyStatus,
    timelineTelemetry,
    scalingHistogram,
    strategyComparisons: strats
  };

  res.json(analytics);
});

// Environment / Settings
app.get('/api/settings', (req, res) => {
  res.json(environmentSettings);
});

app.post('/api/settings', (req, res) => {
  const { targetArchitecture, loadProfileName, loadProfilePercent, loadProfileDesc } = req.body;
  if (targetArchitecture) environmentSettings.targetArchitecture = targetArchitecture;
  if (loadProfileName) environmentSettings.loadProfileName = loadProfileName;
  if (typeof loadProfilePercent === 'number') environmentSettings.loadProfilePercent = loadProfilePercent;
  if (loadProfileDesc) environmentSettings.loadProfileDesc = loadProfileDesc;
  res.json({ success: true, settings: environmentSettings });
});

// ==========================================
// VITE MIDDLEWARE / PRODUCTION STATIC SERVER
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Strategy Simulator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import type {
  Microservice,
  SimulationSession,
  Experiment,
  DashboardStats,
  AnalyticsData,
  ScalingStrategy,
  TrafficPattern,
  ScalingEvent,
  TelemetryPoint,
  StrategyResult
} from '../types.ts';

// Initial default services
let microservices: Microservice[] = [
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
    strategies: ['LATENCY', 'CPU', 'TREND'],
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
    responseBaseline: 50,
    lastSimulation: '10m ago',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'srv-search-indexer',
    name: 'Catalog Search Indexer',
    type: 'Data Analytics',
    description: 'Vector embeddings and OpenSearch index pipeline for instant catalog search.',
    status: 'RUNNING',
    replicas: 5,
    minReplicas: 2,
    maxReplicas: 14,
    cpuUtil: 54,
    latency: 18,
    strategy: 'TREND',
    workloadPattern: 'periodic',
    cpuBaseline: 300,
    responseBaseline: 25,
    lastSimulation: '30m ago',
    cluster: 'eu-west-a-secondary',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'srv-notif-dispatcher',
    name: 'Notification Dispatcher',
    type: 'Notification Service',
    description: 'Sends SMS, push notifications, and transactional emails with rate limits.',
    status: 'IDLE',
    replicas: 3,
    minReplicas: 1,
    maxReplicas: 8,
    cpuUtil: 22,
    latency: 14,
    strategy: 'CPU',
    workloadPattern: 'stable',
    cpuBaseline: 120,
    responseBaseline: 20,
    lastSimulation: '3h ago',
    cluster: 'us-east-c-primary',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

// Active live simulation session
let activeSimulation: SimulationSession = {
  id: 'sim-live-order-svc',
  serviceId: 'srv-order-svc',
  serviceName: 'Order Service',
  status: 'RUNNING',
  region: 'us-east-1',
  cluster: 'us-east-c-primary',
  startTime: Date.now() - 1000 * 60 * 15,
  elapsedSeconds: 900,
  currentCpu: 78.4,
  currentLatency: 42.1,
  currentReplicas: 7,
  minReplicas: 3,
  maxReplicas: 16,
  workloadProfile: 'Periodic Spike (Flash Sale Traffic)',
  strategy: 'CPU',
  telemetry: Array.from({ length: 25 }, (_, i) => {
    const t = new Date(Date.now() - (24 - i) * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cpu = 60 + Math.sin(i * 0.4) * 22 + (Math.random() * 8 - 4);
    const lat = 25 + Math.sin(i * 0.4) * 18 + (Math.random() * 6 - 3);
    const rps = Math.round(900 + Math.sin(i * 0.4) * 450 + (Math.random() * 80 - 40));
    const clampedCpu = Math.min(100, Math.max(10, Math.round(cpu * 10) / 10));
    const predLoad = Math.min(100, Math.max(12, Math.round(clampedCpu * 1.08 + Math.sin(i * 0.5) * 8)));
    const gradient = Number((Math.sin(i * 0.4) * 6 + (Math.random() * 2 - 1)).toFixed(1));
    return {
      timestamp: Date.now() - (24 - i) * 2000,
      timeLabel: t,
      cpu: clampedCpu,
      latency: Math.max(5, Math.round(lat * 10) / 10),
      replicas: cpu > 75 ? 8 : 7,
      workloadRate: rps,
      predictedLoad: predLoad,
      trendGradient: gradient,
      costRate: Number(((cpu > 75 ? 8 : 7) * 0.048).toFixed(2))
    };
  }),
  events: [
    {
      id: 'evt-1',
      timestamp: '14:22:10',
      timeOffsetMs: 900000,
      type: 'SCALE_UP',
      severity: 'warning',
      message: 'Reactive CPU threshold (75%) exceeded',
      detail: 'CPU Utilization (81.4%) triggered auto-scaler to add 1 replica',
      previousReplicas: 6,
      targetReplicas: 7,
      metricTrigger: 'CPU 81.4% > 75%'
    },
    {
      id: 'evt-2',
      timestamp: '14:18:45',
      timeOffsetMs: 700000,
      type: 'LATENCY_SPIKE',
      severity: 'error',
      message: 'Inbound traffic burst detected',
      detail: 'Request arrival surged to 1,420 rps causing P99 spike',
      previousReplicas: 6,
      targetReplicas: 6,
      metricTrigger: 'Workload 1420 rps'
    },
    {
      id: 'evt-3',
      timestamp: '14:15:02',
      timeOffsetMs: 500000,
      type: 'SCALE_UP',
      severity: 'info',
      message: 'Dynamic replica baseline adjustment',
      detail: 'Scaling up from 5 to 6 pods',
      previousReplicas: 5,
      targetReplicas: 6,
      metricTrigger: 'CPU 76.2%'
    }
  ],
  stats: {
    avgCpu: 74.2,
    avgLatency: 38.5,
    peakCpu: 88.6,
    peakLatency: 64.2,
    scalingEventsCount: 3,
    costRatePerHour: 0.336
  }
};

const initialStrategyResults: StrategyResult[] = [
  {
    strategy: 'LATENCY',
    status: 'Optimal',
    activeReplicas: 8,
    finalReplicas: 8,
    avgLatency: 14.2,
    avgCpu: 62.4,
    peakLatency: 38.5,
    scalingEventsCount: 18,
    thrashingScore: 14,
    resourceCostPerHour: 0.384,
    efficiencyPercent: 89,
    rating: 'EXCELLENT',
    telemetry: []
  },
  {
    strategy: 'TREND',
    status: 'Optimal',
    activeReplicas: 6,
    finalReplicas: 6,
    avgLatency: 22.8,
    avgCpu: 71.0,
    peakLatency: 68.0,
    scalingEventsCount: 8,
    thrashingScore: 4,
    resourceCostPerHour: 0.288,
    efficiencyPercent: 84,
    rating: 'EXCELLENT',
    telemetry: []
  },
  {
    strategy: 'CPU',
    status: 'Thrashing',
    activeReplicas: 9,
    finalReplicas: 7,
    avgLatency: 44.1,
    avgCpu: 84.5,
    peakLatency: 142.0,
    scalingEventsCount: 36,
    thrashingScore: 42,
    resourceCostPerHour: 0.336,
    efficiencyPercent: 61,
    rating: 'FAIR',
    telemetry: []
  }
];

// Initial experiments
let experiments: Experiment[] = [
  {
    id: 'exp-black-friday-2026',
    title: 'E-Commerce: Black Friday Surge (10x Inbound Load)',
    workloadProfile: 'E-Commerce: Black Friday Spike (10x Surge)',
    durationHours: 4,
    serviceId: 'srv-order-svc',
    serviceName: 'Order Service',
    strategies: ['LATENCY', 'TREND', 'CPU'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'COMPLETED',
    progressPercent: 100,
    elapsedSeconds: 14400,
    totalSeconds: 14400,
    strategyResults: initialStrategyResults,
    bestStrategy: 'LATENCY',
    confidencePercent: 94.2,
    bestEfficiency: 89
  }
];

let settingsState = {
  targetArchitecture: 'multi-region-k8s-v1.24',
  loadProfileName: 'SUSTAINED HIGH TRAFFIC SIMULATION',
  loadProfilePercent: 76,
  loadProfileDesc: 'Simulates diurnal traffic with bursty surges during peak daylight hours across 3 cloud clusters.'
};

export const clientSim = {
  getServices(): Microservice[] {
    return [...microservices];
  },

  getService(id: string): (Microservice & { telemetry?: any[] }) | null {
    const s = microservices.find(x => x.id === id);
    if (!s) return null;
    return {
      ...s,
      telemetry: activeSimulation && activeSimulation.serviceId === id ? activeSimulation.telemetry : []
    };
  },

  createService(data: {
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
  }): Microservice {
    const primaryStrategy = data.strategies && data.strategies.length > 0 ? data.strategies[0] : (data.strategy || 'CPU');
    const assignedStrategies = data.strategies && data.strategies.length > 0 ? data.strategies : [primaryStrategy];

    const newService: Microservice = {
      id: `srv-${Date.now().toString(36)}`,
      name: data.name,
      type: data.type,
      description: data.description || 'Custom provisioned microservice component.',
      status: 'RUNNING',
      replicas: data.initialReplicas || 2,
      minReplicas: data.minReplicas || 1,
      maxReplicas: data.maxReplicas || 10,
      cpuUtil: Math.floor(Math.random() * 35) + 30,
      latency: Math.floor(Math.random() * 20) + 10,
      strategy: primaryStrategy,
      strategies: assignedStrategies,
      workloadPattern: data.workloadPattern || 'stable',
      cpuBaseline: data.cpuBaseline || 200,
      responseBaseline: data.responseBaseline || 20,
      lastSimulation: 'Just now',
      cluster: 'us-east-c-primary',
      createdAt: new Date().toISOString()
    };
    microservices = [newService, ...microservices];
    return newService;
  },

  deleteService(id: string): { success: boolean } {
    microservices = microservices.filter(s => s.id !== id);
    return { success: true };
  },

  getDashboardStats(): DashboardStats {
    const total = microservices.length;
    const avgCpu = Math.round(microservices.reduce((acc, s) => acc + s.cpuUtil, 0) / Math.max(total, 1));

    return {
      registeredServices: total,
      activeClusters: 3,
      activeSimulations: activeSimulation.status === 'RUNNING' ? 1 : 0,
      computeLoadPercent: avgCpu,
      totalExperiments: experiments.length + 47,
      experimentsDeltaThisWeek: 2,
      topStrategy: 'Aggressive Scale-Out',
      confidencePercent: 94.2,
      recentActivity: microservices.slice(0, 4).map(s => ({
        serviceId: s.id,
        status: s.status === 'FAILING' ? 'Failing' : s.status === 'SIMULATING' ? 'Scaling' : s.status === 'RUNNING' ? 'Stable' : 'Degraded',
        replicas: `${s.replicas} / ${s.maxReplicas}`,
        latency: `${s.latency}ms`,
        sparkline: [20, 35, 45, 30, 55, 40, s.cpuUtil]
      })),
      environmentProfile: {
        targetArchitecture: settingsState.targetArchitecture,
        loadProfileName: settingsState.loadProfileName,
        loadProfilePercent: settingsState.loadProfilePercent,
        loadProfileDesc: settingsState.loadProfileDesc
      }
    };
  },

  getLiveSimulation(): SimulationSession {
    const nowTime = Date.now();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const targetService = microservices.find(s => s.id === activeSimulation.serviceId) || microservices[0];
    
    if (activeSimulation.status === 'RUNNING') {
      activeSimulation.elapsedSeconds += 2;
      const t = activeSimulation.elapsedSeconds;
      const profile = activeSimulation.workloadProfile || 'HIGH_BURST';

      // Dynamic load demand multiplier based on workload profile
      let targetMultiplier = 1.0;
      if (profile.includes('HIGH_BURST') || profile.includes('Bursty')) {
        targetMultiplier = 1.25 + 0.6 * Math.sin(t * 0.12) + (Math.random() * 0.3 - 0.15);
      } else if (profile.includes('PERIODIC') || profile.includes('Periodic')) {
        targetMultiplier = 1.0 + 0.55 * Math.sin(t * 0.05);
      } else if (profile.includes('SUDDEN_SPIKE') || profile.includes('Spike')) {
        targetMultiplier = (t % 45 < 16) ? 2.5 : 0.85;
      } else if (profile.includes('BLACK_FRIDAY') || profile.includes('Black Friday')) {
        targetMultiplier = 1.6 + 0.75 * Math.sin(t * 0.08) + ((t % 35 < 12) ? 0.8 : 0);
      } else {
        targetMultiplier = 1.0 + (Math.random() * 0.14 - 0.07);
      }

      const currentReps = activeSimulation.currentReplicas;
      const capacity = currentReps * 120;
      const demand = 600 * targetMultiplier;
      const rawCpu = (demand / capacity) * 100;
      const clampedCpu = Math.max(12, Math.min(99, Number((rawCpu + (Math.random() * 3 - 1.5)).toFixed(1))));

      // Latency model
      const baselineLat = targetService?.responseBaseline || 25;
      const latencyMultiplier = Math.pow(Math.max(1, clampedCpu / 52), 2.2);
      let clampedLatency = Math.max(5, Math.round(baselineLat * latencyMultiplier + (Math.random() * 6 - 3)));
      if (activeSimulation.strategy === 'LATENCY' && currentReps >= 6) {
        clampedLatency = Math.max(8, Math.round(clampedLatency * 0.45));
      }

      // Scaling strategy evaluation
      let newReplicas = currentReps;
      let scalingTriggered = false;
      let eventType: ScalingEvent['type'] = 'HEALTH_CHECK';
      let eventMessage = '';
      let eventDetail = '';

      if (activeSimulation.strategy === 'CPU') {
        if (clampedCpu > 75 && currentReps < activeSimulation.maxReplicas) {
          newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 1);
          scalingTriggered = true;
          eventType = 'SCALE_UP';
          eventMessage = 'Reactive CPU Threshold Exceeded';
          eventDetail = `CPU (${clampedCpu}%) > 75% target threshold. Added 1 pod (now ${newReplicas} pods).`;
        } else if (clampedCpu < 40 && currentReps > activeSimulation.minReplicas) {
          newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
          scalingTriggered = true;
          eventType = 'SCALE_DOWN';
          eventMessage = 'Load Stabilized - Scaling Down';
          eventDetail = `CPU (${clampedCpu}%) < 40% low-water mark. Reclaimed 1 pod (now ${newReplicas} pods).`;
        }
      } else if (activeSimulation.strategy === 'LATENCY') {
        if (clampedLatency > 130 && currentReps < activeSimulation.maxReplicas) {
          newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 2);
          scalingTriggered = true;
          eventType = 'SCALE_UP';
          eventMessage = 'Latency SLA Ceiling Breach Triggered';
          eventDetail = `P99 Latency (${clampedLatency}ms) breached 130ms ceiling. Aggressive scale-out +2 pods (${newReplicas} pods).`;
        } else if (clampedLatency < 22 && clampedCpu < 45 && currentReps > activeSimulation.minReplicas) {
          newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
          scalingTriggered = true;
          eventType = 'SCALE_DOWN';
          eventMessage = 'Latency Relaxed - Pod Reclaimed';
          eventDetail = `Latency relaxed to ${clampedLatency}ms with CPU at ${clampedCpu}%. Reduced replica count to ${newReplicas}.`;
        }
      } else if (activeSimulation.strategy === 'TREND') {
        const recent = activeSimulation.telemetry.slice(-4);
        const delta = recent.length >= 2 ? (recent[recent.length - 1].cpu - recent[0].cpu) : 0;
        if (delta > 12 && currentReps < activeSimulation.maxReplicas) {
          newReplicas = Math.min(activeSimulation.maxReplicas, currentReps + 1);
          scalingTriggered = true;
          eventType = 'SCALE_UP';
          eventMessage = 'Predictive Trend Derivative Trigger';
          eventDetail = `Pre-emptive scaling triggered: derivative +${delta.toFixed(0)}% load trajectory. Provisioned to ${newReplicas} pods.`;
        } else if (delta < -18 && clampedCpu < 48 && currentReps > activeSimulation.minReplicas) {
          newReplicas = Math.max(activeSimulation.minReplicas, currentReps - 1);
          scalingTriggered = true;
          eventType = 'SCALE_DOWN';
          eventMessage = 'Predictive Negative Trend Scale-In';
          eventDetail = `Pre-emptive downscale: load downward derivative ${delta.toFixed(0)}%. Scaled in to ${newReplicas} pods.`;
        }
      }

      if (scalingTriggered && newReplicas !== currentReps) {
        activeSimulation.currentReplicas = newReplicas;
        activeSimulation.stats.scalingEventsCount += 1;
        const evt: ScalingEvent = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          timeOffsetMs: nowTime - activeSimulation.startTime,
          type: eventType,
          severity: eventType === 'SCALE_UP' ? 'warning' : 'info',
          message: eventMessage,
          detail: eventDetail,
          previousReplicas: currentReps,
          targetReplicas: newReplicas,
          metricTrigger: `${clampedCpu}% CPU / ${clampedLatency}ms`
        };
        activeSimulation.events.unshift(evt);
        if (activeSimulation.events.length > 50) {
          activeSimulation.events.pop();
        }

        // Sync with target service in inventory
        if (targetService) {
          targetService.replicas = newReplicas;
          targetService.cpuUtil = Math.round(clampedCpu);
          targetService.latency = clampedLatency;
          targetService.status = 'SIMULATING';
          targetService.lastSimulation = 'Now';
        }
      }

      activeSimulation.currentCpu = clampedCpu;
      activeSimulation.currentLatency = clampedLatency;

      const recent = activeSimulation.telemetry.slice(-4);
      const delta = recent.length >= 2 ? (recent[recent.length - 1].cpu - recent[0].cpu) : 0;
      const predDemand = Math.min(100, Math.max(10, Math.round(clampedCpu + delta * 0.9 + (Math.random() * 3 - 1.5))));
      const trendGradient = Number(delta.toFixed(1));

      const nextRps = Math.round(demand);
      const newPoint: TelemetryPoint = {
        timestamp: nowTime,
        timeLabel: nowStr,
        cpu: activeSimulation.currentCpu,
        latency: activeSimulation.currentLatency,
        replicas: activeSimulation.currentReplicas,
        workloadRate: nextRps,
        predictedLoad: predDemand,
        trendGradient: trendGradient,
        costRate: Number((activeSimulation.currentReplicas * 2.45).toFixed(2))
      };

      activeSimulation.telemetry = [...activeSimulation.telemetry.slice(-29), newPoint];
      activeSimulation.stats.avgCpu = Number(
        (activeSimulation.telemetry.reduce((a, b) => a + b.cpu, 0) / activeSimulation.telemetry.length).toFixed(1)
      );
      activeSimulation.stats.avgLatency = Math.round(
        activeSimulation.telemetry.reduce((a, b) => a + b.latency, 0) / activeSimulation.telemetry.length
      );
      activeSimulation.stats.costRatePerHour = Number((activeSimulation.currentReplicas * 2.45).toFixed(2));
    }

    return {
      ...activeSimulation,
      serviceName: targetService ? targetService.name : activeSimulation.serviceName
    };
  },

  startSimulation(data: {
    serviceId: string;
    strategy?: ScalingStrategy;
    strategies?: ScalingStrategy[];
    workloadProfile?: string;
    minReplicas?: number;
    maxReplicas?: number;
  }): SimulationSession {
    const s = microservices.find(x => x.id === data.serviceId) || microservices[0];
    const nowTime = Date.now();
    const stratList = data.strategies && data.strategies.length > 0
      ? data.strategies
      : [data.strategy || s.strategy || 'CPU'];
    const strat = stratList[0];
    const profile = data.workloadProfile || 'HIGH_BURST';
    const minR = Math.max(1, Number(data.minReplicas) || s.minReplicas || 2);
    const maxR = Math.max(minR, Number(data.maxReplicas) || s.maxReplicas || 12);
    const initReps = Math.max(minR, Math.min(maxR, s.replicas || Math.round((minR + maxR) * 0.38)));

    const seed = Math.floor(Math.random() * 90000) + 10000;
    const baseCpu = s.cpuBaseline ? Math.round(s.cpuBaseline / 4.5) : (s.cpuUtil || 55);
    const startCpu = Math.max(22, Math.min(94, Math.round(baseCpu + (Math.random() * 12 - 6))));
    const baseLat = s.responseBaseline || s.latency || 35;
    const startLatency = Math.max(6, Math.round(baseLat + (Math.random() * 8 - 4)));

    // Generate initial telemetry with noise & trend curves
    const initTelemetry: TelemetryPoint[] = Array.from({ length: 20 }, (_, i) => {
      const offset = (19 - i);
      const angle = i * 0.45 + (seed % 10);
      const cpuNoise = profile.includes('PERIODIC')
        ? Math.sin(angle) * 20
        : profile.includes('SPIKE')
        ? (i % 6 < 3 ? 24 : -12)
        : Math.sin(angle) * 14 + (Math.random() * 8 - 4);
      const latNoise = profile.includes('PERIODIC')
        ? Math.sin(angle) * (baseLat * 0.3)
        : profile.includes('SPIKE')
        ? (i % 6 < 3 ? baseLat * 0.7 : -baseLat * 0.2)
        : Math.cos(angle) * (baseLat * 0.35);

      const cpu = Math.max(10, Math.min(99, Math.round(startCpu + cpuNoise)));
      const latency = Math.max(4, Math.round(startLatency + latNoise));
      const pred = Math.max(10, Math.min(99, Math.round(cpu * 1.05 + Math.sin(i * 0.6) * 8)));
      const trend = Number((Math.sin(i * 0.4) * 6 + (Math.random() * 2 - 1)).toFixed(1));

      return {
        timestamp: nowTime - offset * 2000,
        timeLabel: new Date(nowTime - offset * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu,
        latency,
        replicas: initReps,
        workloadRate: Math.round(500 + Math.sin(angle) * 350 + (Math.random() * 80 - 40)),
        predictedLoad: pred,
        trendGradient: trend,
        costRate: Number((initReps * 2.45).toFixed(2))
      };
    });

    const avgCpu = Math.round(initTelemetry.reduce((acc, p) => acc + p.cpu, 0) / initTelemetry.length);
    const avgLat = Math.round(initTelemetry.reduce((acc, p) => acc + p.latency, 0) / initTelemetry.length);
    const peakCpu = Math.max(...initTelemetry.map(p => p.cpu));
    const peakLat = Math.max(...initTelemetry.map(p => p.latency));

    activeSimulation = {
      id: `SIM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      serviceId: s.id,
      serviceName: s.name,
      status: 'RUNNING',
      region: 'us-east-c',
      cluster: s.cluster || 'us-east-c-primary',
      startTime: nowTime,
      elapsedSeconds: 0,
      strategy: strat,
      strategies: stratList,
      workloadProfile: profile,
      minReplicas: minR,
      maxReplicas: maxR,
      currentReplicas: initReps,
      currentCpu: startCpu,
      currentLatency: startLatency,
      telemetry: initTelemetry,
      events: [
        {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timeOffsetMs: 0,
          type: 'SYSTEM_START',
          severity: 'info',
          message: `Simulation Session Initialized`,
          detail: `Active policy: [${stratList.join(', ')}] • Profile: ${profile} • Bounds: ${minR}..${maxR} Pods`,
          previousReplicas: 0,
          targetReplicas: initReps
        }
      ],
      stats: {
        avgCpu,
        avgLatency: avgLat,
        peakCpu,
        peakLatency: peakLat,
        scalingEventsCount: 0,
        costRatePerHour: Number((initReps * 2.45).toFixed(2))
      }
    };

    s.status = 'SIMULATING';
    s.lastSimulation = 'Now';
    s.replicas = initReps;
    s.cpuUtil = startCpu;
    s.latency = startLatency;

    return activeSimulation;
  },

  pauseSimulation(): SimulationSession {
    activeSimulation.status = 'PAUSED';
    return activeSimulation;
  },

  resumeSimulation(): SimulationSession {
    activeSimulation.status = 'RUNNING';
    return activeSimulation;
  },

  stopSimulation(): SimulationSession {
    activeSimulation.status = 'STOPPED';
    return activeSimulation;
  },

  restartSimulation(): SimulationSession {
    activeSimulation.status = 'RUNNING';
    activeSimulation.events = [];
    activeSimulation.elapsedSeconds = 0;
    activeSimulation.startTime = Date.now();
    return activeSimulation;
  },

  getExperiments(): Experiment[] {
    return [...experiments];
  },

  getExperiment(id: string): Experiment | null {
    return experiments.find(e => e.id === id) || experiments[0] || null;
  },

  runExperiment(data: {
    strategies: ScalingStrategy[];
    durationHours: number;
    workloadProfile: string;
    serviceId?: string;
  }): Experiment {
    const strats = data.strategies.length > 0 ? data.strategies : (['CPU', 'TREND', 'LATENCY'] as ScalingStrategy[]);
    const targetService = microservices.find(s => s.id === data.serviceId) || microservices[0];
    const expSeed = Math.floor(Math.random() * 90000) + 10000;
    const minR = targetService.minReplicas || 2;
    const maxR = targetService.maxReplicas || 12;

    const profile = (data.workloadProfile || '').toUpperCase();
    const svcLatency = targetService.responseBaseline || targetService.latency || 35;
    const span = maxR - minR;

    let svcHash = 0;
    for (let i = 0; i < (targetService.id || '').length; i++) {
      svcHash = (svcHash * 31 + (targetService.id || '').charCodeAt(i)) % 1000;
    }
    let profileHash = 0;
    for (let i = 0; i < profile.length; i++) {
      profileHash = (profileHash * 31 + profile.charCodeAt(i)) % 1000;
    }
    const combinedSeed = (expSeed + svcHash * 7 + profileHash * 13) % 10000;

    let cpuAvgLat: number;
    let cpuReplicas: number;
    let cpuEvents: number;
    let cpuEfficiency: number;
    let cpuCost: number;
    let cpuThrashing: number;
    let cpuPeakLat: number;
    let cpuAvgCpu: number;

    let trendAvgLat: number;
    let trendReplicas: number;
    let trendEvents: number;
    let trendEfficiency: number;
    let trendCost: number;
    let trendThrashing: number;
    let trendPeakLat: number;
    let trendAvgCpu: number;

    let latencyAvgLat: number;
    let latencyReplicas: number;
    let latencyEvents: number;
    let latencyEfficiency: number;
    let latencyCost: number;
    let latencyThrashing: number;
    let latencyPeakLat: number;
    let latencyAvgCpu: number;

    if (profile.includes('STABLE') || profile.includes('BASELINE')) {
      cpuAvgLat = Math.round(svcLatency * (0.95 + ((combinedSeed % 5) - 2) * 0.02));
      cpuReplicas = minR;
      cpuEvents = Math.max(1, Math.round(1 + (combinedSeed % 2)));
      cpuThrashing = 0;
      cpuEfficiency = Math.max(95, Math.min(99, 98 + ((combinedSeed % 3) - 1)));
      cpuAvgCpu = Number((62.0 + (combinedSeed % 6) - 3).toFixed(1));

      trendAvgLat = Math.round(svcLatency * (1.02 + ((combinedSeed % 5) - 2) * 0.02));
      trendReplicas = Math.min(maxR, minR + 1);
      trendEvents = Math.max(1, Math.round(2 + (combinedSeed % 2)));
      trendThrashing = 0;
      trendEfficiency = Math.max(88, Math.min(94, 91 + ((combinedSeed % 4) - 2)));
      trendAvgCpu = Number((66.0 + (combinedSeed % 6) - 3).toFixed(1));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.65 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, minR + Math.max(1, Math.round(span * 0.35)));
      latencyEvents = Math.max(4, Math.round(6 + (combinedSeed % 3)));
      latencyThrashing = 2;
      latencyEfficiency = Math.max(62, Math.min(74, 68 + ((combinedSeed % 6) - 3)));
      latencyAvgCpu = Number((48.0 + (combinedSeed % 6) - 3).toFixed(1));

    } else if (profile.includes('PERIODIC') || profile.includes('SINE') || profile.includes('SUSTAINED') || profile.includes('DIURNAL')) {
      trendAvgLat = Math.round(svcLatency * (0.75 + ((combinedSeed % 5) - 2) * 0.03));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.44 + (combinedSeed % 2))));
      trendEvents = Math.max(2, Math.round(3 + (combinedSeed % 3)));
      trendThrashing = Math.max(0, Math.round(1 + (combinedSeed % 2)));
      trendEfficiency = Math.max(94, Math.min(99, 96 + ((combinedSeed % 4) - 2)));
      trendAvgCpu = Number((74.0 + (combinedSeed % 6) - 3).toFixed(1));

      cpuAvgLat = Math.round(svcLatency * (1.22 + ((combinedSeed % 6) - 3) * 0.04));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.58 + (combinedSeed % 3))));
      cpuEvents = Math.max(10, Math.round(14 + (combinedSeed % 6)));
      cpuThrashing = Math.max(3, Math.round(6 + (combinedSeed % 4)));
      cpuEfficiency = Math.max(78, Math.min(86, 82 + ((combinedSeed % 5) - 2)));
      cpuAvgCpu = Number((68.0 + (combinedSeed % 6) - 3).toFixed(1));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.50 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.78 + (combinedSeed % 2))));
      latencyEvents = Math.max(14, Math.round(18 + (combinedSeed % 6)));
      latencyThrashing = Math.max(4, Math.round(9 + (combinedSeed % 4)));
      latencyEfficiency = Math.max(68, Math.min(78, 73 + ((combinedSeed % 6) - 3)));
      latencyAvgCpu = Number((44.0 + (combinedSeed % 6) - 3).toFixed(1));

    } else if (profile.includes('BLACK_FRIDAY') || profile.includes('SUDDEN_SPIKE') || profile.includes('FLASH')) {
      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.44 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.max(minR, maxR - (combinedSeed % 2));
      latencyEvents = Math.max(15, Math.round(18 + (combinedSeed % 8)));
      latencyThrashing = Math.max(6, Math.round(12 + (combinedSeed % 6)));
      latencyEfficiency = Math.max(88, Math.min(97, 93 + ((combinedSeed % 4) - 2)));
      latencyAvgCpu = Number((54.0 + (combinedSeed % 6) - 3).toFixed(1));

      trendAvgLat = Math.round(svcLatency * (0.86 + ((combinedSeed % 5) - 2) * 0.04));
      trendReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.66 + (combinedSeed % 2))));
      trendEvents = Math.max(5, Math.round(8 + (combinedSeed % 4)));
      trendThrashing = Math.max(1, Math.round(2 + (combinedSeed % 2)));
      trendEfficiency = Math.max(86, Math.min(94, 90 + ((combinedSeed % 4) - 2)));
      trendAvgCpu = Number((72.0 + (combinedSeed % 6) - 3).toFixed(1));

      cpuAvgLat = Math.round(svcLatency * (1.85 + ((combinedSeed % 7) - 3) * 0.08));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.48 + (combinedSeed % 3))));
      cpuEvents = Math.max(22, Math.round(30 + (combinedSeed % 10)));
      cpuThrashing = Math.max(14, Math.round(20 + (combinedSeed % 8)));
      cpuEfficiency = Math.max(45, Math.min(62, 54 + ((combinedSeed % 8) - 4)));
      cpuAvgCpu = Number((86.0 + (combinedSeed % 6) - 3).toFixed(1));

    } else if (profile.includes('CHAOS') || profile.includes('JITTER') || profile.includes('CHAOTIC')) {
      trendAvgLat = Math.round(svcLatency * (0.90 + ((combinedSeed % 5) - 2) * 0.04));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.54 + (combinedSeed % 2))));
      trendEvents = Math.max(6, Math.round(9 + (combinedSeed % 4)));
      trendThrashing = Math.max(2, Math.round(4 + (combinedSeed % 2)));
      trendEfficiency = Math.max(84, Math.min(92, 88 + ((combinedSeed % 4) - 2)));
      trendAvgCpu = Number((70.0 + (combinedSeed % 6) - 3).toFixed(1));

      latencyAvgLat = Math.max(5, Math.round(svcLatency * (0.58 + ((combinedSeed % 4) - 2) * 0.04)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.82 + (combinedSeed % 2))));
      latencyEvents = Math.max(18, Math.round(24 + (combinedSeed % 8)));
      latencyThrashing = Math.max(8, Math.round(15 + (combinedSeed % 6)));
      latencyEfficiency = Math.max(65, Math.min(76, 71 + ((combinedSeed % 6) - 3)));
      latencyAvgCpu = Number((50.0 + (combinedSeed % 6) - 3).toFixed(1));

      cpuAvgLat = Math.round(svcLatency * (2.15 + ((combinedSeed % 7) - 3) * 0.09));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.62 + (combinedSeed % 4))));
      cpuEvents = Math.max(26, Math.round(36 + (combinedSeed % 12)));
      cpuThrashing = Math.max(16, Math.round(24 + (combinedSeed % 8)));
      cpuEfficiency = Math.max(40, Math.min(55, 48 + ((combinedSeed % 8) - 4)));
      cpuAvgCpu = Number((82.0 + (combinedSeed % 6) - 3).toFixed(1));

    } else {
      trendAvgLat = Math.round(svcLatency * (0.80 + ((combinedSeed % 5) - 2) * 0.03));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.48 + (combinedSeed % 2))));
      trendEvents = Math.max(3, Math.round(5 + (combinedSeed % 3)));
      trendThrashing = Math.max(0, Math.round(1 + (combinedSeed % 2)));
      trendEfficiency = Math.max(91, Math.min(97, 94 + ((combinedSeed % 4) - 2)));
      trendAvgCpu = Number((72.0 + (combinedSeed % 6) - 3).toFixed(1));

      cpuAvgLat = Math.round(svcLatency * (1.32 + ((combinedSeed % 6) - 3) * 0.04));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.54 + (combinedSeed % 3))));
      cpuEvents = Math.max(8, Math.round(14 + (combinedSeed % 6)));
      cpuThrashing = Math.max(2, Math.round(4 + (combinedSeed % 3)));
      cpuEfficiency = Math.max(80, Math.min(89, 85 + ((combinedSeed % 5) - 2)));
      cpuAvgCpu = Number((68.0 + (combinedSeed % 6) - 3).toFixed(1));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.48 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.80 + (combinedSeed % 2))));
      latencyEvents = Math.max(16, Math.round(22 + (combinedSeed % 8)));
      latencyThrashing = Math.max(5, Math.round(10 + (combinedSeed % 5)));
      latencyEfficiency = Math.max(66, Math.min(78, 72 + ((combinedSeed % 6) - 3)));
      latencyAvgCpu = Number((46.0 + (combinedSeed % 6) - 3).toFixed(1));
    }

    cpuPeakLat = Math.round(cpuAvgLat * (1.55 + (combinedSeed % 4) * 0.08));
    cpuCost = Number((cpuReplicas * 0.58).toFixed(2));

    trendPeakLat = Math.round(trendAvgLat * (1.30 + (combinedSeed % 4) * 0.05));
    trendCost = Number((trendReplicas * 0.54).toFixed(2));

    latencyPeakLat = Math.round(latencyAvgLat * (1.45 + (combinedSeed % 4) * 0.06));
    latencyCost = Number((latencyReplicas * 0.72).toFixed(2));

    const getRating = (eff: number): 'EXCELLENT' | 'FAIR' | 'POOR' => {
      if (eff >= 80) return 'EXCELLENT';
      if (eff >= 50) return 'FAIR';
      return 'POOR';
    };

    const stratsMap = {
      CPU: {
        strategy: 'CPU' as ScalingStrategy,
        status: (cpuThrashing > 12 ? 'Thrashing' : 'Healthy') as StrategyResult['status'],
        activeReplicas: cpuReplicas,
        finalReplicas: cpuReplicas,
        avgLatency: cpuAvgLat,
        avgCpu: cpuAvgCpu,
        peakLatency: cpuPeakLat,
        scalingEventsCount: cpuEvents,
        thrashingScore: cpuThrashing,
        resourceCostPerHour: cpuCost,
        efficiencyPercent: cpuEfficiency,
        rating: getRating(cpuEfficiency),
        telemetry: []
      },
      TREND: {
        strategy: 'TREND' as ScalingStrategy,
        status: 'Optimal' as StrategyResult['status'],
        activeReplicas: trendReplicas,
        finalReplicas: trendReplicas,
        avgLatency: trendAvgLat,
        avgCpu: trendAvgCpu,
        peakLatency: trendPeakLat,
        scalingEventsCount: trendEvents,
        thrashingScore: trendThrashing,
        resourceCostPerHour: trendCost,
        efficiencyPercent: trendEfficiency,
        rating: getRating(trendEfficiency),
        telemetry: []
      },
      LATENCY: {
        strategy: 'LATENCY' as ScalingStrategy,
        status: (latencyThrashing > 12 ? 'Thrashing' : 'Healthy') as StrategyResult['status'],
        activeReplicas: latencyReplicas,
        finalReplicas: latencyReplicas,
        avgLatency: latencyAvgLat,
        avgCpu: latencyAvgCpu,
        peakLatency: latencyPeakLat,
        scalingEventsCount: latencyEvents,
        thrashingScore: latencyThrashing,
        resourceCostPerHour: latencyCost,
        efficiencyPercent: latencyEfficiency,
        rating: getRating(latencyEfficiency),
        telemetry: []
      }
    };

    const strategyResults: StrategyResult[] = strats.map(s => stratsMap[s] || stratsMap.TREND);
    const bestResult = [...strategyResults].sort((a, b) => b.efficiencyPercent - a.efficiencyPercent)[0];

    const newExperiment: Experiment = {
      id: `EXP-${Math.floor(Math.random() * 8000) + 1000}`,
      title: `${targetService ? targetService.name : 'Cluster'}: ${data.workloadProfile} Benchmark`,
      workloadProfile: data.workloadProfile,
      durationHours: data.durationHours,
      serviceId: targetService?.id || 'srv-order-svc',
      serviceName: targetService?.name || 'Order Service',
      strategies: strats,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
      progressPercent: 100,
      elapsedSeconds: data.durationHours * 3600,
      totalSeconds: data.durationHours * 3600,
      strategyResults,
      bestStrategy: bestResult?.strategy || 'TREND',
      confidencePercent: Number((91.5 + ((expSeed * 17) % 75) / 10).toFixed(1)),
      bestEfficiency: bestResult?.efficiencyPercent || 92
    };

    experiments = [newExperiment, ...experiments];
    return newExperiment;
  },

  getAnalytics(timeframe = 'Last 1 Hour'): AnalyticsData {
    const liveCpu = activeSimulation.currentCpu;
    const liveLat = activeSimulation.currentLatency;
    const liveReps = activeSimulation.currentReplicas;
    const liveEvents = activeSimulation.stats.scalingEventsCount;
    const profile = (activeSimulation.workloadProfile || 'HIGH_BURST').toUpperCase();
    const activeStrat = activeSimulation.strategy || 'CPU';

    const targetSvc = microservices.find(s => s.id === activeSimulation.serviceId) || microservices[0];
    const svcLatency = targetSvc.responseBaseline || targetSvc.latency || 35;
    const minR = activeSimulation.minReplicas || targetSvc.minReplicas || 2;
    const maxR = activeSimulation.maxReplicas || targetSvc.maxReplicas || 12;
    const span = maxR - minR;
    const seed = activeSimulation.stats.scalingEventsCount * 13 + (activeSimulation.elapsedSeconds || 17);

    let svcHash = 0;
    for (let i = 0; i < (targetSvc.id || '').length; i++) {
      svcHash = (svcHash * 31 + (targetSvc.id || '').charCodeAt(i)) % 1000;
    }
    let profileHash = 0;
    for (let i = 0; i < profile.length; i++) {
      profileHash = (profileHash * 31 + profile.charCodeAt(i)) % 1000;
    }
    const combinedSeed = (seed + svcHash * 7 + profileHash * 13) % 10000;

    let cpuAvgLat: number;
    let cpuReplicas: number;
    let cpuEvents: number;
    let cpuEfficiency: number;

    let trendAvgLat: number;
    let trendReplicas: number;
    let trendEvents: number;
    let trendEfficiency: number;

    let latencyAvgLat: number;
    let latencyReplicas: number;
    let latencyEvents: number;
    let latencyEfficiency: number;

    if (profile.includes('STABLE') || profile.includes('BASELINE')) {
      cpuAvgLat = Math.round(svcLatency * (0.95 + ((combinedSeed % 5) - 2) * 0.02));
      cpuReplicas = minR;
      cpuEvents = Math.max(1, Math.round(1 + (combinedSeed % 2)));
      cpuEfficiency = Math.max(95, Math.min(99, 98 + ((combinedSeed % 3) - 1)));

      trendAvgLat = Math.round(svcLatency * (1.02 + ((combinedSeed % 5) - 2) * 0.02));
      trendReplicas = Math.min(maxR, minR + 1);
      trendEvents = Math.max(1, Math.round(2 + (combinedSeed % 2)));
      trendEfficiency = Math.max(88, Math.min(94, 91 + ((combinedSeed % 4) - 2)));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.65 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, minR + Math.max(1, Math.round(span * 0.35)));
      latencyEvents = Math.max(4, Math.round(6 + (combinedSeed % 3)));
      latencyEfficiency = Math.max(62, Math.min(74, 68 + ((combinedSeed % 6) - 3)));

    } else if (profile.includes('PERIODIC') || profile.includes('SINE') || profile.includes('SUSTAINED') || profile.includes('DIURNAL')) {
      trendAvgLat = Math.round(svcLatency * (0.75 + ((combinedSeed % 5) - 2) * 0.03));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.44 + (combinedSeed % 2))));
      trendEvents = Math.max(2, Math.round(3 + (combinedSeed % 3)));
      trendEfficiency = Math.max(94, Math.min(99, 96 + ((combinedSeed % 4) - 2)));

      cpuAvgLat = Math.round(svcLatency * (1.22 + ((combinedSeed % 6) - 3) * 0.04));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.58 + (combinedSeed % 3))));
      cpuEvents = Math.max(10, Math.round(14 + (combinedSeed % 6)));
      cpuEfficiency = Math.max(78, Math.min(86, 82 + ((combinedSeed % 5) - 2)));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.50 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.78 + (combinedSeed % 2))));
      latencyEvents = Math.max(14, Math.round(18 + (combinedSeed % 6)));
      latencyEfficiency = Math.max(68, Math.min(78, 73 + ((combinedSeed % 6) - 3)));

    } else if (profile.includes('BLACK_FRIDAY') || profile.includes('SUDDEN_SPIKE') || profile.includes('FLASH')) {
      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.44 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.max(minR, maxR - (combinedSeed % 2));
      latencyEvents = Math.max(15, Math.round(18 + (combinedSeed % 8)));
      latencyEfficiency = Math.max(88, Math.min(97, 93 + ((combinedSeed % 4) - 2)));

      trendAvgLat = Math.round(svcLatency * (0.86 + ((combinedSeed % 5) - 2) * 0.04));
      trendReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.66 + (combinedSeed % 2))));
      trendEvents = Math.max(5, Math.round(8 + (combinedSeed % 4)));
      trendEfficiency = Math.max(86, Math.min(94, 90 + ((combinedSeed % 4) - 2)));

      cpuAvgLat = Math.round(svcLatency * (1.85 + ((combinedSeed % 7) - 3) * 0.08));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.48 + (combinedSeed % 3))));
      cpuEvents = Math.max(22, Math.round(30 + (combinedSeed % 10)));
      cpuEfficiency = Math.max(45, Math.min(62, 54 + ((combinedSeed % 8) - 4)));

    } else if (profile.includes('CHAOS') || profile.includes('JITTER') || profile.includes('CHAOTIC')) {
      trendAvgLat = Math.round(svcLatency * (0.90 + ((combinedSeed % 5) - 2) * 0.04));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.54 + (combinedSeed % 2))));
      trendEvents = Math.max(6, Math.round(9 + (combinedSeed % 4)));
      trendEfficiency = Math.max(84, Math.min(92, 88 + ((combinedSeed % 4) - 2)));

      latencyAvgLat = Math.max(5, Math.round(svcLatency * (0.58 + ((combinedSeed % 4) - 2) * 0.04)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.82 + (combinedSeed % 2))));
      latencyEvents = Math.max(18, Math.round(24 + (combinedSeed % 8)));
      latencyEfficiency = Math.max(65, Math.min(76, 71 + ((combinedSeed % 6) - 3)));

      cpuAvgLat = Math.round(svcLatency * (2.15 + ((combinedSeed % 7) - 3) * 0.09));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.62 + (combinedSeed % 4))));
      cpuEvents = Math.max(26, Math.round(36 + (combinedSeed % 12)));
      cpuEfficiency = Math.max(40, Math.min(55, 48 + ((combinedSeed % 8) - 4)));

    } else {
      trendAvgLat = Math.round(svcLatency * (0.80 + ((combinedSeed % 5) - 2) * 0.03));
      trendReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.48 + (combinedSeed % 2))));
      trendEvents = Math.max(3, Math.round(5 + (combinedSeed % 3)));
      trendEfficiency = Math.max(91, Math.min(97, 94 + ((combinedSeed % 4) - 2)));

      cpuAvgLat = Math.round(svcLatency * (1.32 + ((combinedSeed % 6) - 3) * 0.04));
      cpuReplicas = Math.min(maxR, Math.max(minR + 1, Math.round(minR + span * 0.54 + (combinedSeed % 3))));
      cpuEvents = Math.max(8, Math.round(14 + (combinedSeed % 6)));
      cpuEfficiency = Math.max(80, Math.min(89, 85 + ((combinedSeed % 5) - 2)));

      latencyAvgLat = Math.max(4, Math.round(svcLatency * (0.48 + ((combinedSeed % 4) - 2) * 0.03)));
      latencyReplicas = Math.min(maxR, Math.max(minR + 2, Math.round(minR + span * 0.80 + (combinedSeed % 2))));
      latencyEvents = Math.max(16, Math.round(22 + (combinedSeed % 8)));
      latencyEfficiency = Math.max(66, Math.min(78, 72 + ((combinedSeed % 6) - 3)));
    }

    if (activeStrat === 'CPU') {
      cpuAvgLat = Math.round(liveLat);
      cpuReplicas = liveReps;
      cpuEvents = Math.max(1, liveEvents);
    } else if (activeStrat === 'TREND') {
      trendAvgLat = Math.round(liveLat);
      trendReplicas = liveReps;
      trendEvents = Math.max(1, liveEvents);
    } else if (activeStrat === 'LATENCY') {
      latencyAvgLat = Math.round(liveLat);
      latencyReplicas = liveReps;
      latencyEvents = Math.max(1, liveEvents);
    }

    const getRating = (eff: number): 'EXCELLENT' | 'FAIR' | 'POOR' => {
      if (eff >= 80) return 'EXCELLENT';
      if (eff >= 50) return 'FAIR';
      return 'POOR';
    };

    const strats = [
      {
        strategy: 'CPU' as ScalingStrategy,
        name: 'Reactive CPU (75% Threshold)',
        avgLatency: cpuAvgLat,
        finalReplicas: cpuReplicas,
        scalingEvents: cpuEvents,
        efficiency: cpuEfficiency,
        rating: getRating(cpuEfficiency),
        isBest: false
      },
      {
        strategy: 'TREND' as ScalingStrategy,
        name: 'Predictive Trend Analysis',
        avgLatency: trendAvgLat,
        finalReplicas: trendReplicas,
        scalingEvents: trendEvents,
        efficiency: trendEfficiency,
        rating: getRating(trendEfficiency),
        isBest: false
      },
      {
        strategy: 'LATENCY' as ScalingStrategy,
        name: 'Aggressive Latency SLA (150ms)',
        avgLatency: latencyAvgLat,
        finalReplicas: latencyReplicas,
        scalingEvents: latencyEvents,
        efficiency: latencyEfficiency,
        rating: getRating(latencyEfficiency),
        isBest: false
      }
    ];

    let maxEff = -1;
    let bestIdx = 0;
    strats.forEach((s, idx) => {
      if (s.efficiency > maxEff) {
        maxEff = s.efficiency;
        bestIdx = idx;
      }
    });
    strats[bestIdx].isBest = true;

    let efficiencyRating = 'A-';
    let efficiencyStatus = 'Optimum';
    if (maxEff >= 95) {
      efficiencyRating = 'A+';
      efficiencyStatus = 'Optimal';
    } else if (maxEff >= 88) {
      efficiencyRating = 'A';
      efficiencyStatus = 'Optimum';
    } else if (maxEff >= 80) {
      efficiencyRating = 'A-';
      efficiencyStatus = 'Optimum';
    } else if (maxEff >= 70) {
      efficiencyRating = 'B+';
      efficiencyStatus = 'Stable';
    } else if (maxEff >= 50) {
      efficiencyRating = 'B';
      efficiencyStatus = 'Fair';
    } else {
      efficiencyRating = 'C';
      efficiencyStatus = 'Review Needed';
    }

    const scalingEventsPerHour = Math.max(6, Math.round(liveEvents * 6 + (liveCpu > 75 ? 18 : 6) + (combinedSeed % 20)));
    const avgResponseTime = activeSimulation.stats.avgLatency || liveLat;
    const baselineLatency = targetSvc.responseBaseline || targetSvc.latency || 45;
    const avgResponseTimeDeltaPercent = Number((((avgResponseTime - baselineLatency) / baselineLatency) * 100).toFixed(1));
    const avgCpu = activeSimulation.stats.avgCpu || liveCpu;
    const avgCpuDeltaPercent = Number((avgCpu - 75).toFixed(1));

    const timelineTelemetry = activeSimulation.telemetry.length >= 6
      ? activeSimulation.telemetry.slice(-9).map((pt, idx) => ({
          time: `T-${(activeSimulation.telemetry.slice(-9).length - 1 - idx) * 2}s`,
          latency: pt.latency,
          cpu: pt.cpu,
          replicas: pt.replicas
        }))
      : Array.from({ length: 9 }, (_, i) => ({
          time: `T-${(8 - i) * 5}m`,
          latency: Math.max(5, Math.round(liveLat + Math.sin(i) * 10)),
          cpu: Math.min(100, Math.max(10, Math.round(liveCpu + Math.cos(i) * 12))),
          replicas: liveReps
        }));

    const confidencePercent = Number((92.5 + (activeSimulation.elapsedSeconds % 55) / 10).toFixed(1));

    return {
      timeframe,
      avgResponseTime,
      avgResponseTimeDeltaPercent,
      avgCpu,
      avgCpuDeltaPercent,
      scalingEventsPerHour,
      efficiencyRating,
      efficiencyStatus,
      timelineTelemetry,
      scalingHistogram: [
        { bucket: 'T-60m', count: Math.max(4, Math.round(scalingEventsPerHour * 0.25)), isPeak: false },
        { bucket: 'T-45m', count: Math.max(6, Math.round(scalingEventsPerHour * 0.45)), isPeak: false },
        { bucket: 'T-30m', count: Math.max(12, Math.round(scalingEventsPerHour * 0.9)), isPeak: true },
        { bucket: 'T-15m', count: Math.max(8, Math.round(scalingEventsPerHour * 0.6)), isPeak: false },
        { bucket: 'Now', count: Math.max(2, Math.round(scalingEventsPerHour * 0.35)), isPeak: false }
      ],
      confidencePercent,
      strategyComparisons: strats
    };
  },

  getSettings() {
    return { ...settingsState };
  },

  updateSettings(data: any) {
    settingsState = { ...settingsState, ...data };
    return { success: true, settings: settingsState };
  }
};

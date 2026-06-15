import type { EnvironmentState, Vec3 } from './types.js';

const DEFAULT_ENV: EnvironmentState = {
  temperature: 20,
  windSpeed: 0,
  windDirection: { x: 0, y: 0, z: 1 },
  moisture: 0,
  deltaTemp: 0,
};

export function createEnvironment(overrides?: Partial<EnvironmentState>): EnvironmentState {
  return { ...DEFAULT_ENV, ...overrides };
}

let _time = 0;

export function processTick(
  env: EnvironmentState,
  deltaTime: number
): EnvironmentState {
  _time += deltaTime;

  const t = _time;

  // Temperature diurnal cycle: peak at noon, min at midnight
  const baseTemp = 20;
  const tempAmplitude = 5;
  const dailyPhase = (t % 86400) / 86400;
  const temperature = baseTemp + tempAmplitude * Math.sin((dailyPhase - 0.25) * 2 * Math.PI);

  // Wind gusting: semi-random using deterministic sine superposition
  const gustBase = 2;
  const gustVar = 3;
  const windSpeed = Math.max(0, gustBase + gustVar * (
    Math.sin(t * 0.01) * 0.5 +
    Math.sin(t * 0.037) * 0.3 +
    Math.sin(t * 0.071) * 0.2
  ));

  // Wind direction rotates slowly
  const windAngle = t * 0.0001;
  const windDirection: Vec3 = {
    x: Math.cos(windAngle),
    y: 0,
    z: Math.sin(windAngle),
  };

  // Moisture: follows temperature with lag (dew point model)
  const moisture = Math.max(0, Math.min(1,
    0.3 + 0.4 * Math.sin((dailyPhase - 0.1) * 2 * Math.PI)
  ));

  // Delta temperature (rate of change)
  const deltaTemp = temperature - env.temperature;

  return {
    temperature,
    windSpeed,
    windDirection,
    moisture,
    deltaTemp,
  };
}

export function getWindForce(
  env: EnvironmentState,
  frontalArea: number
): Vec3 {
  const dynamicPressure = 0.5 * 1.225 * env.windSpeed * env.windSpeed;
  const forceMag = dynamicPressure * frontalArea;
  return {
    x: env.windDirection.x * forceMag,
    y: env.windDirection.y * forceMag,
    z: env.windDirection.z * forceMag,
  };
}

export function getMoistureEffect(env: EnvironmentState): number {
  return env.moisture;
}

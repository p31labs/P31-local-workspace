import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const PSK = __ENV.PSK || 'test-psk-123';
const BASE_URL = __ENV.BASE_URL || 'https://jitterbug-api.trimtab-signal.workers.dev';

const validBrainDump = {
  projectName: 'Load Test Project',
  coreProblem: 'Load testing',
  currentState: { artifacts: [], gaps: [], blockers: [] },
  constraints: [],
  knownAssets: [],
  openQuestions: [],
  desiredEndState: {
    description: 'Load test',
    targetStage: 'fruit',
    measurableCriteria: [],
    convergenceTarget: 'Load test',
  },
  metadata: {
    capturedAt: new Date().toISOString(),
    operator: 'load-test',
    source: 'api',
    tags: ['load-test'],
  },
};

export default function () {
  const payload = JSON.stringify(validBrainDump);
  const res = http.post(
    `${BASE_URL}/brain-dump`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PSK}`,
      },
    }
  );

  check(res, {
    'status is 202': (r) => r.status === 202,
    'response has ID': (r) => r.json('id') !== undefined,
  });

  sleep(1);
}

export function setup() {
  return { baseUrl: BASE_URL };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSovereignBrain } from './useSovereignBrain';
import { endpoints } from '../config/endpoints';

export type ResearchDepth = 'quick' | 'deep' | 'full';
export type ResearchStatus = 'idle' | 'planning' | 'executing' | 'converging' | 'completed' | 'error';

export interface ResearchPlan {
  axes: Array<{
    id: string;
    name: string;
    focusArea: string;
    deliverables: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
}

export interface ResearchProgress {
  phase: string;
  completed: number;
  total: number;
  currentAxis?: string;
  message?: string;
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
    citations?: Array<{ text: string; url?: string }>;
  }>;
  conclusion: string;
  sources: Array<{ title: string; url?: string; relevance: string }>;
  raw: string;
}

const JITTERBUG_API = endpoints.jitterbugProxy;

export function useQuantumBrainDump() {
  const [status, setStatus] = useState<ResearchStatus>('idle');
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { generateResponse } = useSovereignBrain();

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelResearch = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
  }, []);

  const startResearch = useCallback(async (query: string, depth: ResearchDepth = 'deep') => {
    cancelResearch();
    if (!query.trim()) return;

    setStatus('planning');
    setError(null);
    setReport(null);
    setPlan(null);
    setProgress(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const submitRes = await fetch(`${JITTERBUG_API}/jitterbug/brain-dump`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          projectName: `Research: ${query.slice(0, 50)}${query.length > 50 ? '…' : ''}`,
          coreProblem: query,
          currentState: { artifacts: [], gaps: [], blockers: [] },
          constraints: [
            { id: 'c1', rule: `Depth: ${depth}`, severity: 'preferred' },
            { id: 'c2', rule: 'Provide citations and sources where possible', severity: 'preferred' },
          ],
          desiredEndState: {
            description: 'Comprehensive research report with clear sections, analysis, and actionable insights',
            targetStage: 'fruit',
            measurableCriteria: ['Structured report generated', 'Citations included'],
            convergenceTarget: 'Complete research output ready for review',
          },
          knownAssets: [
            { name: 'Jitterbug API', description: 'Deep research orchestration engine', location: JITTERBUG_API },
            { name: 'Edge AI Proxy', description: 'Cloudflare Workers AI inference proxy', location: endpoints.aiProxy },
            { name: 'PHOS Sovereign Brain', description: 'Local-first + edge fallback LLM engine' },
          ],
          openQuestions: [],
          metadata: {
            capturedAt: new Date().toISOString(),
            operator: 'phos-user',
            source: 'api',
            tags: ['quantum-brain-dump', depth],
          },
        }),
      });

      if (!submitRes.ok) {
        throw new Error(`Jitterbug API returned ${submitRes.status}`);
      }

      const { id } = await submitRes.json() as { id: string };

      const eventSource = new EventSource(`${JITTERBUG_API}/jitterbug/brain-dump/${id}/stream`);
      eventSourceRef.current = eventSource;

      let lastStatus: ResearchStatus = 'planning';
      let pollTimer: ReturnType<typeof setTimeout> | null = null;

      const pollForReport = async () => {
        if (lastStatus === 'completed' || lastStatus === 'error') return;
        try {
          const res = await fetch(`${JITTERBUG_API}/jitterbug/brain-dump/${id}`, {
            signal: controller.signal,
            headers,
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'completed' && data.report) {
            setReport({
              title: data.report.title || `Research: ${query.slice(0, 60)}`,
              summary: data.report.summary || '',
              sections: data.report.sections || [],
              conclusion: data.report.conclusion || '',
              sources: data.report.sources || [],
              raw: data.report.raw || '',
            });
            setStatus('completed');
            return;
          }
          if (data.status === 'failed') {
            setError(data.error || 'Research failed');
            setStatus('error');
            return;
          }
        } catch {
          // ignore poll errors
        }
        pollTimer = setTimeout(pollForReport, 3000);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status) {
            const mappedStatus: ResearchStatus =
              data.status === 'pending' ? 'planning' :
              data.status === 'processing' ? 'executing' :
              data.status === 'converging' ? 'converging' :
              data.status === 'completed' ? 'completed' :
              data.status === 'failed' ? 'error' : status;
            setStatus(mappedStatus);
            lastStatus = mappedStatus;
          }

          if (data.axes) {
            setPlan({
              axes: data.axes.map((a: any) => ({
                id: a.id,
                name: a.name,
                focusArea: a.focusArea,
                deliverables: a.deliverable || [],
                status: a.status || 'pending',
              })),
            });
          }

          if (data.progress !== undefined) {
            setProgress({
              phase: data.phase || 'Processing',
              completed: data.progress,
              total: data.total || 100,
              currentAxis: data.currentAxis,
              message: data.message,
            });
          }

          if (data.status === 'completed' && data.report) {
            const reportData = data.report;
            setReport({
              title: reportData.title || `Research: ${query.slice(0, 60)}`,
              summary: reportData.summary || '',
              sections: reportData.sections || [],
              conclusion: reportData.conclusion || '',
              sources: reportData.sources || [],
              raw: reportData.raw || '',
            });
            setStatus('completed');
            eventSource.close();
            eventSourceRef.current = null;
            if (pollTimer) clearTimeout(pollTimer);
          }

          if (data.status === 'failed') {
            setError(data.error || 'Research failed to converge');
            setStatus('error');
            eventSource.close();
            eventSourceRef.current = null;
            if (pollTimer) clearTimeout(pollTimer);
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        if (lastStatus !== 'completed' && lastStatus !== 'error') {
          pollForReport();
        }
      };

      setTimeout(() => {
        if (lastStatus === 'planning' || lastStatus === 'executing') {
          pollForReport();
        }
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed to start');
      setStatus('error');
    }
  }, [cancelResearch]);

  useEffect(() => {
    return () => cancelResearch();
  }, [cancelResearch]);

  return {
    status,
    plan,
    progress,
    report,
    error,
    startResearch,
    cancelResearch,
    isIdle: status === 'idle',
    isProcessing: status === 'planning' || status === 'executing' || status === 'converging' || status === 'error',
  };
}

/**
 * @file hud/DatasetPanel.tsx — Dataset management HUD
 *
 * Public-facing data interface: upload CSV/JSON (drag-drop or picker), load a
 * raw data URL, list loaded datasets, toggle the active face/vertex layer, and
 * remove datasets. Replaces the hardcoded HDX demo buttons for public use.
 */

import { useRef, useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { useDatasetStore } from '../store/datasetStore';
import { parseDataset } from '../engine/datasetParser';
import type { Dataset, DatasetTarget } from '../engine/datasetTypes';
import { domeConfig } from '../config/domeConfig';

const PANEL_BASE: React.CSSProperties = {
  background: 'rgba(6,10,18,0.92)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#e0e4ec',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};

export default function DatasetPanel() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const datasets = useDatasetStore((s) => s.datasets);
  const activeFaceId = useDatasetStore((s) => s.activeFaceDatasetId);
  const activeVertexId = useDatasetStore((s) => s.activeVertexDatasetId);
  const isLoading = useDatasetStore((s) => s.isLoading);
  const addDataset = useDatasetStore((s) => s.addDataset);
  const removeDataset = useDatasetStore((s) => s.removeDataset);
  const setActiveFaceDataset = useDatasetStore((s) => s.setActiveFaceDataset);
  const setActiveVertexDataset = useDatasetStore((s) => s.setActiveVertexDataset);
  const loadDataset = useDatasetStore((s) => s.loadDataset);
  const clearAll = useDatasetStore((s) => s.clearAll);

  const ingestText = useCallback(async (raw: string, name: string, source: 'upload' | 'url') => {
    setUploadError(null);
    const result = parseDataset(raw);
    if (result.points.length === 0) {
      setUploadError(result.errors[0] ?? 'No data points found.');
      return false;
    }

    const target: DatasetTarget = result.schema.detectedTarget;
    const id = addDataset({
      name,
      source,
      target,
      data: result.points,
      visible: true,
      opacity: 1,
      schema: result.schema,
      metadata: {
        rows: result.points.length,
        fields: result.schema.fields,
        detectedTarget: result.schema.detectedTarget,
        errors: result.errors,
      },
    });

    await loadDataset(id);

    if (target === 'face' || target === 'both') setActiveFaceDataset(id);
    if (target === 'vertex' || target === 'both') setActiveVertexDataset(id);
    return true;
  }, [addDataset, loadDataset, setActiveFaceDataset, setActiveVertexDataset]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!/\.(csv|json)$/i.test(file.name) && !file.type.includes('csv') && !file.type.includes('json')) {
      setUploadError('Only .csv or .json files are supported.');
      return;
    }
    const confirmed = window.confirm(
      `Load "${file.name}" into your personal dataset?\n\nThis data stays on your device only and is never sent to a server.`,
    );
    if (!confirmed) return;
    setIsUploading(true);
    try {
      const raw = await file.text();
      await ingestText(raw, file.name.replace(/\.[^.]+$/, ''), 'upload');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }, [ingestText]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFileUpload(file);
    e.target.value = '';
  }, [handleFileUpload]);

  const handleFetchUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url || isFetchingUrl) return;
    const confirmed = window.confirm(
      `Load data from ${url}?\n\nThis data stays on your device only.`,
    );
    if (!confirmed) return;
    setIsFetchingUrl(true);
    setUploadError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      await ingestText(text, new URL(url).hostname + url.split('/').pop()?.slice(0, 24) || url, 'url');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'URL load failed.');
    } finally {
      setIsFetchingUrl(false);
    }
  }, [urlInput, isFetchingUrl, ingestText]);

  const toggleFace = useCallback((id: string) => {
    setActiveFaceDataset(id === useDatasetStore.getState().activeFaceDatasetId ? null : id);
  }, [setActiveFaceDataset]);

  const toggleVertex = useCallback((id: string) => {
    setActiveVertexDataset(id === useDatasetStore.getState().activeVertexDatasetId ? null : id);
  }, [setActiveVertexDataset]);

  const handleDeleteDataset = useCallback((id: string) => {
    const name = datasets.find((d) => d.id === id)?.name || 'Dataset';
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis cannot be undone. Export first to keep a backup of this data.`,
    );
    if (!confirmed) return;
    removeDataset(id);
  }, [datasets, removeDataset]);

  const handleClearAllDatasets = useCallback(() => {
    const count = datasets.length;
    if (count === 0) return;
    const confirmed = window.confirm(
      `Delete all ${count} datasets?\n\nThis cannot be undone. Export first to keep a backup.`,
    );
    if (!confirmed) return;
    clearAll();
  }, [datasets, clearAll]);

  const activeFace = datasets.find((d) => d.id === activeFaceId) ?? null;
  const activeVertex = datasets.find((d) => d.id === activeVertexId) ?? null;

  return (
    <div
      style={{
        ...PANEL_BASE,
        width: '100%',
        maxHeight: '100%',
        padding: '16px 18px',
        overflowY: 'auto',
      }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee' }}>✦ Datasets</span>
            <span style={{ fontSize: 9, color: '#6a7a8a' }}>
              {datasets.length} loaded · max {domeConfig.data.maxActiveDatasets} active
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '14px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>⤒</div>
            <div style={{ fontSize: 10, color: '#8899aa' }}>Drop CSV/JSON here or click to upload</div>
            <div style={{ fontSize: 8, color: '#667788', marginTop: 4 }}>
              Auto-detects lat/lon, faceIndex, vertexIndex, value, category
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              type="url"
              placeholder="https://…/data.json or .csv"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleFetchUrl(); }}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#e0e4ec',
                padding: '6px 10px',
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <button
              onClick={() => void handleFetchUrl()}
              disabled={isFetchingUrl || !urlInput.trim()}
              style={{
                background: 'rgba(34,211,238,0.15)',
                border: '1px solid rgba(34,211,238,0.25)',
                borderRadius: 6,
                color: '#22d3ee',
                padding: '6px 12px',
                fontSize: 9,
                fontWeight: 600,
                cursor: isFetchingUrl ? 'wait' : 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isFetchingUrl ? '…' : 'Load'}
            </button>
          </div>

          {(uploadError || isLoading) && (
            <div style={{ fontSize: 9, marginBottom: 8 }}>
              {uploadError && <span style={{ color: '#ff4466' }}>⚠ {uploadError}</span>}
              {isLoading && <span style={{ color: '#22d3ee' }}>Loading dataset…</span>}
            </div>
          )}

          {datasets.length === 0 ? (
            <div style={{ fontSize: 9, color: '#667788', textAlign: 'center', padding: '14px 0' }}>
              No datasets loaded. Upload a CSV/JSON or load a URL to paint the dome.
            </div>
          ) : (
            datasets.map((ds) => (
              <DatasetRow
                key={ds.id}
                dataset={ds}
                activeFaceId={activeFaceId}
                activeVertexId={activeVertexId}
                onToggleFace={toggleFace}
                onToggleVertex={toggleVertex}
                onRemove={() => handleDeleteDataset(ds.id)}
              />
            ))
          )}

          {activeFace && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 9, color: '#667788' }}>
              Face layer: <span style={{ color: '#22d3ee' }}>{activeFace.name}</span>
              {activeVertex && <span> · Vertex layer: <span style={{ color: '#44ffaa' }}>{activeVertex.name}</span></span>}
            </div>
          )}

          {datasets.length > 0 && (
            <button
              onClick={handleClearAllDatasets}
              style={{
                marginTop: 10,
                background: 'none',
                border: 'none',
                color: '#667788',
                fontSize: 8,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                textDecoration: 'underline',
              }}
            >
              Clear all datasets
            </button>
          )}
        </div>
  );
}

function DatasetRow(props: {
  dataset: Dataset;
  activeFaceId: string | null;
  activeVertexId: string | null;
  onToggleFace: (id: string) => void;
  onToggleVertex: (id: string) => void;
  onRemove: () => void;
}) {
  const { dataset: ds, activeFaceId, activeVertexId, onToggleFace, onToggleVertex, onRemove } = props;
  const isFaceActive = ds.id === activeFaceId;
  const isVertexActive = ds.id === activeVertexId;

  const statusColor =
    ds.status === 'ready' ? '#44ffaa' : ds.status === 'error' ? '#ff4466' : '#f59e0b';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        marginBottom: 4,
        borderRadius: 6,
        background: isFaceActive || isVertexActive ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)',
        border: isFaceActive || isVertexActive ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#e0e4ec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ds.name}
          </span>
          <span style={{ fontSize: 8, color: '#667788', flexShrink: 0 }}>{ds.target}</span>
        </div>
        <div style={{ fontSize: 8, color: '#667788', marginTop: 2 }}>
          {ds.data.length} pts
          {ds.schema?.hasLatLon && ' · geo'}
          {ds.schema?.hasFaceIndex && ' · face'}
          {ds.schema?.hasVertexIndex && ' · vertex'}
          {ds.schema?.hasCategory && ' · cat'}
          {ds.status === 'error' && <span style={{ color: '#ff4466' }}> · {ds.error}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
        {(ds.target === 'face' || ds.target === 'both') && (
          <MiniToggle
            label={isFaceActive ? '●' : '○'}
            active={isFaceActive}
            color="#22d3ee"
            title="Toggle face layer"
            onClick={() => onToggleFace(ds.id)}
          />
        )}
        {(ds.target === 'vertex' || ds.target === 'both') && (
          <MiniToggle
            label={isVertexActive ? '●' : '○'}
            active={isVertexActive}
            color="#44ffaa"
            title="Toggle vertex layer"
            onClick={() => onToggleVertex(ds.id)}
          />
        )}
        <MiniToggle label="✕" active={false} color="#ff4466" title="Remove" onClick={onRemove} />
      </div>
    </div>
  );
}

function MiniToggle(props: { label: string; active: boolean; color: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      title={props.title}
      aria-label={props.title}
      style={{
        background: props.active ? `${props.color}33` : 'rgba(255,255,255,0.05)',
        border: props.active ? `1px solid ${props.color}66` : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        color: props.active ? props.color : '#8899aa',
        padding: '2px 7px',
        fontSize: 8,
        cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {props.label}
    </button>
  );
}

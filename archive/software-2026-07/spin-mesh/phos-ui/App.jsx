/**
 * SpIn Mesh — PHOS Operator UI
 * 
 * React + Vite app with P31 design tokens.
 * Calm, no‑FOMO, neuro‑affirmative.
 * Now with real PGLite/TinyBase integration.
 */

import React, { useState, useEffect } from 'react';
import JoyAttestationModal from './joy-attestation-modal';
import { initializeDbAndSync } from '../db-setup';
import './p31-theme.css';

export default function App() {
  const [intentQuery, setIntentQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and sync on mount
  useEffect(() => {
    const initDb = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize for demo user (in real app, this would be actual user ID)
        const { db, store, intentsTable } = await initializeDbAndSync('phos-demo', 
          'http://localhost:8787' // Matchmaking DO URL
        );
        
        // Store references globally for use in event handlers
        window.phosDb = { db, store, intentsTable };
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize DB:', err);
        setError('Failed to initialize database. Check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    initDb();

    // Cleanup on unmount
    return () => {
      if (window.phosDb?.db) {
        window.phosDb.db.close();
      }
    };
  }, []);

  // Search intents based on query
  const searchIntents = async (query: string) => {
    if (!isInitialized || !window.phosDb) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { db } = window.phosDb;
      
      // Query resources from PGLite
      const resources = db.prepare('SELECT id, doc FROM resources').all();
      
      // Filter resources based on query (simple text match for demo)
      // In a real implementation, this would use neuro_metadata matching
      const filtered = resources
        .map(row => ({ id: row.id, ...JSON.parse(row.doc) }))
        .filter(resource => 
          resource.title.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(resource.neuro_metadata || {}).toLowerCase().includes(query.toLowerCase())
        );
      
      setResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Check console for details.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openReleaseModal = (resource: any) => {
    setSelectedResource(resource);
    setShowModal(true);
  };

  if (isLoading && !isInitialized) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SpIn Mesh</h1>
          <p className="subtitle">Special Interest Barter — zero‑fiat, joy‑first</p>
        </header>
        <main>
          <p className="loading">Initializing database...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>SpIn Mesh</h1>
          <p className="subtitle">Special Interest Barter — zero‑fiat, joy‑first</p>
        </header>
        <main>
          <p className="error">Error: {error}</p>
          <button className="btn-secondary" onClick={() => setError(null)}>Retry</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SpIn Mesh</h1>
        <p className="subtitle">Special Interest Barter — zero‑fiat, joy‑first</p>
      </header>

      <main>
        {/* Intent Search */}
        <section className="search">
          <label htmlFor="intent-input">Find media for your nervous system</label>
          <input
            id="intent-input"
            type="text"
            placeholder='e.g. Zelda | Mario | deep‑crafting | regulate'
            value={intentQuery}
            onChange={e => setIntentQuery(e.target.value)}
            onBlur={() => searchIntents(intentQuery)}
          />
          <div className="results">
            {results.length === 0 ? (
              <p className="empty-state">No resources found. Try searching for a game title or intent.</p>
            ) : (
              results.map(r => (
                <div key={r.id} className="resource-card">
                  <h3>{r.title}</h3>
                  <dl>
                    <dt>Monotropic potential</dt><dd>{Math.round(r.neuro_metadata.monotropic_potential * 100)}%</dd>
                    <dt>Executive load</dt><dd>{r.neuro_metadata.executive_function_requirement}</dd>
                    <dt>Stimulation</dt><dd>{r.neuro_metadata.stimulation_profile.join(', ')}</dd>
                  </dl>
                  <button className="btn-primary" onClick={() => openReleaseModal(r)}>Release to Mesh</button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Cycle inbox */}
        <section className="cycles">
          <h2>Pending Cycles</h2>
          <p className="empty-state">No cycles locked yet.</p>
        </section>
      </main>

      {/* Joy Attestation modal */}
      {showModal && selectedResource && (
        <JoyAttestationModal
          resource={selectedResource}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

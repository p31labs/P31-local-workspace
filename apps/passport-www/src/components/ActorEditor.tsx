import { useState } from 'react';
import { usePassportStore } from '../hooks/usePassportStore';
import type { Actor } from '../hooks/usePassportStore';

export function ActorEditor() {
  const { passport, addActor, removeActor } = usePassportStore();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleAdd = () => {
    if (!id || !name || !role) return;
    addActor({ id, name, role });
    setId('');
    setName('');
    setRole('');
  };

  return (
    <div className="actor-editor" data-mcp-tool="actorEditor" data-mcp-state={passport.actors.length > 0 ? 'populated' : 'empty'}>
      <h3>Registered Actors</h3>
      <div className="actor-grid" data-mcp-tool="actorList" data-mcp-target="actor-list">
        {passport.actors.map((a: Actor) => (
          <div key={a.id} className="actor-card" data-mcp-tool="actorItem" data-mcp-target={`actor-${a.id}`}>
            <div className="actor-info">
              <span className="actor-id">{a.id}</span>
              <span className="actor-name">{a.name}</span>
              <span className="actor-role">{a.role}</span>
            </div>
            <button
              className="actor-remove"
              onClick={() => removeActor(a.id)}
              aria-label={`Remove ${a.name}`}
              data-mcp-tool="removeActor"
              data-mcp-type="action"
              data-mcp-target={`actor-${a.id}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="actor-add" data-mcp-tool="addActorForm" data-mcp-target="actor-add-form">
        <input
          placeholder="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          data-mcp-tool="actorField"
          data-mcp-target="actor-id-input"
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-mcp-tool="actorField"
          data-mcp-target="actor-name-input"
        />
        <input
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data-mcp-tool="actorField"
          data-mcp-target="actor-role-input"
        />
        <button
          onClick={handleAdd}
          className="btn-add"
          data-mcp-tool="addActor"
          data-mcp-type="action"
          data-mcp-target="actor-add-button"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

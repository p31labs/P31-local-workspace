import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './styles.css';
import { ChatWidget } from '../chat/ChatWidget';
import { MeshStatus } from '../quantum/MeshStatus';

if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
  console.error('[P31UI] React or ReactDOM not loaded. Include React and ReactDOM before this script.');
}

export interface ChatWidgetOptions {
  roomId?: string;
  persona?: string;
  placeholder?: string;
  title?: string;
}

export interface MeshStatusOptions {
  roomId?: string;
  refreshInterval?: number;
}

function renderChatWidget(container: HTMLElement, options: ChatWidgetOptions = {}): void {
  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(ChatWidget, {
      roomId: options.roomId || 'default',
      persona: options.persona || 'friend',
      placeholder: options.placeholder || 'Say something...',
      title: options.title || 'Mesh Chat',
    })
  );
}

function renderMeshStatus(container: HTMLElement, options: MeshStatusOptions = {}): void {
  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(MeshStatus, {
      roomId: options.roomId || 'default',
      refreshInterval: options.refreshInterval || 5000,
    })
  );
}

function registerMCPTools(): void {
  const ctx = (document as any).modelContext || (navigator as any).modelContext;
  if (!ctx || !ctx.registerTool) {
    console.warn('[P31UI] WebMCP not available — tools not registered');
    return;
  }

  ctx.registerTool({
    name: 'meshChat',
    description: 'Send a message to the cross-portal chat room.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The message to send' },
        roomId: { type: 'string', description: 'Chat room ID (default: default)' },
      },
      required: ['message'],
    },
    execute: async ({ message, roomId }: { message: string; roomId?: string }) => {
      document.dispatchEvent(new CustomEvent('p31-chat-send', {
        detail: { message, roomId: roomId || 'default' },
      }));
      return { status: 'sent', message, roomId: roomId || 'default' };
    },
  });

  ctx.registerTool({
    name: 'meshStatus',
    description: 'Get current K₄ mesh health metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'Mesh room ID (default: default)' },
      },
    },
    execute: async ({ roomId }: { roomId?: string }) => {
      const rid = roomId || 'default';
      try {
        const res = await fetch(`https://gateway.p31ca.org/api/mesh/${encodeURIComponent(rid)}/status`);
        const data = await res.json();
        return data.mesh || { error: 'No mesh data' };
      } catch (e) {
        return { error: String(e) };
      }
    },
  });

  console.log('[P31UI] MCP tools registered: meshChat, meshStatus');
}

const P31UI = {
  ChatWidget: renderChatWidget,
  MeshStatus: renderMeshStatus,
  React,
  ReactDOM,
  registerMCPTools,
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerMCPTools);
  } else {
    registerMCPTools();
  }
}

(window as any).P31UI = P31UI;
export default P31UI;

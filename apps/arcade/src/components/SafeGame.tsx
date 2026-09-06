import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export default function SafeGame({ game: Game }: { game: React.ComponentType }) {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}

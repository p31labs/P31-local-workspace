import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LawDashboard } from '../dashboards/LawDashboard';
import { KidDashboard } from '../dashboards/KidDashboard';
import { A11yDashboard } from '../dashboards/A11yDashboard';
import type { VaultItem } from '@p31/core';

export type FacetType = 'law' | 'kid' | 'a11y';

interface FacetContextValue {
  activeFacet: FacetType;
  setActiveFacet: (facet: FacetType) => void;
}

const FacetContext = createContext<FacetContextValue | undefined>(undefined);

export const useFacet = (): FacetContextValue => {
  const ctx = useContext(FacetContext);
  if (!ctx) throw new Error('useFacet must be used within a FacetSwitchboardProvider');
  return ctx;
};

interface FacetSwitchboardProps {
  children?: ReactNode;
  initialFacet?: FacetType;
  items?: VaultItem[];
  onAddItem?: (text: string) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const FacetSwitchboard: React.FC<FacetSwitchboardProps> = ({
  children,
  initialFacet = 'law',
  items = [],
  onAddItem,
  onDeleteItem,
  loading = false,
}) => {
  const [activeFacet, setActiveFacet] = useState<FacetType>(initialFacet);

  const renderDashboard = () => {
    const shared = { items, onAddItem, onDeleteItem, loading };
    switch (activeFacet) {
      case 'law':
        return <LawDashboard {...shared} />;
      case 'kid':
        return <KidDashboard {...shared} />;
      case 'a11y':
        return <A11yDashboard {...shared} />;
      default:
        return <LawDashboard {...shared} />;
    }
  };

  return (
    <FacetContext.Provider value={{ activeFacet, setActiveFacet }}>
      <div className="facet-switchboard w-full h-full">
        {renderDashboard()}
        {children}
      </div>
    </FacetContext.Provider>
  );
};

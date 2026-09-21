import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useAppCalculations } from '../../hooks/useAppCalculations';

function HookRunner({ props, onRender }) {
  const result = useAppCalculations(props);
  onRender(result);
  return null;
}

function testHook(props) {
  let result;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <HookRunner
        props={props}
        onRender={(val) => {
          result = val;
        }}
      />
    );
  });

  act(() => {
    root.unmount();
    container.remove();
  });

  return result;
}

describe('useAppCalculations Hook', () => {
  it('should compute stockItems with entrees, sorties, and alert status correctly', () => {
    const rawStock = [
      {
        id: 1,
        ref: 'ROUL-6204',
        designation: 'Roulement à billes 6204',
        stockInitial: 10,
        seuil: 5,
        emplacement: 'R1-B01',
      },
    ];

    const mouvements = [
      { ref: 'ROUL-6204', quantite: 3, type: 'Entrée' },
      { ref: 'ROUL-6204', quantite: 8, type: 'Sortie' },
    ];

    const result = testHook({ rawStock, mouvements });

    expect(result).toBeDefined();
    expect(result.stockItems).toHaveLength(1);

    const item = result.stockItems[0];
    expect(item.entrees).toBe(3);
    expect(item.sorties).toBe(8);
    // stockActuel = 10 + 3 - 8 = 5 (equals seuil 5 -> ALERTE)
    expect(item.stockActuel).toBe(5);
    expect(item.alerte).toBe('ALERTE');

    expect(result.stockKPIs.totalArticles).toBe(1);
    expect(result.stockKPIs.totalStockActuel).toBe(5);
    expect(result.stockKPIs.alertes).toBe(1);
    expect(result.stockKPIs.ruptures).toBe(0);
  });

  it('should detect RUPTURE when stockActuel reaches 0', () => {
    const rawStock = [
      {
        id: 2,
        ref: 'COUR-SPA-1000',
        designation: 'Courroie trapézoïdale',
        stockInitial: 4,
        seuil: 2,
      },
    ];

    const mouvements = [
      { ref: 'COUR-SPA-1000', quantite: 4, type: 'Sortie' },
    ];

    const result = testHook({ rawStock, mouvements });
    const item = result.stockItems[0];
    expect(item.stockActuel).toBe(0);
    expect(item.alerte).toBe('RUPTURE');
    expect(result.stockKPIs.ruptures).toBe(1);
  });

  it('should return safe empty defaults when no stock or movements are provided', () => {
    const result = testHook({});
    expect(result.stockItems).toEqual([]);
    expect(result.stockKPIs.totalArticles).toBe(0);
    expect(result.stockKPIs.totalStockActuel).toBe(0);
  });
});

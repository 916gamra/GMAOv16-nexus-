import React, { useMemo, useState, useRef, useEffect } from 'react';
import { List } from 'react-window';

/**
 * VirtualizedTable Component
 * High-performance virtualized table wrapper utilizing react-window for massive datasets (10,000+ items)
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Full dataset to render
 * @param {Array<{ key: string, label: string, width?: number|string, render?: (val: any, row: any) => React.ReactNode }>} props.columns - Column configuration
 * @param {number} [props.rowHeight=48] - Fixed row height in pixels
 * @param {number} [props.height=520] - Table viewport container height in pixels
 * @param {Function} [props.onRowClick] - Optional callback when row is clicked
 * @param {string} [props.emptyMessage="Aucune donnée disponible"] - Fallback when data is empty
 * @param {string} [props.className=""] - Extra container styling
 */
export function VirtualizedTable({
  data = [],
  columns = [],
  rowHeight = 48,
  height = 520,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const Row = useMemo(() => {
    return function VirtualizedRow({ index, style }) {
      const row = data[index];
      if (!row) return null;

      const isEven = index % 2 === 0;

      return (
        <div
          style={style}
          onClick={() => onRowClick && onRowClick(row)}
          className={`flex items-center border-b border-slate-200 transition-colors ${
            onRowClick ? 'cursor-pointer hover:bg-blue-50/60' : ''
          } ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}
        >
          {columns.map((col, cIdx) => {
            const val = row[col.key];
            const renderedVal = col.render ? col.render(val, row) : (val !== undefined && val !== null ? String(val) : '—');

            return (
              <div
                key={col.key || cIdx}
                style={{ width: col.width || `${100 / columns.length}%` }}
                className="px-3 py-2 text-xs text-slate-700 truncate font-medium flex items-center"
                title={typeof renderedVal === 'string' ? renderedVal : undefined}
              >
                {renderedVal}
              </div>
            );
          })}
        </div>
      );
    };
  }, [data, columns, onRowClick]);

  if (!data || data.length === 0) {
    return (
      <div className={`w-full py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-lg ${className}`}>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {/* Table Header */}
      <div className="flex items-center bg-slate-100/80 border-b border-slate-200 font-semibold text-slate-700 text-xs">
        {columns.map((col, cIdx) => (
          <div
            key={col.key || cIdx}
            style={{ width: col.width || `${100 / columns.length}%` }}
            className="px-3 py-3 select-none text-left tracking-wider uppercase font-bold text-slate-600"
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <List
        height={height}
        itemCount={data.length}
        itemSize={rowHeight}
        width={containerWidth}
      >
        {Row}
      </List>
    </div>
  );
}

export default VirtualizedTable;

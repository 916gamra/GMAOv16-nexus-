import React, { useRef, useState, useEffect } from 'react';
import { List } from 'react-window';

/**
 * مكون جدول ذكي افتراضي (Virtualized Table) لتحمل آلاف السجلات بسلاسة 60fps
 * @param {Array} items - العناصر المراد عرضها
 * @param {number} itemHeight - ارتفاع السطر الافتراضي (مثلاً 48)
 * @param {Function} renderRow - دالة رسم السطر ({ item, index, style })
 * @param {React.ReactNode} header - ترويسة الجدول
 * @param {number} maxHeight - أقصى ارتفاع للجدول
 * @param {string} emptyMessage - رسالة عند فراغ البيانات
 */
export function VirtualizedTable({
  items = [],
  itemHeight = 48,
  renderRow,
  header = null,
  maxHeight = 600,
  emptyMessage = "Aucun enregistrement trouvé"
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const calculatedHeight = Math.min(
          items.length * itemHeight,
          maxHeight
        );
        setDimensions({
          width: clientWidth || 800,
          height: Math.max(calculatedHeight, 150)
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [items.length, itemHeight, maxHeight]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {header}
        <div className="py-12 text-center text-slate-400 font-medium text-sm">
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Row renderer component for react-window
  const Row = ({ index, style }) => {
    const item = items[index];
    return renderRow ? renderRow({ item, index, style }) : (
      <div style={style} className="flex items-center px-4 border-b border-slate-100 text-sm">
        {JSON.stringify(item)}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {header && <div className="border-b border-slate-200 bg-slate-50/80">{header}</div>}
      <div className="overflow-x-auto w-full">
        {typeof List === 'function' ? (
          <List
            height={dimensions.height}
            itemCount={items.length}
            itemSize={itemHeight}
            width={dimensions.width}
          >
            {Row}
          </List>
        ) : (
          <div style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
            {items.map((item, idx) => (
              <React.Fragment key={item?.id || item?.ref || idx}>
                {renderRow ? renderRow({ item, index: idx, style: {} }) : <div>{JSON.stringify(item)}</div>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VirtualizedTable;

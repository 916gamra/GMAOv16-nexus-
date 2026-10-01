import { isValidElement } from 'react';
import PropTypes from 'prop-types';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import TableSkeletonRows from './TableSkeletonRows.jsx';
import TablePaginationCard from './TablePaginationCard.jsx';

/**
 * 🏛️ GMAO Industrial Data Grid (Unified Master Table Component)
 * Conforme à la Constitution GMAO : Composant unifié pour toutes les grilles
 * de données industrielles (Stock, Machines, Entrepôt, Référentiel).
 * 
 * Garantit:
 * 1. Présentation 3D unifiée avec ombrage et bordures industrielles
 * 2. Bandeau d'information et mappage officiel des colonnes Excel (A → Z)
 * 3. En-tête figé (Sticky thead) avec tri dynamique et numérotation des lignes
 * 4. Gestion automatique du chargement (Skeletons) et de l'état vide
 * 5. Intégration transparente de la carte de pagination (TablePaginationCard)
 */
export default function GmaoIndustrialDataGrid({
  title = '',
  icon = null,
  excelMapping = '',
  bannerColor = 'slate',
  headerRight = null,
  columns = [],
  data = [],
  isLoading = false,
  loadingRowsCount = 8,
  sortField = '',
  sortOrder = 'asc',
  onSort = null,
  renderSortIcon = null,
  startIndex = 0,
  showRowNumber = true,
  minWidth = 'min-w-[980px]',
  maxHeight = 'max-h-[62vh]',
  emptyMessage = 'Aucun enregistrement trouvé',
  emptyIcon = null,
  emptyAction = null,
  renderRow = null,
  pagination = null,
  tableClassName = '',
  containerClassName = '',
}) {
  const bannerColorStyles = {
    indigo: 'bg-indigo-50/40 text-indigo-950 text-slate-500 border-indigo-100/60',
    blue: 'bg-blue-50/40 text-blue-950 text-slate-500 border-blue-100/60',
    emerald: 'bg-emerald-50/40 text-emerald-950 text-slate-500 border-emerald-100/60',
    amber: 'bg-amber-50/40 text-amber-950 text-slate-500 border-amber-100/60',
    purple: 'bg-purple-50/40 text-purple-950 text-slate-500 border-purple-100/60',
    slate: 'bg-slate-50/80 text-slate-800 text-slate-500 border-slate-200/80',
  };

  const defaultRenderSortIcon = (field) => {
    if (!field || sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
    );
  };

  const sortIconRenderer = renderSortIcon || defaultRenderSortIcon;

  const renderBannerIcon = (ic) => {
    if (!ic) return null;
    if (isValidElement(ic)) return ic;
    const IconComponent = ic;
    return <IconComponent className="w-4 h-4 text-current shrink-0" />;
  };

  const renderColumnIcon = (ic) => {
    if (!ic) return null;
    if (isValidElement(ic)) return ic;
    const IconComponent = ic;
    return <IconComponent className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const totalCols = columns.length + (showRowNumber ? 1 : 0);

  return (
    <div className={`space-y-4 ${containerClassName}`}>
      {/* 3D Tactile Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out overflow-hidden">
        {/* Top Info Header Bar inside Card */}
        {(title || excelMapping || headerRight) && (
          <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between text-xs gap-2 ${bannerColorStyles[bannerColor] || bannerColorStyles.slate}`}>
            <div className="font-bold text-[13px] flex items-center gap-2">
              {renderBannerIcon(icon)}
              <span>{title}</span>
            </div>
            <div className="flex items-center gap-3">
              {excelMapping && (
                <div className="font-mono text-[11px] opacity-80 hidden lg:block">
                  {excelMapping}
                </div>
              )}
              {headerRight}
            </div>
          </div>
        )}

        {/* Scrollable Table Viewport */}
        <div className={`${maxHeight} overflow-y-auto overflow-x-auto`}>
          <table className={`w-full text-left text-xs border-collapse ${minWidth} ${tableClassName}`}>
            {/* Sticky Table Header */}
            <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 z-10 shadow-2xs select-none">
              <tr>
                {showRowNumber && (
                  <th className="py-3 px-3 text-center w-12 text-slate-500 font-mono text-[10px] bg-slate-200/60 border-r border-slate-200 shrink-0 select-none">
                    N°
                  </th>
                )}

                {columns.map((col) => {
                  const isSortable = Boolean(col.sortable && onSort);
                  const alignmentClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  const justifyClass =
                    col.align === 'center'
                      ? 'justify-center'
                      : col.align === 'right'
                      ? 'justify-end'
                      : 'justify-start';

                  const HeaderIcon = col.icon;

                  return (
                    <th
                      key={col.key}
                      onClick={() => isSortable && onSort(col.key)}
                      className={`py-3 px-3.5 select-none transition ${alignmentClass} ${
                        isSortable ? 'cursor-pointer hover:bg-slate-200/80 group' : ''
                      } ${col.headerClassName || ''}`}
                      title={isSortable ? `Cliquer pour trier par ${col.label}` : undefined}
                    >
                      <div className={`flex items-center gap-1.5 ${justifyClass}`}>
                        {renderColumnIcon(HeaderIcon)}
                        <span>{col.label}</span>
                        {col.colLetter && (
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({col.colLetter})
                          </span>
                        )}
                        {isSortable && sortIconRenderer(col.key)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <TableSkeletonRows rows={loadingRowsCount} columnsCount={totalCols} />
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {emptyIcon || <Inbox className="w-8 h-8 text-slate-300 stroke-1" />}
                      <span className="font-semibold text-xs text-slate-500">{emptyMessage}</span>
                      {emptyAction}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const rowNumber = startIndex + index + 1;
                  if (typeof renderRow === 'function') {
                    return renderRow(item, index, rowNumber);
                  }

                  const rowKey = item.id || item.ref || item.id_warehouse_item || item.code || index;

                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-slate-50/80 transition-colors duration-150 group"
                    >
                      {showRowNumber && (
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[10px] bg-slate-50/40 border-r border-slate-100 shrink-0 select-none">
                          {rowNumber}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`py-3 px-3.5 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          } ${col.cellClassName || ''}`}
                        >
                          {typeof col.render === 'function'
                            ? col.render(item, index, rowNumber)
                            : item[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Built-in Table Pagination Footer */}
      {pagination && (
        <TablePaginationCard
          currentPage={pagination.currentPage}
          setCurrentPage={pagination.setCurrentPage}
          pageSize={pagination.pageSize}
          setPageSize={pagination.setPageSize}
          totalItems={pagination.totalItems}
          pageSizeOptions={pagination.pageSizeOptions || [25, 50, 100, 200, 0]}
          color={pagination.color || bannerColor}
          itemLabel={pagination.itemLabel || 'enregistrements'}
        />
      )}
    </div>
  );
}

GmaoIndustrialDataGrid.propTypes = {
  title: PropTypes.node,
  icon: PropTypes.node,
  excelMapping: PropTypes.string,
  bannerColor: PropTypes.oneOf(['indigo', 'blue', 'emerald', 'amber', 'purple', 'slate']),
  headerRight: PropTypes.node,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      colLetter: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
      sortable: PropTypes.bool,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array,
  isLoading: PropTypes.bool,
  loadingRowsCount: PropTypes.number,
  sortField: PropTypes.string,
  sortOrder: PropTypes.string,
  onSort: PropTypes.func,
  renderSortIcon: PropTypes.func,
  startIndex: PropTypes.number,
  showRowNumber: PropTypes.bool,
  minWidth: PropTypes.string,
  maxHeight: PropTypes.string,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.node,
  emptyAction: PropTypes.node,
  renderRow: PropTypes.func,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    setCurrentPage: PropTypes.func.isRequired,
    pageSize: PropTypes.number.isRequired,
    setPageSize: PropTypes.func.isRequired,
    totalItems: PropTypes.number.isRequired,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
    color: PropTypes.string,
    itemLabel: PropTypes.string,
  }),
  tableClassName: PropTypes.string,
  containerClassName: PropTypes.string,
};

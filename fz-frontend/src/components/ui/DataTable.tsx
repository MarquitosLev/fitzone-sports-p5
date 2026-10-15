import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export interface Column<T = any> {
  key?: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
  cellClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TablePagination {
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pagination?: boolean | TablePagination;
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  className?: string;
}

export function DataTable<T extends Record<string, any> = any>({
  columns = [],
  data = [],
  isLoading = false,
  loading = false,
  emptyTitle = 'Sin datos disponibles',
  emptyMessage = 'No se encontraron registros en esta tabla.',
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onRowClick,
  keyExtractor,
  className = '',
}: DataTableProps<T>) {
  const isTableLoading = isLoading || loading;
  const isDataEmpty = !isTableLoading && (!data || data.length === 0);

  // Extract pagination details
  const hasPagination = Boolean(pagination);
  const paginationObj = typeof pagination === 'object' ? pagination : null;
  const currentPage = paginationObj?.currentPage || 1;
  const totalPages = paginationObj?.totalPages || 1;
  const totalItems = paginationObj?.totalItems ?? data.length;
  const onPageChange = paginationObj?.onPageChange;

  // Alignment helper
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden ${className}`}>
      {/* Table responsive container */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              {columns.map((col, idx) => (
                <th
                  key={col.key || `col-${idx}`}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={`
                    px-5 py-4 text-[11px] font-black uppercase text-slate-500 tracking-wider font-manrope
                    ${getAlignClass(col.align)}
                    ${col.className || ''}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
            {/* Loading state: Animated skeleton placeholder rows */}
            {isTableLoading && (
              <>
                {[1, 2, 3, 4].map((skeletonIdx) => (
                  <tr key={`skeleton-${skeletonIdx}`} className="animate-pulse bg-slate-50/30">
                    {columns.map((col, cIdx) => (
                      <td key={`skel-col-${cIdx}`} className="px-5 py-4">
                        <div
                          className="h-4 bg-slate-200 rounded-lg"
                          style={{ width: `${Math.max(40, (cIdx * 23 + 50) % 90)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* Empty state rendered within table */}
            {isDataEmpty && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <EmptyState
                    icon={Inbox}
                    title={emptyTitle}
                    description={emptyMessage}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                    className="border-0 shadow-none bg-transparent p-4"
                  />
                </td>
              </tr>
            )}

            {/* Populated data rows */}
            {!isTableLoading &&
              !isDataEmpty &&
              data.map((row, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row, rowIdx)
                  : row.id || row.key || `row-${rowIdx}`;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick?.(row, rowIdx)}
                    className={`
                      transition-colors duration-150
                      hover:bg-slate-50/80
                      ${isClickable ? 'cursor-pointer hover:bg-slate-100/60' : ''}
                    `}
                  >
                    {columns.map((col, colIdx) => {
                      const cellValue = col.key ? row[col.key] : null;

                      return (
                        <td
                          key={`cell-${rowKey}-${col.key || colIdx}`}
                          className={`
                            px-5 py-3.5 align-middle
                            ${getAlignClass(col.align)}
                            ${col.cellClassName || ''}
                          `}
                        >
                          {col.render
                            ? col.render(row, rowIdx)
                            : cellValue !== undefined && cellValue !== null
                            ? String(cellValue)
                            : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {hasPagination && !isTableLoading && !isDataEmpty && (
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          {/* Record summary */}
          <div>
            Mostrando{' '}
            <span className="font-extrabold text-[#1B2A55]">
              {data.length}
            </span>{' '}
            {totalItems ? `de ${totalItems}` : ''} registros
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              disabled={currentPage <= 1}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              leftIcon={ChevronLeft}
              aria-label="Página anterior"
            >
              Anterior
            </Button>

            <span className="px-2 text-slate-600 font-bold">
              Página {currentPage} de {totalPages || 1}
            </span>

            <Button
              variant="secondary"
              size="xs"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              rightIcon={ChevronRight}
              aria-label="Página siguiente"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

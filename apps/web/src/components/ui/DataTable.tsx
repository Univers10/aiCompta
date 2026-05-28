'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => any;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  pageSize = 20,
  emptyMessage = 'Aucune donnée',
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Recherche globale
    if (search) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessor(row);
          return String(value).toLowerCase().includes(search.toLowerCase());
        })
      );
    }

    // Filtres par colonne
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter((row) => {
          const col = columns.find((c) => c.key === key);
          if (!col) return true;
          const value = col.accessor(row);
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Tri
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        result.sort((a, b) => {
          const aVal = col.accessor(a);
          const bVal = col.accessor(b);
          
          if (aVal === bVal) return 0;
          const comparison = aVal < bVal ? -1 : 1;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, search, sortKey, sortDirection, columnFilters, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setColumnFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(columnFilters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Barre de recherche et filtres */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Filtres par colonne */}
      {showFilters && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {columns
              .filter((col) => col.filterable !== false)
              .map((col) => (
                <div key={col.key}>
                  <label className="text-xs font-medium text-zinc-600 mb-1 block">
                    {col.header}
                  </label>
                  <Input
                    type="text"
                    placeholder={`Filtrer ${col.header.toLowerCase()}...`}
                    value={columnFilters[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Résultats */}
      <div className="text-sm text-zinc-600 mb-3">
        {filteredAndSortedData.length} résultat{filteredAndSortedData.length > 1 ? 's' : ''}
        {filteredAndSortedData.length !== data.length && ` sur ${data.length}`}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                  } ${col.sortable !== false ? 'cursor-pointer hover:bg-zinc-100 select-none' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <div className="flex flex-col">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="w-4 h-4 opacity-30">
                            <ChevronUp className="w-3 h-3" />
                            <ChevronDown className="w-3 h-3 -mt-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                  {columns.map((col) => {
                    const value = col.accessor(row);
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

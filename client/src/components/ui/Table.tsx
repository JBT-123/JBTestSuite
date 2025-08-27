import React, { memo, useCallback } from 'react'
import Checkbox from './Checkbox'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  selectable?: boolean
  selectedItems?: T[]
  onSelectionChange?: (selectedItems: T[]) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string, order: 'asc' | 'desc') => void
  emptyMessage?: string
  className?: string
  getItemId: (item: T) => string | number
}

function TableComponent<T>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  sortBy,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'No data available',
  className = '',
  getItemId,
}: TableProps<T>) {
  const selectedIds = new Set(selectedItems.map(getItemId))
  const isAllSelected = data.length > 0 && data.every((item) => selectedIds.has(getItemId(item)))
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return

      if (checked) {
        onSelectionChange([
          ...selectedItems,
          ...data.filter((item) => !selectedIds.has(getItemId(item))),
        ])
      } else {
        const dataIds = new Set(data.map(getItemId))
        onSelectionChange(selectedItems.filter((item) => !dataIds.has(getItemId(item))))
      }
    },
    [onSelectionChange, selectedItems, data, selectedIds, getItemId]
  )

  const handleSelectItem = useCallback(
    (item: T, checked: boolean) => {
      if (!onSelectionChange) return

      if (checked) {
        onSelectionChange([...selectedItems, item])
      } else {
        onSelectionChange(
          selectedItems.filter((selectedItem) => getItemId(selectedItem) !== getItemId(item))
        )
      }
    },
    [onSelectionChange, selectedItems, getItemId]
  )

  const handleSort = useCallback(
    (key: string) => {
      if (!onSort) return

      const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'
      onSort(key, newOrder)
    },
    [onSort, sortBy, sortOrder]
  )

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return (
        <svg
          className="w-4 h-4 ml-1 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    return sortOrder === 'asc' ? (
      <svg
        className="w-4 h-4 ml-1 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const tableClasses = [
    'min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (loading) {
    return (
      <div className={tableClasses}>
        <div className="p-8 text-center" role="status" aria-live="polite">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            aria-hidden="true"
          ></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
          <span className="sr-only">Loading table data</span>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={tableClasses}>
        <div className="p-8 text-center" role="status">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={tableClasses}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200"
          role="table"
          aria-label="Test cases table"
        >
          <thead className="bg-gray-50">
            <tr role="row">
              {selectable && (
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
                  scope="col"
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all items"
                  />
                </th>
              )}
              {columns.map((column) => {
                const alignClasses = {
                  left: 'text-left',
                  center: 'text-center',
                  right: 'text-right',
                }

                return (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      alignClasses[column.align || 'left']
                    }`}
                    style={column.width ? { width: column.width } : undefined}
                    scope="col"
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="group inline-flex items-center hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors"
                        aria-label={`Sort by ${column.label} ${sortBy === String(column.key) && sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        <span>{column.label}</span>
                        {renderSortIcon(String(column.key))}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              const itemId = getItemId(item)
              const isSelected = selectedIds.has(itemId)

              return (
                <tr
                  key={String(itemId)}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  role="row"
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap w-12" role="gridcell">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleSelectItem(item, e.target.checked)}
                        aria-label={`Select item ${itemId}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const cellValue = column.key === 'index' ? index + 1 : (item as any)[column.key]
                    const alignClasses = {
                      left: 'text-left',
                      center: 'text-center',
                      right: 'text-right',
                    }

                    return (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                          alignClasses[column.align || 'left']
                        }`}
                        role="gridcell"
                      >
                        {column.render ? column.render(cellValue, item) : cellValue}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {selectable && data.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all items"
              />
              <span className="text-sm font-medium text-gray-700">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {selectedIds.size} of {data.length} selected
            </span>
          </div>
        )}

        {data.map((item, index) => {
          const itemId = getItemId(item)
          const isSelected = selectedIds.has(itemId)

          return (
            <div
              key={String(itemId)}
              className={`p-4 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              role={selectable ? 'option' : 'article'}
              aria-selected={selectable ? isSelected : undefined}
            >
              {selectable && (
                <div className="flex items-center mb-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                    aria-label={`Select item ${itemId}`}
                  />
                  <span className="ml-2 text-sm text-gray-600">Select</span>
                </div>
              )}

              <div className="space-y-3">
                {columns
                  .filter((col) => col.key !== 'actions')
                  .map((column) => {
                    const cellValue = column.key === 'index' ? index + 1 : (item as any)[column.key]

                    if (!cellValue && cellValue !== 0) return null

                    return (
                      <div key={String(column.key)} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-0 flex-shrink-0 w-24">
                          {column.label}:
                        </span>
                        <div className="text-sm text-gray-900 text-right flex-1 min-w-0">
                          {column.render ? column.render(cellValue, item) : cellValue}
                        </div>
                      </div>
                    )
                  })}

                {/* Actions always at bottom */}
                {columns.find((col) => col.key === 'actions') && (
                  <div className="pt-3 border-t border-gray-100">
                    {columns.find((col) => col.key === 'actions')?.render?.(null, item)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Table = memo(TableComponent) as <T>(props: TableProps<T>) => JSX.Element

export default Table

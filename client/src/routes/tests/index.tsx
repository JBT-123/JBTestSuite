import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTestCaseFilters, useDeleteTestCase } from '../../hooks'
import { formatDateTime, TEST_CASE_STATUS, TEST_CASE_PRIORITY } from '../../api'
import {
  Button,
  Table,
  Loading,
  Alert,
  EmptyState,
  AdvancedFilterBar,
  Pagination,
  BulkActions,
  Modal,
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveTable,
  type TableColumn,
  type BulkAction,
  type SavedSearch,
} from '../../components/ui'
import { StatusBadge, PriorityBadge } from '../../components/test-cases'
import { exportToCSV, exportToJSON, formatExportFilename } from '../../utils/export'
import type { TestCaseListResponse } from '../../types'

export const Route = createFileRoute('/tests/')({
  component: Tests,
})

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: TEST_CASE_STATUS.DRAFT, label: 'Draft' },
  { value: TEST_CASE_STATUS.ACTIVE, label: 'Active' },
  { value: TEST_CASE_STATUS.ARCHIVED, label: 'Archived' },
  { value: TEST_CASE_STATUS.INACTIVE, label: 'Inactive' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: TEST_CASE_PRIORITY.LOW, label: 'Low' },
  { value: TEST_CASE_PRIORITY.MEDIUM, label: 'Medium' },
  { value: TEST_CASE_PRIORITY.HIGH, label: 'High' },
  { value: TEST_CASE_PRIORITY.CRITICAL, label: 'Critical' },
]

function Tests() {
  const navigate = useNavigate()
  const {
    data: items,
    loading,
    error,
    pagination,
    filters,
    updateSearchFilter,
    updateStatusFilter,
    updatePriorityFilter,
    updateDateRangeFilter,
    clearAllFilters,
    hasActiveFilters,
    sorting,
    updatePagination,
    selection,
    columns: columnVisibility,
    refresh,
  } = useTestCaseFilters({
    initialPagination: { page: 1, limit: 25 },
    initialSort: { sort_by: 'created_at', order: 'desc' },
  })

  // Debug logging
  console.log('Tests page - items:', items)
  console.log('Tests page - loading:', loading)
  console.log('Tests page - error:', error)


  const deleteTestCase = useDeleteTestCase()

  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const handleBulkDelete = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selection.selectedItems.map((item) => deleteTestCase.mutateAsync(item.id)))
      selection.clearSelection()
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    setBulkActionLoading(true)
    try {
      console.log('Bulk status change to:', newStatus, selection.selectedItems)
      selection.clearSelection()
    } catch (error) {
      console.error('Bulk status change failed:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSavedSearchSelect = (savedSearch: SavedSearch) => {
    console.log('Selected saved search:', savedSearch)
  }

  const handleExportCSV = () => {
    const exportColumns = [
      { key: 'name' as keyof TestCaseListResponse, label: 'Name' },
      { key: 'description' as keyof TestCaseListResponse, label: 'Description' },
      { key: 'status' as keyof TestCaseListResponse, label: 'Status' },
      { key: 'priority' as keyof TestCaseListResponse, label: 'Priority' },
      { key: 'category' as keyof TestCaseListResponse, label: 'Category' },
      { key: 'step_count' as keyof TestCaseListResponse, label: 'Steps' },
      { key: 'execution_count' as keyof TestCaseListResponse, label: 'Executions' },
      { key: 'created_at' as keyof TestCaseListResponse, label: 'Created' },
    ]

    exportToCSV(
      selection.selectedItems.length > 0 ? selection.selectedItems : items,
      formatExportFilename('test-cases', 'csv'),
      exportColumns
    )
  }

  const handleExportJSON = () => {
    exportToJSON(
      selection.selectedItems.length > 0 ? selection.selectedItems : items,
      formatExportFilename('test-cases', 'json')
    )
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      variant: 'default',
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
        </svg>
      ),
      variant: 'default',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      variant: 'danger',
      requiresConfirmation: true,
      confirmationTitle: 'Delete Test Cases',
      confirmationMessage:
        'This action cannot be undone. The selected test cases and all their steps will be permanently deleted.',
    },
  ]

  const handleBulkAction = async (actionId: string) => {
    switch (actionId) {
      case 'activate':
        await handleBulkStatusChange(TEST_CASE_STATUS.ACTIVE)
        break
      case 'archive':
        await handleBulkStatusChange(TEST_CASE_STATUS.ARCHIVED)
        break
      case 'delete':
        await handleBulkDelete()
        break
    }
  }

  const allColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      priority: 'high' as const,
      showOnMobile: true,
      mobileLabel: 'Test Case',
      render: (_: any, testCase: TestCaseListResponse) => (
        <div>
          <Link
            to="/tests/$testId"
            params={{ testId: testCase.id }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {testCase.name}
          </Link>
          {testCase.description && (
            <div className="max-w-xs truncate text-sm text-gray-500">{testCase.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      priority: 'high' as const,
      showOnMobile: true,
      render: (_: any, testCase: TestCaseListResponse) => (
        <StatusBadge status={testCase.status || 'unknown'} />
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      priority: 'medium' as const,
      render: (_: any, testCase: TestCaseListResponse) => (
        <PriorityBadge priority={testCase.priority || 'unknown'} />
      ),
    },
    {
      key: 'step_count',
      label: 'Steps',
      sortable: true,
      priority: 'low' as const,
      render: (_: any, testCase: TestCaseListResponse) => (
        <span className="text-sm text-gray-900">{testCase.step_count || 0}</span>
      ),
    },
    {
      key: 'execution_count',
      label: 'Runs',
      sortable: true,
      priority: 'low' as const,
      render: (_: any, testCase: TestCaseListResponse) => (
        <span className="text-sm text-gray-900">{testCase.execution_count || 0}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      priority: 'medium' as const,
      render: (_: any, testCase: TestCaseListResponse) => (
        <span className="text-sm text-gray-900">{formatDateTime(testCase.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      priority: 'low' as const,
      render: (_: any, testCase: TestCaseListResponse) => (
        <div className="flex items-center gap-2">
          <Link 
            to="/tests/$testId" 
            params={{ testId: testCase.id }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            View
          </Link>
          <Link 
            to="/tests/$testId/edit" 
            params={{ testId: testCase.id }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Link>
        </div>
      ),
    },
  ] as TableColumn<TestCaseListResponse>[]

  const visibleColumns = allColumns.filter(
    (column) => columnVisibility.visibility[column.key] !== false
  )

  return (
    <div className="py-4 sm:py-8">
      <ResponsiveContainer maxWidth="7xl" padding={{ xs: 4, sm: 6, lg: 8 }}>
        {/* Header */}
        <ResponsiveStack
          direction={{ xs: 'col', lg: 'row' }}
          gap={4}
          justify="between"
          align={{ xs: 'stretch', lg: 'center' }}
          className="mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Test Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and organize your test cases with powerful filtering and bulk operations
            </p>
          </div>
          <ResponsiveStack direction={{ xs: 'col', sm: 'row' }} gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="w-full sm:w-auto hidden md:flex"
              aria-label="Toggle column visibility"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span className="sm:inline">Columns</span>
            </Button>
            <Button
              onClick={() => navigate({ to: '/tests/create' })}
              className="w-full sm:w-auto"
              aria-label="Create new test case"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="sm:inline">Create Test Case</span>
            </Button>
            <Button
              onClick={() => {
                console.log('Testing direct navigation to mock test case')
                navigate({ to: '/tests/$testId', params: { testId: '00000001-1234-5678-9012-000000000001' } })
              }}
              variant="outline"
              className="w-full sm:w-auto"
              aria-label="Test navigation"
            >
              🔧 Test Navigate
            </Button>
          </ResponsiveStack>
        </ResponsiveStack>

        <div className="space-y-4 sm:space-y-6">
          {/* Advanced Filter Bar */}
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
            <AdvancedFilterBar
              searchValue={filters.search}
              onSearchChange={updateSearchFilter}
              onSavedSearchSelect={handleSavedSearchSelect}
              statusFilter={filters.status}
              onStatusFilterChange={updateStatusFilter}
              priorityFilter={filters.priority}
              onPriorityFilterChange={updatePriorityFilter}
              dateRange={filters.dateRange}
              onDateRangeChange={updateDateRangeFilter}
              onClearFilters={clearAllFilters}
              statusOptions={STATUS_OPTIONS}
              priorityOptions={PRIORITY_OPTIONS}
              showQuickFilters={true}
            />

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="text-sm text-gray-700" role="status" aria-live="polite">
                  {pagination.totalItems.toLocaleString()} test case
                  {pagination.totalItems === 1 ? '' : 's'} found
                  {hasActiveFilters && ' (filtered)'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refresh()}
                  loading={loading}
                  className="w-fit"
                  aria-label="Refresh test cases list"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={items.length === 0}
                  className="w-full sm:w-auto"
                  aria-label="Export test cases as CSV file"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={items.length === 0}
                  className="w-full sm:w-auto"
                  aria-label="Export test cases as JSON file"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export JSON
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selection.selectedItems.length}
            totalCount={items.length}
            actions={bulkActions}
            onAction={handleBulkAction}
            onSelectAll={selection.selectAllItems}
            onClearSelection={selection.clearSelection}
            loading={bulkActionLoading}
          />

          {/* Main Content */}
          <div className="rounded-lg bg-white shadow-sm">
            {loading && (
              <div className="p-8">
                <Loading size="lg" text="Loading test cases..." />
              </div>
            )}

            {!loading && error && (
              <div className="p-8">
                <Alert
                  type="error"
                  title="Error Loading Test Cases"
                  message={`${String((error as any)?.message ?? error)}\n\nMake sure the server is running on http://localhost:8000`}
                />
              </div>
            )}

            {!loading && !error && (
              <div>
                {items.length === 0 && !hasActiveFilters ? (
                  <div className="p-8">
                    <EmptyState
                      title="No Test Cases Found"
                      description="Get started by creating your first test case."
                      action={{
                        label: 'Create Test Case',
                        onClick: () => navigate({ to: '/tests/create' }),
                      }}
                    />
                  </div>
                ) : items.length === 0 && hasActiveFilters ? (
                  <div className="p-8">
                    <EmptyState
                      title="No Results Found"
                      description="Try adjusting your search criteria or clearing filters."
                      action={{
                        label: 'Clear Filters',
                        onClick: clearAllFilters,
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <ResponsiveTable
                      data={items}
                      columns={visibleColumns}
                      loading={false}
                      selectable={true}
                      selectedItems={selection.selectedItems}
                      onSelectionChange={(selectedItems) => {
                        selection.clearSelection()
                        selectedItems.forEach((item) => {
                          selection.toggleItemSelection(item, true)
                        })
                      }}
                      sortBy={sorting.sortBy}
                      sortOrder={sorting.sortOrder}
                      onSort={sorting.updateSort}
                      emptyMessage="No test cases found"
                      getItemId={(item) => item.id}
                      mobileBreakpoint="md"
                      showMobileCards={true}
                      compactMode={false}
                    />

                    {pagination.totalPages > 1 && (
                      <div className="p-6 border-t border-gray-200">
                        <Pagination
                          currentPage={pagination.currentPage}
                          totalPages={pagination.totalPages}
                          totalItems={pagination.totalItems}
                          itemsPerPage={pagination.itemsPerPage}
                          onPageChange={(page) => updatePagination({ page })}
                          onItemsPerPageChange={(limit) => updatePagination({ limit, page: 1 })}
                          showPageSizeSelector={true}
                          pageSizeOptions={[10, 25, 50, 100]}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column Selector Modal */}
        <Modal
          isOpen={showColumnSelector}
          onClose={() => setShowColumnSelector(false)}
          title="Column Visibility"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose which columns to display in the table.</p>

            <div className="space-y-3">
              {Object.entries(columnVisibility.visibility).map(([key, visible]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => columnVisibility.toggleVisibility(key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Modal>

        {/* Error Alert */}
        {deleteTestCase.error && (
          <Alert
            type="error"
            title="Error deleting test case"
            message={String((deleteTestCase.error as any)?.message ?? deleteTestCase.error)}
            className="mt-4"
          />
        )}
      </ResponsiveContainer>
    </div>
  )
}
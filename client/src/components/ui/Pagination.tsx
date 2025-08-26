import Button from './Button'
import Select from './Select'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
  className?: string
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showPageSizeSelector = true,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = '',
}: PaginationProps) {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const delta = 2
    const pages = []
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    if (totalPages <= 1) return []

    pages.push(1)

    if (start > 2) {
      pages.push('...')
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    if (end < totalPages - 1) {
      pages.push('...')
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null
  }

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing{' '}
          <span className="font-medium">{startItem.toLocaleString()}</span> to{' '}
          <span className="font-medium">{endItem.toLocaleString()}</span> of{' '}
          <span className="font-medium">{totalItems.toLocaleString()}</span> results
        </div>

        {showPageSizeSelector && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-gray-700">
              Show:
            </label>
            <Select
              id="page-size"
              value={itemsPerPage.toString()}
              onChange={(value) => onItemsPerPageChange(Number(value))}
              options={pageSizeOptions.map((size) => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              className="w-20"
            />
            <span className="text-sm text-gray-700">per page</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {visiblePages.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                )
              }

              const pageNumber = page as number
              const isCurrentPage = pageNumber === currentPage

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}

export default Pagination
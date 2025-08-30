import { useState } from 'react'
import Table, { TableProps, TableColumn } from './Table'
import Button from './Button'
import ResponsiveDrawer from './ResponsiveDrawer'

export interface ResponsiveTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: Array<
    TableColumn<T> & {
      priority?: 'high' | 'medium' | 'low'
      showOnMobile?: boolean
      mobileLabel?: string
    }
  >
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
  showMobileCards?: boolean
  mobileCardRenderer?: (item: T, index: number) => React.ReactNode
  compactMode?: boolean
}

function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  mobileBreakpoint = 'md',
  showMobileCards = true,
  mobileCardRenderer,
  compactMode = false,
  className = '',
  ...tableProps
}: ResponsiveTableProps<T>) {
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [mobileColumnsVisible, setMobileColumnsVisible] = useState<Record<string, boolean>>({})

  const breakpointClass = {
    sm: 'sm:table',
    md: 'md:table',
    lg: 'lg:table',
  }[mobileBreakpoint]

  const mobilePriorityColumns = columns
    .filter((col) => col.priority === 'high' || col.showOnMobile === true)
    .slice(0, 2) // Show max 2 columns on mobile

  const toggleMobileColumn = (columnKey: string) => {
    setMobileColumnsVisible((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  const renderMobileCard = (item: T, index: number) => {
    if (mobileCardRenderer) {
      return mobileCardRenderer(item, index)
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        {columns.map((column) => {
          if (!column.showOnMobile && column.priority !== 'high') {
            return null
          }

          const cellValue = column.render
            ? column.render(item[column.key], item, index)
            : item[column.key]

          return (
            <div
              key={column.key}
              className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm font-medium text-gray-600 capitalize">
                {column.mobileLabel ||
                  String(column.label)
                    .replace(/([A-Z])/g, ' $1')
                    .trim()}
                :
              </span>
              <div className="text-sm text-gray-900 text-right max-w-[60%]">{cellValue}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMobileView = () => {
    if (!showMobileCards) {
      return (
        <div className="overflow-x-auto">
          <Table
            {...tableProps}
            data={data}
            columns={mobilePriorityColumns}
            className="min-w-full"
          />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Mobile Controls */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {data.length} item{data.length !== 1 ? 's' : ''}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(true)}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Columns
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={tableProps.getItemId ? tableProps.getItemId(item) : index}>
              {renderMobileCard(item, index)}
            </div>
          ))}
        </div>

        {/* Column Selector Drawer */}
        <ResponsiveDrawer
          isOpen={showColumnSelector}
          onClose={() => setShowColumnSelector(false)}
          title="Show Columns"
          position="bottom"
          size="full"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select which information to display on each card:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {columns.map((column) => (
                <label key={column.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      mobileColumnsVisible[column.key] !== undefined
                        ? mobileColumnsVisible[column.key]
                        : column.showOnMobile || column.priority === 'high'
                    }
                    onChange={() => toggleMobileColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">
                    {column.mobileLabel || String(column.label)}
                  </span>
                  {column.priority === 'high' && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      Essential
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </ResponsiveDrawer>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className={`hidden ${breakpointClass}`}>
        <Table {...tableProps} data={data} columns={columns} />
      </div>

      {/* Mobile View */}
      <div className={`${breakpointClass.replace('table', 'hidden')}`}>{renderMobileView()}</div>
    </div>
  )
}

export default ResponsiveTable

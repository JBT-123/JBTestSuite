import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Table, { type TableColumn } from './Table'

interface MockItem {
  id: string
  name: string
  status: string
  priority: 'high' | 'medium' | 'low'
  count: number
}

const mockData: MockItem[] = [
  { id: '1', name: 'Item 1', status: 'active', priority: 'high', count: 10 },
  { id: '2', name: 'Item 2', status: 'inactive', priority: 'medium', count: 5 },
  { id: '3', name: 'Item 3', status: 'pending', priority: 'low', count: 0 },
]

const mockColumns: TableColumn<MockItem>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'priority', label: 'Priority', align: 'center' },
  { key: 'count', label: 'Count', align: 'right', render: (value) => `${value} items` },
]

const getItemId = (item: MockItem) => item.id

describe('Table Component', () => {
  const mockOnSort = vi.fn()
  const mockOnSelectionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getItemId={getItemId}
      />
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByText('Item 1')).toHaveLength(2) // Desktop and mobile
    expect(screen.getAllByText('Item 2')).toHaveLength(2)
    expect(screen.getAllByText('Item 3')).toHaveLength(2)
  })

  it('renders column headers correctly', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getItemId={getItemId}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()
  })

  it('renders custom cell content using render function', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getItemId={getItemId}
      />
    )

    expect(screen.getAllByText('10 items')).toHaveLength(2) // Desktop and mobile
    expect(screen.getAllByText('5 items')).toHaveLength(2)
    expect(screen.getAllByText('0 items')).toHaveLength(2)
  })

  it('shows loading state', () => {
    render(
      <Table
        data={[]}
        columns={mockColumns}
        loading={true}
        getItemId={getItemId}
      />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByText('Loading table data')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(
      <Table
        data={[]}
        columns={mockColumns}
        getItemId={getItemId}
      />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    render(
      <Table
        data={[]}
        columns={mockColumns}
        emptyMessage="No items found"
        getItemId={getItemId}
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders sortable columns with sort buttons', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        getItemId={getItemId}
      />
    )

    const nameButton = screen.getByLabelText(/Sort by Name/i)
    const statusButton = screen.getByLabelText(/Sort by Status/i)

    expect(nameButton).toBeInTheDocument()
    expect(statusButton).toBeInTheDocument()
  })

  it('calls onSort when sortable column is clicked', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        getItemId={getItemId}
      />
    )

    const nameButton = screen.getByLabelText(/Sort by Name/i)
    fireEvent.click(nameButton)

    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc')
  })

  it('toggles sort order when same column is clicked', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        sortBy="name"
        sortOrder="asc"
        getItemId={getItemId}
      />
    )

    const nameButton = screen.getByLabelText(/Sort by Name descending/i)
    fireEvent.click(nameButton)

    expect(mockOnSort).toHaveBeenCalledWith('name', 'desc')
  })

  it('renders select all checkbox when selectable', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const selectAllCheckboxes = screen.getAllByLabelText('Select all items')
    expect(selectAllCheckboxes).toHaveLength(2) // Desktop table header and mobile
  })

  it('renders individual selection checkboxes when selectable', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    expect(screen.getAllByLabelText('Select item 1')).toHaveLength(2)
    expect(screen.getAllByLabelText('Select item 2')).toHaveLength(2)
    expect(screen.getAllByLabelText('Select item 3')).toHaveLength(2)
  })

  it('handles individual item selection', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const checkboxes = screen.getAllByLabelText('Select item 1')
    fireEvent.click(checkboxes[0]) // Use first checkbox (desktop)

    expect(mockOnSelectionChange).toHaveBeenCalledWith([mockData[0]])
  })

  it('handles select all functionality', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const selectAllCheckboxes = screen.getAllByLabelText('Select all items')
    fireEvent.click(selectAllCheckboxes[0]) // Use first checkbox (desktop)

    expect(mockOnSelectionChange).toHaveBeenCalledWith(mockData)
  })

  it('handles deselect all functionality', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={mockData}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const selectAllCheckboxes = screen.getAllByLabelText('Select all items')
    expect(selectAllCheckboxes[0]).toBeChecked()

    fireEvent.click(selectAllCheckboxes[0])

    expect(mockOnSelectionChange).toHaveBeenCalledWith([])
  })

  it('shows indeterminate state when some items selected', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const selectAllCheckboxes = screen.getAllByLabelText('Select all items') as HTMLInputElement[]
    expect(selectAllCheckboxes[0].indeterminate).toBe(true)
  })

  it('highlights selected rows', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const rows = screen.getAllByRole('row')
    const dataRows = rows.slice(1) // Skip header row

    expect(dataRows[0]).toHaveClass('bg-blue-50')
    expect(dataRows[1]).not.toHaveClass('bg-blue-50')
  })

  it('applies column alignment classes', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        getItemId={getItemId}
      />
    )

    // Check header alignment
    const headers = screen.getAllByRole('columnheader')
    const priorityHeader = headers.find(h => h.textContent?.includes('Priority'))
    const countHeader = headers.find(h => h.textContent?.includes('Count'))

    expect(priorityHeader).toHaveClass('text-center')
    expect(countHeader).toHaveClass('text-right')
  })

  it('applies custom className', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        className="custom-table-class"
        getItemId={getItemId}
      />
    )

    const tableContainer = screen.getByRole('table').closest('div')?.parentElement
    expect(tableContainer).toHaveClass('custom-table-class')
  })

  it('handles empty selection change gracefully', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[]}
        getItemId={getItemId}
      />
    )

    const checkboxes = screen.getAllByLabelText('Select item 1')
    fireEvent.click(checkboxes[0])

    // Should not crash when onSelectionChange is not provided
    expect(checkboxes[0]).toBeInTheDocument()
  })

  it('renders with proper accessibility attributes', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        getItemId={getItemId}
      />
    )

    const table = screen.getByRole('table')
    const rows = screen.getAllByRole('row')
    const cells = screen.getAllByRole('gridcell')

    expect(table).toHaveAttribute('aria-label', 'Test cases table')
    expect(rows[1]).toHaveAttribute('aria-selected', 'true')
    expect(rows[2]).toHaveAttribute('aria-selected', 'false')
    expect(cells).toHaveLength(15) // 5 columns (4 data + 1 checkbox) × 3 rows
  })

  it('handles item deselection', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const checkboxes = screen.getAllByLabelText('Select item 1')
    expect(checkboxes[0]).toBeChecked()

    fireEvent.click(checkboxes[0])

    expect(mockOnSelectionChange).toHaveBeenCalledWith([])
  })

  it('does not render sort button for non-sortable columns', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        getItemId={getItemId}
      />
    )

    expect(screen.queryByLabelText(/Sort by Priority/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Sort by Count/i)).not.toBeInTheDocument()
  })

  it('renders sort icons correctly for active and inactive states', () => {
    const { rerender } = render(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        getItemId={getItemId}
      />
    )

    // Check unsorted state
    let nameButton = screen.getByLabelText(/Sort by Name/i)
    let svg = nameButton.querySelector('svg')
    expect(svg).toHaveClass('text-gray-400')

    // Check sorted asc state
    rerender(
      <Table
        data={mockData}
        columns={mockColumns}
        onSort={mockOnSort}
        sortBy="name"
        sortOrder="asc"
        getItemId={getItemId}
      />
    )

    nameButton = screen.getByLabelText(/Sort by Name/i)
    svg = nameButton.querySelector('svg')
    expect(svg).toHaveClass('text-blue-600')
  })

  it('maintains selection state across re-renders', () => {
    const { rerender } = render(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const checkboxes = screen.getAllByLabelText('Select item 1')
    expect(checkboxes[0]).toBeChecked()

    rerender(
      <Table
        data={mockData}
        columns={mockColumns}
        selectable={true}
        selectedItems={[mockData[0]]}
        onSelectionChange={mockOnSelectionChange}
        getItemId={getItemId}
      />
    )

    const checkboxesAfterRerender = screen.getAllByLabelText('Select item 1')
    expect(checkboxesAfterRerender[0]).toBeChecked()
  })

  it('handles index column correctly', () => {
    const columnsWithIndex: TableColumn<MockItem>[] = [
      { key: 'index', label: '#', width: '50px' },
      ...mockColumns,
    ]

    render(
      <Table
        data={mockData}
        columns={columnsWithIndex}
        getItemId={getItemId}
      />
    )

    expect(screen.getAllByText('1')).toHaveLength(2) // Desktop and mobile
    expect(screen.getAllByText('2')).toHaveLength(2)
    expect(screen.getAllByText('3')).toHaveLength(2)
  })

  it('applies column width styles when specified', () => {
    const columnsWithWidth: TableColumn<MockItem>[] = [
      { key: 'name', label: 'Name', width: '200px' },
      ...mockColumns.slice(1),
    ]

    render(
      <Table
        data={mockData}
        columns={columnsWithWidth}
        getItemId={getItemId}
      />
    )

    const nameHeader = screen.getByText('Name').closest('th')
    expect(nameHeader).toHaveStyle({ width: '200px' })
  })
})
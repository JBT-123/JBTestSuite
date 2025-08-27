import React, { useState } from 'react'
import Button from './Button'
import Modal from './Modal'

export interface BulkAction {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'danger' | 'warning'
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationMessage?: string
}

export interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  actions: BulkAction[]
  onAction: (actionId: string) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  loading?: boolean
  className?: string
}

function BulkActions({
  selectedCount,
  totalCount,
  actions,
  onAction,
  onSelectAll,
  onClearSelection,
  loading = false,
  className = '',
}: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)

  if (selectedCount === 0) {
    return null
  }

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action)
    } else {
      onAction(action.id)
    }
  }

  const handleConfirmAction = () => {
    if (confirmAction) {
      onAction(confirmAction.id)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div
        className={`flex flex-col gap-4 rounded-lg bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-blue-900">
            {selectedCount} of {totalCount} items selected
          </div>

          <div className="flex items-center gap-2">
            {onSelectAll && selectedCount < totalCount && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
              >
                Select all {totalCount}
              </button>
            )}

            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const variantClasses = {
              default: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
              danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700',
              warning: 'bg-yellow-600 border-yellow-600 text-white hover:bg-yellow-700',
            }

            return (
              <Button
                key={action.id}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={loading}
                className={variantClasses[action.variant || 'default']}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>

      {confirmAction && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.confirmationTitle || 'Confirm Action'}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {confirmAction.confirmationMessage ||
                `Are you sure you want to ${confirmAction.label.toLowerCase()} ${selectedCount} selected item${selectedCount === 1 ? '' : 's'}?`}
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                loading={loading}
                className={confirmAction.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default BulkActions

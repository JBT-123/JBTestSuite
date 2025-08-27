import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCreateTestCase } from '../hooks'
import { TEST_CASE_STATUS, TEST_CASE_PRIORITY } from '../api'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Alert,
  ResponsiveContainer,
  ResponsiveFormLayout,
  ResponsiveField,
} from '../components/ui'
import type { TestCaseCreate } from '../types'

export const Route = createFileRoute('/tests/new')({
  component: CreateTestCaseSimple,
})

const STATUS_OPTIONS = [
  { value: TEST_CASE_STATUS.DRAFT, label: 'Draft' },
  { value: TEST_CASE_STATUS.ACTIVE, label: 'Active' },
  { value: TEST_CASE_STATUS.ARCHIVED, label: 'Archived' },
  { value: TEST_CASE_STATUS.INACTIVE, label: 'Inactive' },
]

const PRIORITY_OPTIONS = [
  { value: TEST_CASE_PRIORITY.LOW, label: 'Low' },
  { value: TEST_CASE_PRIORITY.MEDIUM, label: 'Medium' },
  { value: TEST_CASE_PRIORITY.HIGH, label: 'High' },
  { value: TEST_CASE_PRIORITY.CRITICAL, label: 'Critical' },
]

const CATEGORY_OPTIONS = [
  { value: 'functional', label: 'Functional' },
  { value: 'regression', label: 'Regression' },
  { value: 'smoke', label: 'Smoke' },
  { value: 'integration', label: 'Integration' },
  { value: 'unit', label: 'Unit' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'usability', label: 'Usability' },
]

function CreateTestCaseSimple() {
  const navigate = useNavigate()
  const createTestCase = useCreateTestCase()

  const [formData, setFormData] = useState<TestCaseCreate>({
    name: '',
    description: '',
    status: TEST_CASE_STATUS.DRAFT,
    priority: TEST_CASE_PRIORITY.MEDIUM,
    tags: [],
    metadata: {},
    author: '',
    category: 'functional',
    expected_duration_seconds: 120,
    is_automated: true,
    retry_count: 3,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Test case name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.expected_duration_seconds && formData.expected_duration_seconds < 1) {
      newErrors.expected_duration_seconds = 'Duration must be at least 1 second'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateFormField = (field: keyof TestCaseCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateFormField('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFormField('tags', formData.tags?.filter((tag) => tag !== tagToRemove) || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const createdTestCase = await createTestCase.mutateAsync(formData)
      navigate({ to: `/tests/${createdTestCase.id}` })
    } catch (error) {
      console.error('Failed to create test case:', error)
    }
  }

  return (
    <ResponsiveContainer maxWidth="4xl" className="py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/tests" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              Test Cases
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-500 text-sm font-medium">Create Test Case</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Test Case</h1>
        <p className="mt-2 text-gray-600">Create a simple test case with basic information</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
        <ResponsiveFormLayout
          columns={2}
          gap="md"
          breakpoints={{ mobile: 1, tablet: 1, desktop: 2 }}
        >
          <ResponsiveField label="Test Case Name" error={errors.name} required fullWidth>
            <Input
              value={formData.name}
              onChange={(value) => updateFormField('name', value)}
              placeholder="Enter a descriptive name for your test case"
              error={!!errors.name}
            />
          </ResponsiveField>

          <ResponsiveField label="Description" fullWidth>
            <Textarea
              value={formData.description || ''}
              onChange={(value) => updateFormField('description', value)}
              placeholder="Describe what this test case validates"
              rows={3}
            />
          </ResponsiveField>

          <ResponsiveField label="Category" error={errors.category} required>
            <Select
              value={formData.category || ''}
              onChange={(e) => updateFormField('category', e.target.value)}
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
            />
          </ResponsiveField>

          <ResponsiveField label="Author">
            <Input
              value={formData.author || ''}
              onChange={(value) => updateFormField('author', value)}
              placeholder="Test case author"
            />
          </ResponsiveField>

          <ResponsiveField label="Status">
            <Select
              value={formData.status || TEST_CASE_STATUS.DRAFT}
              onChange={(e) => updateFormField('status', e.target.value)}
              options={STATUS_OPTIONS}
            />
          </ResponsiveField>

          <ResponsiveField label="Priority">
            <Select
              value={formData.priority || TEST_CASE_PRIORITY.MEDIUM}
              onChange={(e) => updateFormField('priority', e.target.value)}
              options={PRIORITY_OPTIONS}
            />
          </ResponsiveField>

          <ResponsiveField
            label="Expected Duration (seconds)"
            error={errors.expected_duration_seconds}
          >
            <Input
              type="number"
              value={formData.expected_duration_seconds?.toString() || '120'}
              onChange={(value) =>
                updateFormField('expected_duration_seconds', parseInt(value) || 120)
              }
              min="1"
            />
          </ResponsiveField>

          <ResponsiveField label="Retry Count">
            <Input
              type="number"
              value={formData.retry_count.toString()}
              onChange={(value) => updateFormField('retry_count', parseInt(value) || 3)}
              min="0"
              max="10"
            />
          </ResponsiveField>

          <ResponsiveField fullWidth>
            <Checkbox
              label="Automated Test"
              checked={formData.is_automated}
              onChange={(checked) => updateFormField('is_automated', checked)}
            />
          </ResponsiveField>

          {/* Tags Input */}
          <ResponsiveField label="Tags" fullWidth>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(value) => setTagInput(value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </ResponsiveField>
        </ResponsiveFormLayout>

        {/* Form Actions */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
          <Link to="/tests">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={createTestCase.isPending}
            disabled={createTestCase.isPending}
          >
            Create Test Case
          </Button>
        </div>
      </form>

      {/* Error Alert */}
      {createTestCase.error && (
        <Alert
          type="error"
          title="Error creating test case"
          message={String((createTestCase.error as any)?.message ?? createTestCase.error)}
          className="mt-4"
        />
      )}
    </ResponsiveContainer>
  )
}

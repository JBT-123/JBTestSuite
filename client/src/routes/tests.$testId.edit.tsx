import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  useTestCase,
  useUpdateTestCase,
  useCreateTestStep,
  useUpdateTestStep,
  useDeleteTestStep,
} from '../hooks'
import { TEST_CASE_STATUS, TEST_CASE_PRIORITY } from '../api'
import { Button, Input, Textarea, Select, Checkbox, Alert, Loading, Modal } from '../components/ui'
import type { TestCaseUpdate, TestStepFormData, TestStepResponse } from '../types'
import { StepType } from '../types'

export const Route = createFileRoute('/tests/$testId/edit')({
  component: EditTestCase,
})

const STATUS_OPTIONS = [
  { value: TEST_CASE_STATUS.DRAFT, label: 'Draft' },
  { value: TEST_CASE_STATUS.ACTIVE, label: 'Active' },
  { value: TEST_CASE_STATUS.ARCHIVED, label: 'Archived' },
  { value: TEST_CASE_STATUS.DISABLED, label: 'Disabled' },
]

const PRIORITY_OPTIONS = [
  { value: TEST_CASE_PRIORITY.LOW, label: 'Low' },
  { value: TEST_CASE_PRIORITY.MEDIUM, label: 'Medium' },
  { value: TEST_CASE_PRIORITY.HIGH, label: 'High' },
  { value: TEST_CASE_PRIORITY.CRITICAL, label: 'Critical' },
]

const STEP_TYPE_OPTIONS = [
  { value: StepType.NAVIGATE, label: 'Navigate' },
  { value: StepType.CLICK, label: 'Click' },
  { value: StepType.TYPE, label: 'Type' },
  { value: StepType.WAIT, label: 'Wait' },
  { value: StepType.ASSERT, label: 'Assert' },
  { value: StepType.SCREENSHOT, label: 'Screenshot' },
  { value: StepType.CUSTOM, label: 'Custom' },
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

// --- helpers to accept event-style or value-style onChange ---
const getVal = (v: any) => (v && v.target ? v.target.value : v)
const getChecked = (v: any) =>
  typeof v === 'boolean' ? v : !!(v && v.target && v.target.checked)
const getNum = (v: any, fallback: number) => {
  const n = parseInt(String(getVal(v) ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

interface StepWithState extends TestStepFormData {
  id?: string
  temp_id: string
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
  originalData?: TestStepResponse
}

function EditTestCase() {
  const { testId } = Route.useParams()
  const navigate = useNavigate()

  const { data: testCase, isLoading, error } = useTestCase(testId, true)
  const updateTestCase = useUpdateTestCase()
  const createStep = useCreateTestStep()
  const updateStep = useUpdateTestStep()
  const deleteStep = useDeleteTestStep()

  const [formData, setFormData] = useState<TestCaseUpdate>({})
  const [steps, setSteps] = useState<StepWithState[]>([])
  const [originalData, setOriginalData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form with test case data
  useEffect(() => {
    if (testCase) {
      const initialFormData: TestCaseUpdate = {
        name: testCase.name,
        description: testCase.description,
        status: testCase.status,
        priority: testCase.priority,
        tags: testCase.tags || [],
        metadata: testCase.metadata || {},
        author: testCase.author,
        category: testCase.category,
        expected_duration_seconds: testCase.expected_duration_seconds,
        is_automated: testCase.is_automated,
        retry_count: testCase.retry_count,
      }

      setFormData(initialFormData)
      setOriginalData({ ...initialFormData })

      if (testCase.steps) {
        const initialSteps: StepWithState[] = testCase.steps
          .sort((a, b) => a.order_index - b.order_index)
          .map((step) => ({
            id: step.id,
            temp_id: step.id,
            name: step.name,
            description: step.description || '',
            step_type: step.step_type,
            selector: step.selector || '',
            input_data: step.input_data || '',
            expected_result: step.expected_result || '',
            configuration: step.configuration || {},
            timeout_seconds: step.timeout_seconds || 30,
            is_optional: step.is_optional,
            continue_on_failure: step.continue_on_failure,
            originalData: step,
          }))
        setSteps(initialSteps)
      }
    }
  }, [testCase])

  // Track changes
  useEffect(() => {
    if (!originalData) return

    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalData)
    const stepsChanged = steps.some(
      (step) =>
        step.isNew ||
        step.isModified ||
        step.isDeleted ||
        !step.originalData ||
        JSON.stringify({
          name: step.name,
          description: step.description,
          step_type: step.step_type,
          selector: step.selector,
          input_data: step.input_data,
          expected_result: step.expected_result,
          timeout_seconds: step.timeout_seconds,
          is_optional: step.is_optional,
          continue_on_failure: step.continue_on_failure,
        }) !==
          JSON.stringify({
            name: step.originalData.name,
            description: step.originalData.description || '',
            step_type: step.originalData.step_type,
            selector: step.originalData.selector || '',
            input_data: step.originalData.input_data || '',
            expected_result: step.originalData.expected_result || '',
            timeout_seconds: step.originalData.timeout_seconds || 30,
            is_optional: step.originalData.is_optional,
            continue_on_failure: step.originalData.continue_on_failure,
          })
    )

    setHasChanges(formChanged || stepsChanged)
  }, [formData, steps, originalData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Test case name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.expected_duration_seconds && formData.expected_duration_seconds < 1) {
      newErrors.expected_duration_seconds = 'Duration must be at least 1 second'
    }

    // Validate steps
    const visibleSteps = steps.filter((step) => !step.isDeleted)
    if (visibleSteps.length === 0) {
      newErrors.steps = 'At least one test step is required'
    }

    visibleSteps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors[`step-${index}-name`] = 'Step name is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateFormField = (field: keyof TestCaseUpdate, value: any) => {
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

  const addStep = () => {
    const newStep: StepWithState = {
      temp_id: `new-step-${Date.now()}`,
      name: '',
      description: '',
      step_type: StepType.NAVIGATE,
      selector: '',
      input_data: '',
      expected_result: '',
      configuration: {},
      timeout_seconds: 30,
      is_optional: false,
      continue_on_failure: false,
      isNew: true,
    }
    setSteps((prev) => [...prev, newStep])
  }

  const updateStepField = (stepIndex: number, field: keyof TestStepFormData, value: any) => {
    setSteps((prev) =>
      prev.map((step, index) => {
        if (index === stepIndex) {
          const updatedStep = { ...step, [field]: value }
          if (!step.isNew && step.originalData) {
            updatedStep.isModified = true
          }
          return updatedStep
        }
        return step
      })
    )

    const errorKey = `step-${stepIndex}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }))
    }
  }

  const removeStep = (stepIndex: number) => {
    const step = steps[stepIndex]

    if (step.isNew) {
      setSteps((prev) => prev.filter((_, index) => index !== stepIndex))
    } else {
      setSteps((prev) =>
        prev.map((s, index) => (index === stepIndex ? { ...s, isDeleted: true } : s))
      )
    }
  }

  const moveStep = (stepIndex: number, direction: 'up' | 'down') => {
    const visibleSteps = steps.filter((step) => !step.isDeleted)
    const visibleIndex = visibleSteps.findIndex((s) => s.temp_id === steps[stepIndex].temp_id)

    if (
      (direction === 'up' && visibleIndex === 0) ||
      (direction === 'down' && visibleIndex === visibleSteps.length - 1)
    ) {
      return
    }

    const newSteps = [...steps]
    const currentStepIndex = stepIndex
    const targetVisibleIndex = direction === 'up' ? visibleIndex - 1 : visibleIndex + 1
    const targetStep = visibleSteps[targetVisibleIndex]
    const targetStepIndex = steps.findIndex((s) => s.temp_id === targetStep.temp_id)

    const temp = newSteps[currentStepIndex]
    newSteps[currentStepIndex] = newSteps[targetStepIndex]
    newSteps[targetStepIndex] = temp

    setSteps(newSteps)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setNetworkError(null)
    try {
      await updateTestCase.mutateAsync({
        testId,
        data: formData,
      })

      const visibleSteps = steps.filter((step) => !step.isDeleted)

      const deletedSteps = steps.filter((step) => step.isDeleted && step.id)
      for (const step of deletedSteps) {
        await deleteStep.mutateAsync({ testId, stepId: step.id! })
      }

      for (let i = 0; i < visibleSteps.length; i++) {
        const step = visibleSteps[i]
        const stepData = {
          order_index: i + 1,
          name: step.name,
          description: step.description,
          step_type: step.step_type,
          selector: step.selector,
          input_data: step.input_data,
          expected_result: step.expected_result,
          configuration: step.configuration,
          timeout_seconds: step.timeout_seconds,
          is_optional: step.is_optional,
          continue_on_failure: step.continue_on_failure,
        }

        if (step.isNew) {
          await createStep.mutateAsync({ testId, stepData })
        } else if (step.isModified || step.id) {
          await updateStep.mutateAsync({
            testId,
            stepId: step.id!,
            stepData,
          })
        }
      }

      navigate({ to: `/tests/${testId}` })
    } catch (error: any) {
      console.error('Failed to update test case:', {
        error,
        message: error?.message,
        details: error?.details,
        testId,
        timestamp: new Date().toISOString()
      })
      
      // Show user-friendly error message for network issues
      if (error?.details?.code === 'ERR_NETWORK' || error?.message?.includes('Connection failed')) {
        setNetworkError('Network error: Unable to save changes. Please check your connection and try again.')
      } else {
        setNetworkError(`Error: ${error?.message || 'Unable to save changes. Please try again.'}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      setShowExitModal(true)
    } else {
      navigate({ to: `/tests/${testId}` })
    }
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Loading size="lg" text="Loading test case..." />
        </div>
      </div>
    )
  }

  if (error || !testCase) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Alert
            type="error"
            title="Error Loading Test Case"
            message={error ? `${String((error as any)?.message ?? error)}` : 'Test case not found'}
          />
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate({ to: '/tests' })}>
              ← Back to Tests
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const visibleSteps = steps.filter((step) => !step.isDeleted)

  return (
    <div className="py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
                <Link
                  to="/tests/$testId"
                  params={{ testId }}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium truncate max-w-xs"
                >
                  {testCase.name}
                </Link>
              </div>
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
                <span className="text-gray-500 text-sm font-medium">Edit</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Edit Test Case</h1>
            {hasChanges && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-gray-600">Make changes to your test case and its steps</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Input
                    label="Test Case Name"
                    value={formData.name || ''}
                    onChange={(v) => updateFormField('name', getVal(v))}
                    error={errors.name}
                    placeholder="Enter a descriptive name for your test case"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <Textarea
                    label="Description"
                    value={formData.description || ''}
                    onChange={(v) => updateFormField('description', getVal(v))}
                    placeholder="Describe what this test case validates"
                    rows={3}
                  />
                </div>

                <div>
                  <Select
                    label="Category"
                    value={formData.category || ''}
                    onChange={(v) => updateFormField('category', getVal(v))}
                    options={CATEGORY_OPTIONS}
                    error={errors.category}
                    placeholder="Select category"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Author"
                    value={formData.author || ''}
                    onChange={(v) => updateFormField('author', getVal(v))}
                    placeholder="Test case author"
                  />
                </div>

                <div>
                  <Select
                    label="Status"
                    value={formData.status || TEST_CASE_STATUS.DRAFT}
                    onChange={(v) => updateFormField('status', getVal(v))}
                    options={STATUS_OPTIONS}
                  />
                </div>

                <div>
                  <Select
                    label="Priority"
                    value={formData.priority || TEST_CASE_PRIORITY.MEDIUM}
                    onChange={(v) => updateFormField('priority', getVal(v))}
                    options={PRIORITY_OPTIONS}
                  />
                </div>

                <div>
                  <Input
                    label="Expected Duration (seconds)"
                    type="number"
                    value={formData.expected_duration_seconds?.toString() || '120'}
                    onChange={(v) =>
                      updateFormField('expected_duration_seconds', getNum(v, 120))
                    }
                    error={errors.expected_duration_seconds}
                    min="1"
                  />
                </div>

                <div>
                  <Input
                    label="Retry Count"
                    type="number"
                    value={formData.retry_count?.toString() || '3'}
                    onChange={(v) => updateFormField('retry_count', getNum(v, 3))}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Checkbox
                    label="Automated Test"
                    checked={formData.is_automated || false}
                    onChange={(checked) => updateFormField('is_automated', getChecked(checked))}
                  />
                </div>

                {/* Tags Input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(v) => setTagInput(getVal(v))}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
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
                </div>
              </div>
            </div>

            {/* Test Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Test Steps ({visibleSteps.length})
                </h2>
                <Button onClick={addStep}>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Step
                </Button>
              </div>

              {errors.steps && (
                <Alert
                  type="error"
                  title="Steps Required"
                  message={errors.steps}
                  className="mb-6"
                />
              )}

              <div className="space-y-6">
                {visibleSteps.map((step, index) => {
                  const stepIndex = steps.findIndex((s) => s.temp_id === step.temp_id)
                  return (
                    <div
                      key={step.temp_id}
                      className={`border rounded-lg p-6 ${
                        step.isNew
                          ? 'border-green-200 bg-green-50'
                          : step.isModified
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">Step {index + 1}</h3>
                          {step.isNew && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                          {step.isModified && !step.isNew && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Modified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveStep(stepIndex, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveStep(stepIndex, 'down')}
                            disabled={index === visibleSteps.length - 1}
                          >
                            ↓
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => removeStep(stepIndex)}>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                          <Input
                            label="Step Name"
                            value={step.name}
                            onChange={(v) => updateStepField(stepIndex, 'name', getVal(v))}
                            error={errors[`step-${index}-name`]}
                            placeholder="Describe this step"
                            required
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <Textarea
                            label="Description"
                            value={step.description}
                            onChange={(v) =>
                              updateStepField(stepIndex, 'description', getVal(v))
                            }
                            placeholder="Additional details about this step"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Select
                            label="Step Type"
                            value={step.step_type}
                            onChange={(v) => updateStepField(stepIndex, 'step_type', getVal(v))}
                            options={STEP_TYPE_OPTIONS}
                          />
                        </div>

                        <div>
                          <Input
                            label="Timeout (seconds)"
                            type="number"
                            value={step.timeout_seconds?.toString() || '30'}
                            onChange={(v) =>
                              updateStepField(stepIndex, 'timeout_seconds', getNum(v, 30))
                            }
                            min="1"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <Input
                            label="Selector"
                            value={step.selector}
                            onChange={(v) => updateStepField(stepIndex, 'selector', getVal(v))}
                            placeholder="CSS selector, XPath, or element identifier"
                          />
                        </div>

                        <div>
                          <Input
                            label="Input Data"
                            value={step.input_data}
                            onChange={(v) => updateStepField(stepIndex, 'input_data', getVal(v))}
                            placeholder="Data to input or send"
                          />
                        </div>

                        <div>
                          <Input
                            label="Expected Result"
                            value={step.expected_result}
                            onChange={(v) =>
                              updateStepField(stepIndex, 'expected_result', getVal(v))
                            }
                            placeholder="What should happen after this step"
                          />
                        </div>

                        <div>
                          <Checkbox
                            label="Optional Step"
                            checked={step.is_optional}
                            onChange={(v) =>
                              updateStepField(stepIndex, 'is_optional', getChecked(v))
                            }
                          />
                        </div>

                        <div>
                          <Checkbox
                            label="Continue on Failure"
                            checked={step.continue_on_failure}
                            onChange={(v) =>
                              updateStepField(stepIndex, 'continue_on_failure', getChecked(v))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {visibleSteps.length === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No steps</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This test case needs at least one step
                    </p>
                    <div className="mt-6">
                      <Button onClick={addStep}>
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add First Step
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Network Error Display */}
            {networkError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-red-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-700">{networkError}</p>
                  <button 
                    onClick={() => setNetworkError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={isSaving} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Exit Confirmation Modal */}
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Unsaved Changes"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowExitModal(false)}>
                Continue Editing
              </Button>
              <Button variant="danger" onClick={() => navigate({ to: `/tests/${testId}` })}>
                Discard Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Error Alerts */}
        {(updateTestCase.error || createStep.error || updateStep.error || deleteStep.error) && (
          <Alert
            type="error"
            title="Error saving changes"
            message={String(
              (updateTestCase.error as any)?.message ??
                (createStep.error as any)?.message ??
                (updateStep.error as any)?.message ??
                (deleteStep.error as any)?.message ??
                'An error occurred while saving'
            )}
            className="mt-4"
          />
        )}
      </div>
    </div>
  )
}

export default EditTestCase

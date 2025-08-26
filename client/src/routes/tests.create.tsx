import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useCreateTestCase, useTestCase } from '../hooks'
import { TEST_CASE_STATUS, TEST_CASE_PRIORITY } from '../api'
import { 
  Button, 
  Input,
  Textarea,
  Select,
  Checkbox,
  Alert,
  Loading,
  Modal
} from '../components/ui'
import { StatusBadge, PriorityBadge } from '../components/test-cases'
import type { TestCaseCreate, TestStepFormData } from '../types'

interface CreateTestSearch {
  clone?: string
  name?: string
}

export const Route = createFileRoute('/tests/create')({
  validateSearch: (search: Record<string, unknown>): CreateTestSearch => ({
    clone: search.clone as string,
    name: search.name as string,
  }),
  component: CreateTestCase,
})

const DEFAULT_TEST_CASE: TestCaseCreate = {
  name: '',
  description: '',
  status: TEST_CASE_STATUS.DRAFT,
  priority: TEST_CASE_PRIORITY.MEDIUM,
  tags: [],
  metadata: {},
  author: '',
  category: '',
  expected_duration_seconds: 120,
  is_automated: true,
  retry_count: 3,
}

const DEFAULT_STEP: Omit<TestStepFormData, 'temp_id'> = {
  name: '',
  description: '',
  step_type: 'action',
  selector: '',
  input_data: '',
  expected_result: '',
  configuration: {},
  timeout_seconds: 30,
  is_optional: false,
  continue_on_failure: false,
}

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
  { value: 'action', label: 'Action' },
  { value: 'assertion', label: 'Assertion' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'wait', label: 'Wait' },
  { value: 'input', label: 'Input' },
  { value: 'verification', label: 'Verification' },
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

function CreateTestCase() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/tests/create' })
  
  // Load test case for cloning if specified
  const { data: cloneSource, isLoading: loadingClone } = useTestCase(
    search.clone || '', 
    true
  )
  
  const createTestCase = useCreateTestCase()
  
  const [formData, setFormData] = useState<TestCaseCreate>(DEFAULT_TEST_CASE)
  const [steps, setSteps] = useState<TestStepFormData[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [showExitModal, setShowExitModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Track if form has changes for navigation warning
  useEffect(() => {
    const hasFormChanges = formData.name !== '' || formData.description !== '' || steps.length > 0
    setHasChanges(hasFormChanges)
  }, [formData, steps])

  // Initialize form with clone data
  useEffect(() => {
    if (cloneSource && search.clone) {
      setFormData({
        name: search.name || `Copy of ${cloneSource.name}`,
        description: cloneSource.description || '',
        status: TEST_CASE_STATUS.DRAFT, // Always start clones as draft
        priority: cloneSource.priority || TEST_CASE_PRIORITY.MEDIUM,
        tags: cloneSource.tags || [],
        metadata: cloneSource.metadata || {},
        author: cloneSource.author || '',
        category: cloneSource.category || '',
        expected_duration_seconds: cloneSource.expected_duration_seconds || 120,
        is_automated: cloneSource.is_automated,
        retry_count: cloneSource.retry_count,
      })

      if (cloneSource.steps) {
        const clonedSteps: TestStepFormData[] = cloneSource.steps.map((step, index) => ({
          temp_id: `cloned-${index}`,
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
        }))
        setSteps(clonedSteps)
        setCurrentStep(2) // Go to steps tab since we have cloned steps
      }
    }
  }, [cloneSource, search.clone, search.name])

  const validateBasicInfo = (): boolean => {
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

  const validateSteps = (): boolean => {
    if (steps.length === 0) {
      setErrors({ steps: 'At least one test step is required' })
      return false
    }

    const stepErrors: Record<string, string> = {}
    steps.forEach((step, index) => {
      if (!step.name.trim()) {
        stepErrors[`step-${index}-name`] = 'Step name is required'
      }
    })

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const updateFormField = (field: keyof TestCaseCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateFormField('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFormField('tags', formData.tags?.filter(tag => tag !== tagToRemove) || [])
  }

  const addStep = () => {
    const newStep: TestStepFormData = {
      ...DEFAULT_STEP,
      temp_id: `step-${Date.now()}`,
    }
    setSteps(prev => [...prev, newStep])
  }

  const updateStep = (index: number, field: keyof TestStepFormData, value: any) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
    
    const errorKey = `step-${index}-${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }))
    }
  }

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) {
      return
    }

    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    const temp = newSteps[index]
    newSteps[index] = newSteps[targetIndex]
    newSteps[targetIndex] = temp
    setSteps(newSteps)
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    setErrors({})

    if (!validateBasicInfo()) {
      setCurrentStep(1)
      return
    }

    if (!validateSteps()) {
      setCurrentStep(2)
      return
    }

    const testCaseData: TestCaseCreate = {
      ...formData,
      status: isDraft ? TEST_CASE_STATUS.DRAFT : formData.status,
    }

    try {
      const createdTestCase = await createTestCase.mutateAsync(testCaseData)
      
      // Create steps sequentially to maintain order
      if (steps.length > 0) {
        const { createTestStep } = await import('../api/testCases')
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
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
          
          await createTestStep(createdTestCase.id, stepData)
        }
      }
      
      navigate({ to: `/tests/${createdTestCase.id}` })
    } catch (error) {
      console.error('Failed to create test case:', error)
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      setShowExitModal(true)
    } else {
      navigate({ to: '/tests' })
    }
  }

  if (loadingClone) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Loading size="lg" text="Loading test case to clone..." />
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/tests" 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Test Cases
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-500 text-sm font-medium">
                  Create Test Case
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {search.clone ? 'Clone Test Case' : 'Create New Test Case'}
          </h1>
          <p className="mt-2 text-gray-600">
            Build comprehensive test cases with detailed steps and configuration
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {/* Step 1 */}
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                }`}>
                  1
                </span>
                <span className="ml-2 font-medium">Basic Info</span>
              </div>

              {/* Divider */}
              <div className={`w-16 h-0.5 mx-4 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />

              {/* Step 2 */}
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                }`}>
                  2
                </span>
                <span className="ml-2 font-medium">Test Steps</span>
              </div>

              {/* Divider */}
              <div className={`w-16 h-0.5 mx-4 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />

              {/* Step 3 */}
              <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                }`}>
                  3
                </span>
                <span className="ml-2 font-medium">Review</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Input
                    label="Test Case Name"
                    value={formData.name}
                    onChange={(value) => updateFormField('name', value)}
                    error={errors.name}
                    placeholder="Enter a descriptive name for your test case"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <Textarea
                    label="Description"
                    value={formData.description || ''}
                    onChange={(value) => updateFormField('description', value)}
                    placeholder="Describe what this test case validates"
                    rows={3}
                  />
                </div>

                <div>
                  <Select
                    label="Category"
                    value={formData.category || ''}
                    onChange={(value) => updateFormField('category', value)}
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
                    onChange={(value) => updateFormField('author', value)}
                    placeholder="Test case author"
                  />
                </div>

                <div>
                  <Select
                    label="Status"
                    value={formData.status || TEST_CASE_STATUS.DRAFT}
                    onChange={(value) => updateFormField('status', value)}
                    options={STATUS_OPTIONS}
                  />
                </div>

                <div>
                  <Select
                    label="Priority"
                    value={formData.priority || TEST_CASE_PRIORITY.MEDIUM}
                    onChange={(value) => updateFormField('priority', value)}
                    options={PRIORITY_OPTIONS}
                  />
                </div>

                <div>
                  <Input
                    label="Expected Duration (seconds)"
                    type="number"
                    value={formData.expected_duration_seconds?.toString() || '120'}
                    onChange={(e) => updateFormField('expected_duration_seconds', parseInt(e.target.value) || 120)}
                    error={errors.expected_duration_seconds}
                    min="1"
                  />
                </div>

                <div>
                  <Input
                    label="Retry Count"
                    type="number"
                    value={formData.retry_count.toString()}
                    onChange={(e) => updateFormField('retry_count', parseInt(e.target.value) || 3)}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Checkbox
                    label="Automated Test"
                    checked={formData.is_automated}
                    onChange={(checked) => updateFormField('is_automated', checked)}
                  />
                </div>

                {/* Tags Input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button
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
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  ← Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (validateBasicInfo()) {
                      setCurrentStep(2)
                    }
                  }}
                >
                  Next: Add Steps →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Test Steps */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Test Steps</h2>
                <Button onClick={addStep}>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                {steps.map((step, index) => (
                  <div key={step.temp_id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Step {index + 1}</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Input
                          label="Step Name"
                          value={step.name}
                          onChange={(value) => updateStep(index, 'name', value)}
                          error={errors[`step-${index}-name`]}
                          placeholder="Describe this step"
                          required
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <Textarea
                          label="Description"
                          value={step.description}
                          onChange={(value) => updateStep(index, 'description', value)}
                          placeholder="Additional details about this step"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Select
                          label="Step Type"
                          value={step.step_type}
                          onChange={(value) => updateStep(index, 'step_type', value)}
                          options={STEP_TYPE_OPTIONS}
                        />
                      </div>

                      <div>
                        <Input
                          label="Timeout (seconds)"
                          type="number"
                          value={step.timeout_seconds?.toString() || '30'}
                          onChange={(e) => updateStep(index, 'timeout_seconds', parseInt(e.target.value) || 30)}
                          min="1"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <Input
                          label="Selector"
                          value={step.selector}
                          onChange={(value) => updateStep(index, 'selector', value)}
                          placeholder="CSS selector, XPath, or element identifier"
                        />
                      </div>

                      <div>
                        <Input
                          label="Input Data"
                          value={step.input_data}
                          onChange={(value) => updateStep(index, 'input_data', value)}
                          placeholder="Data to input or send"
                        />
                      </div>

                      <div>
                        <Input
                          label="Expected Result"
                          value={step.expected_result}
                          onChange={(value) => updateStep(index, 'expected_result', value)}
                          placeholder="What should happen after this step"
                        />
                      </div>

                      <div>
                        <Checkbox
                          label="Optional Step"
                          checked={step.is_optional}
                          onChange={(checked) => updateStep(index, 'is_optional', checked)}
                        />
                      </div>

                      <div>
                        <Checkbox
                          label="Continue on Failure"
                          checked={step.continue_on_failure}
                          onChange={(checked) => updateStep(index, 'continue_on_failure', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No steps yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first test step</p>
                    <div className="mt-6">
                      <Button onClick={addStep}>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add First Step
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => {
                    if (validateSteps()) {
                      setCurrentStep(3)
                    }
                  }}
                >
                  Next: Review →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Test Case</h2>

              <div className="space-y-8">
                {/* Basic Info Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <div className="text-sm text-gray-900">{formData.name}</div>
                    </div>
                    
                    {formData.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <div className="text-sm text-gray-900">{formData.description}</div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <StatusBadge status={formData.status || 'draft'} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      <div className="mt-1">
                        <PriorityBadge priority={formData.priority || 'medium'} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <div className="text-sm text-gray-900 capitalize">{formData.category}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Automated</label>
                      <div className="text-sm text-gray-900">{formData.is_automated ? 'Yes' : 'No'}</div>
                    </div>

                    {formData.tags && formData.tags.length > 0 && (
                      <div className="lg:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Test Steps ({steps.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.temp_id} className="bg-white rounded p-4">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{step.name}</div>
                            {step.description && (
                              <div className="text-sm text-gray-600">{step.description}</div>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              <span className="capitalize">{step.step_type}</span>
                              {step.selector && <span>Selector: {step.selector}</span>}
                              {step.expected_result && <span>Expected: {step.expected_result}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    loading={createTestCase.isPending}
                    disabled={createTestCase.isPending}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    loading={createTestCase.isPending}
                    disabled={createTestCase.isPending}
                  >
                    Create Test Case
                  </Button>
                </div>
              </div>
            </div>
          )}
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
              <Button
                variant="outline"
                onClick={() => setShowExitModal(false)}
              >
                Continue Editing
              </Button>
              <Button
                variant="danger"
                onClick={() => navigate({ to: '/tests' })}
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Error Alert */}
        {createTestCase.error && (
          <Alert
            type="error"
            title="Error creating test case"
            message={String((createTestCase.error as any)?.message ?? createTestCase.error)}
            className="mt-4"
          />
        )}
      </div>
    </div>
  )
}
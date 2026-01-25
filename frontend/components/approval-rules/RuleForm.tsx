'use client';

import { useState, useEffect } from 'react';
import {
  ApprovalRule,
  RuleType,
  RuleCondition,
  RuleApprover,
  RuleFormData,
} from '@/lib/types/approvalRules';
import { ConditionBuilder } from './ConditionBuilder';
import { ApproverSelector } from './ApproverSelector';

interface RuleFormProps {
  initialData?: ApprovalRule;
  onSubmit: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Stage {
  id: number;
  name: string;
  sequenceOrder: number;
  approvalRequired: boolean;
}

export function RuleForm({ initialData, onSubmit, onCancel, isLoading = false }: RuleFormProps) {
  const [formData, setFormData] = useState<RuleFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    ruleType: initialData?.ruleType || RuleType.CONDITION_RULE,
    priority: initialData?.priority || 1,
    isActive: initialData?.isActive ?? true,
    stageIds: initialData?.stageIds || [],
    conditions: initialData?.conditions || [],
    approvers: initialData?.approvers || [],
  });

  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load stages
  useEffect(() => {
    const loadStages = async () => {
      try {
        setLoadingStages(true);
        const response = await fetch('/api/stages', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success && data.data?.stages) {
          const approvalStages = data.data.stages.filter((stage: Stage) => stage.approvalRequired);
          setStages(approvalStages.sort((a: Stage, b: Stage) => a.sequenceOrder - b.sequenceOrder));
        }
      } catch (error) {
        console.error('Failed to load stages:', error);
      } finally {
        setLoadingStages(false);
      }
    };

    loadStages();
  }, []);

  const handleInputChange = (field: keyof RuleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStageToggle = (stageId: number) => {
    setFormData((prev) => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter((id) => id !== stageId)
        : [...prev.stageIds, stageId],
    }));
  };

  const handleConditionsChange = (conditions: RuleCondition[]) => {
    handleInputChange('conditions', conditions);
  };

  const handleApproversChange = (approvers: RuleApprover[]) => {
    handleInputChange('approvers', approvers);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (formData.priority < 1 || formData.priority > 100) {
      newErrors.priority = 'Priority must be between 1 and 100';
    }

    if (formData.stageIds.length === 0) {
      newErrors.stageIds = 'At least one stage must be selected';
    }

    if (formData.ruleType === RuleType.CONDITION_RULE && formData.conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required for condition-based rules';
    }

    if (formData.approvers.length === 0) {
      newErrors.approvers = 'At least one approver must be assigned';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure the basic details for this approval rule
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Rule Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Rule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              placeholder="e.g., High Value Product Changes"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Describe when this rule should be applied..."
            />
          </div>

          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rule Type <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-start">
                <input
                  type="radio"
                  value={RuleType.STAGE_RULE}
                  checked={formData.ruleType === RuleType.STAGE_RULE}
                  onChange={(e) => handleInputChange('ruleType', e.target.value)}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2">
                  <span className="block text-sm font-medium text-gray-700">Stage-Based</span>
                  <span className="block text-sm text-gray-500">
                    Apply to all ECOs in selected stages (no conditions)
                  </span>
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="radio"
                  value={RuleType.CONDITION_RULE}
                  checked={formData.ruleType === RuleType.CONDITION_RULE}
                  onChange={(e) => handleInputChange('ruleType', e.target.value)}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2">
                  <span className="block text-sm font-medium text-gray-700">Condition-Based</span>
                  <span className="block text-sm text-gray-500">
                    Apply when ECO meets specific conditions (e.g., product price {'>'} 1000)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Priority and Active Toggle */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.priority
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Lower number = higher priority (1-100)</p>
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
            </div>

            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-2 flex items-center">
                <button
                  type="button"
                  onClick={() => handleInputChange('isActive', !formData.isActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    formData.isActive ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Inactive rules will not be applied to ECOs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applicable Stages */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Applicable Stages</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select which approval-required ECO stages this rule applies to
          </p>
        </div>

        <div className="px-6 py-6">
          {loadingStages ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-500">Loading stages...</span>
            </div>
          ) : stages.length === 0 ? (
            <p className="text-sm text-gray-500">No stages available</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stages.map((stage) => (
                <label
                  key={stage.id}
                  className={`flex cursor-pointer items-center rounded-md border-2 px-4 py-3 transition-colors ${
                    formData.stageIds.includes(stage.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.stageIds.includes(stage.id)}
                    onChange={() => handleStageToggle(stage.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-3 flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {stage.sequenceOrder}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.stageIds && <p className="mt-2 text-sm text-red-600">{errors.stageIds}</p>}
        </div>
      </div>

      {/* Conditions (only for CONDITION_RULE) */}
      {formData.ruleType === RuleType.CONDITION_RULE && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Rule Conditions</h2>
            <p className="mt-1 text-sm text-gray-500">
              Define when this rule should be triggered based on ECO properties
            </p>
          </div>

          <div className="px-6 py-6">
            <ConditionBuilder
              conditions={formData.conditions}
              onChange={handleConditionsChange}
            />
            {errors.conditions && <p className="mt-2 text-sm text-red-600">{errors.conditions}</p>}
          </div>
        </div>
      )}

      {/* Approvers */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Approvers</h2>
          <p className="mt-1 text-sm text-gray-500">
            Assign users who will be required to approve ECOs matching this rule
          </p>
        </div>

        <div className="px-6 py-6">
          <ApproverSelector
            approvers={formData.approvers}
            onChange={handleApproversChange}
          />
          {errors.approvers && <p className="mt-2 text-sm text-red-600">{errors.approvers}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          )}
          {initialData ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}

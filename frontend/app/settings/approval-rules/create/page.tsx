'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RuleForm } from '@/components/approval-rules/RuleForm';
import { RuleFormData } from '@/lib/types/approvalRules';
import { approvalRulesClient } from '@/lib/api/approvalRulesClient';
import { ApiError } from '@/lib/api';

export default function CreateRulePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: RuleFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const rule = await approvalRulesClient.createRule({
        name: formData.name,
        description: formData.description,
        ruleType: formData.ruleType,
        priority: formData.priority,
        isActive: formData.isActive,
        stageIds: formData.stageIds,
        conditions: formData.conditions,
        approvers: formData.approvers,
      });

      // Redirect to the new rule's detail page
      if (rule?.id) {
        router.push(`/settings/approval-rules/${rule.id}`);
      } else {
        router.push('/settings/approval-rules');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create approval rule';
      setError(message);
      console.error('Create rule error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/settings/approval-rules');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Approval Rules
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Approval Rule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define a new rule to automatically assign approvers to ECOs based on stages or conditions
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating rule</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <RuleForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
    </div>
  );
}

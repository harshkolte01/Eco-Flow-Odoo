'use client';

import Link from 'next/link';
import { RuleList } from '@/components/approval-rules/RuleList';

export default function ApprovalRulesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Rules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automatic approval workflows for ECOs
          </p>
        </div>
        <Link
          href="/settings/approval-rules/create"
          className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Create Rule
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900">How it works</h3>
          <p className="mt-1 text-xs text-blue-800">
            Create rules that automatically assign approvers based on ECO conditions.
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-900">Conditions</h3>
          <p className="mt-1 text-xs text-green-800">
            Define complex conditions using product data, pricing, and ECO details.
          </p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="text-sm font-semibold text-purple-900">Delegation</h3>
          <p className="mt-1 text-xs text-purple-800">
            Managers can delegate approval authority temporarily.
          </p>
        </div>
      </div>

      {/* Rule List */}
      <RuleList />

      {/* Quick Links */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Quick Links</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/settings/approval-rules/delegations"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Manage Delegations
          </Link>
          <span className="text-gray-400">•</span>
          <Link
            href="/settings/eco-stages"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View ECO Stages
          </Link>
          <span className="text-gray-400">•</span>
          <a
            href="/docs"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

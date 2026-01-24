'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApprovalRule, RuleType, RuleFilterOptions } from '@/lib/types/approvalRules';
import { useRules } from '@/hooks/useApprovalRules';

interface RuleListProps {
  onDelete?: (id: string) => Promise<void>;
}

export function RuleList({ onDelete }: RuleListProps) {
  const { rules, pagination, loading, error, fetchRules, deleteRule } = useRules();
  const [filters, setFilters] = useState<RuleFilterOptions>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRules(filters);
  }, [filters, fetchRules]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      setShowDeleteConfirm(null);
      if (onDelete) {
        await onDelete(ruleId);
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const getRuleTypeLabel = (type: RuleType) => {
    switch (type) {
      case RuleType.STAGE_RULE:
        return 'Stage Rule';
      case RuleType.CONDITION_RULE:
        return 'Condition Rule';
      default:
        return type;
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />

          {/* Rule Type Filter */}
          <select
            value={filters.ruleType || ''}
            onChange={(e) =>
              handleFilterChange('ruleType', e.target.value || undefined)
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            <option value="stage_rule">Stage Rule</option>
            <option value="condition_rule">Condition Rule</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange(
                'isActive',
                value === '' ? undefined : value === 'true'
              );
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="name">Sort by Name</option>
            <option value="priority">Sort by Priority</option>
            <option value="createdAt">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {loading && rules.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-b-emerald-200" />
            <p className="mt-2 text-sm text-gray-600">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">No approval rules found.</p>
            <p className="mt-2 text-xs text-gray-500">
              Create your first rule to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Priority
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Created
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-gray-200 transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/settings/approval-rules/${rule.id}`}
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {rule.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {getRuleTypeLabel(rule.ruleType)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{rule.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    {rule.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {rule.createdAt
                      ? new Date(rule.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/settings/approval-rules/${rule.id}`}
                        className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/settings/approval-rules/${rule.id}/edit`}
                        className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(rule.id)}
                        className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} rules
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    pagination.page === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Delete Rule?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this approval rule? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

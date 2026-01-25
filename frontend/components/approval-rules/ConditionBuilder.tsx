'use client';

import { useState } from 'react';
import { RuleCondition, RuleOperator } from '@/lib/types/approvalRules';

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
}

// Available fields for ECO conditions
const AVAILABLE_FIELDS = [
  { value: 'eco.type', label: 'ECO Type', type: 'string' },
  { value: 'eco.title', label: 'ECO Title', type: 'string' },
  { value: 'product.name', label: 'Product Name', type: 'string' },
  { value: 'product.sku', label: 'Product Code', type: 'string' },
  { value: 'product.salePrice', label: 'Draft Sale Price', type: 'number' },
  { value: 'product.costPrice', label: 'Draft Cost Price', type: 'number' },
  { value: 'bom.componentCount', label: 'Draft Component Count', type: 'number' },
  { value: 'bom.operationCount', label: 'Draft Operation Count', type: 'number' },
  { value: 'changes.count', label: 'Total Draft Changes', type: 'number' },
  { value: 'changes.hasPriceChange', label: 'Has Price Change', type: 'boolean' },
  { value: 'changes.hasSpecChange', label: 'Has Spec Change', type: 'boolean' },
];

const OPERATORS: Record<string, { label: string; types: string[] }> = {
  [RuleOperator.EQ]: { label: 'Equals', types: ['string', 'number', 'boolean'] },
  [RuleOperator.GT]: { label: 'Greater Than', types: ['number'] },
  [RuleOperator.GTE]: { label: 'Greater Than or Equal', types: ['number'] },
  [RuleOperator.LT]: { label: 'Less Than', types: ['number'] },
  [RuleOperator.LTE]: { label: 'Less Than or Equal', types: ['number'] },
  [RuleOperator.IN]: { label: 'In List', types: ['string', 'number'] },
  [RuleOperator.NOT_IN]: { label: 'Not In List', types: ['string', 'number'] },
  [RuleOperator.CONTAINS]: { label: 'Contains', types: ['string'] },
  [RuleOperator.NOT_CONTAINS]: { label: 'Does Not Contain', types: ['string'] },
};

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const [expandedConditions, setExpandedConditions] = useState<Set<number>>(new Set([0]));

  const addCondition = () => {
    const newCondition: RuleCondition = {
      fieldName: '',
      operator: RuleOperator.EQ,
      fieldValue: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
    };
    const newConditions = [...conditions, newCondition];
    onChange(newConditions);
    setExpandedConditions(new Set([...expandedConditions, conditions.length]));
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    // If we removed the first condition, remove logicalOperator from new first condition
    if (index === 0 && newConditions.length > 0) {
      newConditions[0] = { ...newConditions[0], logicalOperator: undefined };
    }
    onChange(newConditions);
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };

    // Reset operator and value when field changes
    if (field === 'fieldName') {
      const fieldDef = AVAILABLE_FIELDS.find((f) => f.value === value);
      const defaultOperator =
        fieldDef?.type === 'number'
          ? RuleOperator.GT
          : fieldDef?.type === 'boolean'
          ? RuleOperator.EQ
          : RuleOperator.CONTAINS;
      newConditions[index] = {
        ...newConditions[index],
        operator: defaultOperator,
        fieldValue: '',
      };
    }

    onChange(newConditions);
  };

  const toggleExpanded = (index: number) => {
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getFieldType = (fieldName: string): string => {
    const field = AVAILABLE_FIELDS.find((f) => f.value === fieldName);
    return field?.type || 'string';
  };

  const getAvailableOperators = (fieldType: string) => {
    return Object.entries(OPERATORS)
      .filter(([_, op]) => op.types.includes(fieldType))
      .map(([value, op]) => ({ value, label: op.label }));
  };

  const renderValueInput = (condition: RuleCondition, index: number) => {
    const fieldType = getFieldType(condition.fieldName);
    const isListOperator = condition.operator === RuleOperator.IN || condition.operator === RuleOperator.NOT_IN;

    if (fieldType === 'boolean') {
      return (
        <select
          value={String(condition.fieldValue)}
          onChange={(e) => updateCondition(index, 'fieldValue', e.target.value === 'true')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select value...</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    if (isListOperator) {
      return (
        <div>
          <input
            type="text"
            value={Array.isArray(condition.fieldValue) ? condition.fieldValue.join(', ') : (condition.fieldValue || '')}
            onChange={(e) => {
              const values = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
              updateCondition(index, 'fieldValue', values);
            }}
            placeholder="Enter comma-separated values..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple values with commas</p>
        </div>
      );
    }

    return (
      <input
        type={fieldType === 'number' ? 'number' : 'text'}
        value={Array.isArray(condition.fieldValue) ? condition.fieldValue[0] || '' : condition.fieldValue}
        onChange={(e) => updateCondition(index, 'fieldValue', e.target.value)}
        placeholder={`Enter ${fieldType} value...`}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    );
  };

  if (conditions.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-gray-500">No conditions defined yet</p>
        <button
          type="button"
          onClick={addCondition}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Condition
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conditions.map((condition, index) => (
        <div key={index} className="rounded-md border border-gray-200 bg-gray-50">
          {/* Logical Operator Badge (AND/OR) */}
          {index > 0 && condition.logicalOperator && (
            <div className="flex items-center border-b border-gray-200 px-4 py-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateCondition(index, 'logicalOperator', 'AND')}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    condition.logicalOperator === 'AND'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => updateCondition(index, 'logicalOperator', 'OR')}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    condition.logicalOperator === 'OR'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  OR
                </button>
              </div>
            </div>
          )}

          {/* Condition Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => toggleExpanded(index)}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <svg
                className={`h-4 w-4 transition-transform ${expandedConditions.has(index) ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                Condition {index + 1}
                {condition.fieldName && (
                  <span className="ml-2 text-gray-500">
                    ({AVAILABLE_FIELDS.find((f) => f.value === condition.fieldName)?.label || condition.fieldName})
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="text-sm text-red-600 hover:text-red-900"
            >
              Remove
            </button>
          </div>

          {/* Condition Fields (Expanded) */}
          {expandedConditions.has(index) && (
            <div className="space-y-4 border-t border-gray-200 px-4 py-4">
              {/* Field Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Field</label>
                <select
                  value={condition.fieldName}
                  onChange={(e) => updateCondition(index, 'fieldName', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select a field...</option>
                  {AVAILABLE_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                  {condition.fieldName &&
                    !AVAILABLE_FIELDS.some((field) => field.value === condition.fieldName) && (
                      <option value={condition.fieldName}>
                        {`Unsupported field (${condition.fieldName})`}
                      </option>
                    )}
                </select>
              </div>

              {/* Operator */}
              {condition.fieldName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {getAvailableOperators(getFieldType(condition.fieldName)).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Value */}
              {condition.fieldName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <div className="mt-1">{renderValueInput(condition, index)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Condition Button */}
      <button
        type="button"
        onClick={addCondition}
        className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Another Condition
      </button>
    </div>
  );
}

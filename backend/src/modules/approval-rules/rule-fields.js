export const RULE_FIELDS = [
  { value: 'eco.type', type: 'string' },
  { value: 'eco.title', type: 'string' },
  { value: 'product.name', type: 'string' },
  { value: 'product.sku', type: 'string' },
  { value: 'product.salePrice', type: 'number' },
  { value: 'product.costPrice', type: 'number' },
  { value: 'bom.componentCount', type: 'number' },
  { value: 'bom.operationCount', type: 'number' },
  { value: 'changes.count', type: 'number' },
  { value: 'changes.hasPriceChange', type: 'boolean' },
  { value: 'changes.hasSpecChange', type: 'boolean' },
];

const RULE_FIELD_ALIASES = ['eco.ecoType', 'product.code', 'product.productCode'];

export const RULE_FIELD_SET = new Set([
  ...RULE_FIELDS.map((field) => field.value),
  ...RULE_FIELD_ALIASES
]);

export const RULE_LOGICAL_OPERATORS = new Set(['AND', 'OR']);

export const RULE_OPERATOR_SET = new Set([
  'GT',
  'LT',
  'EQ',
  'GTE',
  'LTE',
  'IN',
  'NOT_IN',
  'CONTAINS',
  'NOT_CONTAINS',
]);

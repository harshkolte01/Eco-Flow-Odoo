// Approval Rules Module Index
const ApprovalRulesService = require('./approval-rules.service');
const RuleEvaluationService = require('./rule-evaluation.service');
const DelegationService = require('./delegation.service');

const approvalRulesService = new ApprovalRulesService();
const ruleEvaluationService = new RuleEvaluationService();
const delegationService = new DelegationService();

module.exports = {
  ApprovalRulesService,
  RuleEvaluationService,
  DelegationService,
  approvalRulesService,
  ruleEvaluationService,
  delegationService
};

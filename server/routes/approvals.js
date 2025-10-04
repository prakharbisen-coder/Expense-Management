const express = require('express');
const router = express.Router();

// Get pending approvals for a user
router.get('/pending', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // Get all expenses
  const allExpenses = global.db.expenses;
  
  // Find expenses that need this user's approval
  const pendingApprovals = allExpenses.filter(expense => {
    // Skip already approved or rejected expenses
    if (expense.status !== 'pending') return false;
    
    // Check if this user has already approved
    const alreadyApproved = expense.approvals.some(a => a.userId === userId);
    if (alreadyApproved) return false;
    
    // Get the expense submitter
    const submitter = global.db.users.find(u => u.id === expense.userId);
    
    // Check if user is the submitter's manager
    if (submitter && submitter.managerId === userId) return true;
    
    // Check approval rules
    const companyRules = global.db.approvalRules.filter(
      r => r.companyId === submitter.companyId
    );
    
    // Check if user is in any approval rule for this expense
    return companyRules.some(rule => {
      if (rule.type === 'specific_approver' && rule.approverId === userId) {
        return true;
      }
      
      if (rule.approvers && rule.approvers.includes(userId)) {
        // Check if it's this user's turn in sequential approval
        if (rule.type === 'sequential') {
          const approverIndex = rule.approvers.indexOf(userId);
          const previousApprovers = rule.approvers.slice(0, approverIndex);
          
          // All previous approvers must have approved
          return previousApprovers.every(approverId => 
            expense.approvals.some(a => a.userId === approverId && a.status === 'approved')
          );
        }
        
        return true;
      }
      
      return false;
    });
  });
  
  // Enhance with submitter information
  const enhancedApprovals = pendingApprovals.map(expense => {
    const submitter = global.db.users.find(u => u.id === expense.userId);
    return {
      ...expense,
      submitterName: submitter ? submitter.name : 'Unknown User'
    };
  });
  
  res.json(enhancedApprovals);
});

// Approve or reject an expense
router.post('/:expenseId', (req, res) => {
  const { expenseId } = req.params;
  const { userId, status, comments } = req.body;
  
  // Validate required fields
  if (!userId || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Find expense
  const expenseIndex = global.db.expenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  
  const expense = global.db.expenses[expenseIndex];
  
  // Add approval
  const approval = {
    userId,
    status,
    comments: comments || '',
    timestamp: new Date().toISOString()
  };
  
  expense.approvals.push(approval);
  
  // Get the expense submitter and their company
  const submitter = global.db.users.find(u => u.id === expense.userId);
  const companyRules = global.db.approvalRules.filter(
    r => r.companyId === submitter.companyId
  );
  
  // Update expense status based on approval rules
  if (status === 'rejected') {
    // If any approver rejects, the expense is rejected
    expense.status = 'rejected';
  } else {
    // Check if expense is fully approved based on rules
    let isFullyApproved = false;
    
    // Check specific approver rules
    const specificApproverRule = companyRules.find(r => r.type === 'specific_approver');
    if (specificApproverRule && userId === specificApproverRule.approverId && status === 'approved') {
      isFullyApproved = true;
    }
    
    // Check percentage rules
    const percentageRules = companyRules.filter(r => r.type === 'percentage');
    for (const rule of percentageRules) {
      if (!rule.approvers || rule.approvers.length === 0) continue;
      
      const approvedCount = expense.approvals.filter(
        a => rule.approvers.includes(a.userId) && a.status === 'approved'
      ).length;
      
      const approvalPercentage = (approvedCount / rule.approvers.length) * 100;
      if (approvalPercentage >= (rule.percentage || 100)) {
        isFullyApproved = true;
        break;
      }
    }
    
    // Check sequential rules
    const sequentialRules = companyRules.filter(r => r.type === 'sequential');
    for (const rule of sequentialRules) {
      if (!rule.approvers || rule.approvers.length === 0) continue;
      
      // Check if all approvers in the sequence have approved
      const allApproved = rule.approvers.every(approverId => 
        expense.approvals.some(a => a.userId === approverId && a.status === 'approved')
      );
      
      if (allApproved) {
        isFullyApproved = true;
        break;
      }
    }
    
    // Update expense status if fully approved
    if (isFullyApproved) {
      expense.status = 'approved';
    }
  }
  
  res.json(expense);
});

// Get approval rules for a company
router.get('/rules', (req, res) => {
  const { companyId } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }
  
  const rules = global.db.approvalRules.filter(r => r.companyId === companyId);
  
  res.json(rules);
});

// Create or update approval rule
router.post('/rules', (req, res) => {
  const { id, companyId, name, type, approvers, percentage, approverId, threshold } = req.body;
  
  // Validate required fields
  if (!companyId || !name || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Validate rule type
  if (!['sequential', 'percentage', 'specific_approver'].includes(type)) {
    return res.status(400).json({ message: 'Invalid rule type' });
  }
  
  let rule;
  
  if (id) {
    // Update existing rule
    const ruleIndex = global.db.approvalRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return res.status(404).json({ message: 'Rule not found' });
    }
    
    rule = global.db.approvalRules[ruleIndex];
    rule.name = name;
    rule.type = type;
    
    if (type === 'sequential' || type === 'percentage') {
      rule.approvers = approvers || [];
    }
    
    if (type === 'percentage') {
      rule.percentage = percentage || 100;
    }
    
    if (type === 'specific_approver') {
      rule.approverId = approverId;
    }
    
    if (threshold) {
      rule.threshold = threshold;
    }
  } else {
    // Create new rule
    const newRuleId = (global.db.approvalRules.length + 1).toString();
    rule = {
      id: newRuleId,
      companyId,
      name,
      type
    };
    
    if (type === 'sequential' || type === 'percentage') {
      rule.approvers = approvers || [];
    }
    
    if (type === 'percentage') {
      rule.percentage = percentage || 100;
    }
    
    if (type === 'specific_approver') {
      rule.approverId = approverId;
    }
    
    if (threshold) {
      rule.threshold = threshold;
    }
    
    global.db.approvalRules.push(rule);
  }
  
  res.json(rule);
});

// Delete approval rule
router.delete('/rules/:id', (req, res) => {
  const { id } = req.params;
  
  // Find rule
  const ruleIndex = global.db.approvalRules.findIndex(r => r.id === id);
  
  if (ruleIndex === -1) {
    return res.status(404).json({ message: 'Rule not found' });
  }
  
  // Remove rule
  global.db.approvalRules.splice(ruleIndex, 1);
  
  res.status(204).send();
});

module.exports = router;
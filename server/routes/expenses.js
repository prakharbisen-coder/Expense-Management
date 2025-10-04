const express = require('express');
const router = express.Router();

// Get all expenses for a user or company
router.get('/', (req, res) => {
  const { userId, companyId, role } = req.query;
  
  let expenses = [];
  
  if (role === 'admin' && companyId) {
    // Admin can see all expenses in the company
    const companyUsers = global.db.users.filter(u => u.companyId === companyId).map(u => u.id);
    expenses = global.db.expenses.filter(e => companyUsers.includes(e.userId));
  } else if (role === 'manager' && userId) {
    // Manager can see their team's expenses
    const teamMembers = global.db.users.filter(u => u.managerId === userId).map(u => u.id);
    expenses = global.db.expenses.filter(e => teamMembers.includes(e.userId) || e.userId === userId);
  } else if (userId) {
    // Employee can see their own expenses
    expenses = global.db.expenses.filter(e => e.userId === userId);
  } else {
    return res.status(400).json({ message: 'Invalid query parameters' });
  }
  
  // Enhance expenses with user information
  const enhancedExpenses = expenses.map(expense => {
    const user = global.db.users.find(u => u.id === expense.userId);
    return {
      ...expense,
      userName: user ? user.name : 'Unknown User'
    };
  });
  
  res.json(enhancedExpenses);
});

// Get a specific expense
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const expense = global.db.expenses.find(e => e.id === id);
  
  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  
  // Get user info
  const user = global.db.users.find(u => u.id === expense.userId);
  
  // Get company currency
  const company = global.db.companies.find(c => c.id === user.companyId);
  
  // Enhance expense with additional info
  const enhancedExpense = {
    ...expense,
    userName: user ? user.name : 'Unknown User',
    companyCurrency: company ? company.currency : 'USD'
  };
  
  res.json(enhancedExpense);
});

// Create new expense
router.post('/', (req, res) => {
  const { userId, category, amount, currency, description, date } = req.body;
  
  // Validate required fields
  if (!userId || !category || !amount || !currency || !description || !date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Find user and their manager
  const user = global.db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Create new expense
  const newExpenseId = (global.db.expenses.length + 1).toString();
  const newExpense = {
    id: newExpenseId,
    userId,
    category,
    amount: parseFloat(amount),
    currency,
    description,
    date,
    status: 'pending',
    approvals: []
  };
  
  // Add to our in-memory database
  global.db.expenses.push(newExpense);
  
  // Find applicable approval rules
  const company = global.db.companies.find(c => c.id === user.companyId);
  
  // Determine next approver based on rules
  let nextApprover = null;
  
  // Check if user has a manager
  if (user.managerId) {
    nextApprover = user.managerId;
  } else {
    // Find company admin as fallback approver
    const admin = global.db.users.find(u => u.companyId === user.companyId && u.role === 'admin');
    if (admin) {
      nextApprover = admin.id;
    }
  }
  
  res.status(201).json({
    ...newExpense,
    nextApprover
  });
});

// Update expense status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Find expense
  const expenseIndex = global.db.expenses.findIndex(e => e.id === id);
  
  if (expenseIndex === -1) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  
  // Update status
  global.db.expenses[expenseIndex].status = status;
  
  res.json(global.db.expenses[expenseIndex]);
});

// Delete expense
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Find expense
  const expenseIndex = global.db.expenses.findIndex(e => e.id === id);
  
  if (expenseIndex === -1) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  
  // Remove expense
  global.db.expenses.splice(expenseIndex, 1);
  
  res.status(204).send();
});

// OCR endpoint (mock)
router.post('/ocr', (req, res) => {
  // In a real app, this would process an uploaded receipt image
  // For demo purposes, we'll return mock data
  
  res.json({
    success: true,
    data: {
      amount: 78.50,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      category: 'Meals',
      description: 'Business lunch at Restaurant XYZ',
      vendor: 'Restaurant XYZ'
    }
  });
});

module.exports = router;
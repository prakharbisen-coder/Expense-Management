const express = require('express');
const router = express.Router();

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = global.db.users.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // In a real app, we would generate a JWT token here
  const token = `fake-jwt-token-${user.id}-${user.role}`;
  
  // Return user info and token
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    }
  });
});

// Signup route - creates a new company and admin user
router.post('/signup', (req, res) => {
  const { name, email, password, companyName, country } = req.body;
  
  // Check if email already exists
  if (global.db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  // Get currency for the selected country
  let currency = 'USD'; // Default
  
  // In a real app, we would fetch this from the countries API
  if (country === 'United Kingdom') currency = 'GBP';
  if (country === 'European Union') currency = 'EUR';
  if (country === 'Japan') currency = 'JPY';
  
  // Create new company
  const newCompanyId = (global.db.companies.length + 1).toString();
  const newCompany = {
    id: newCompanyId,
    name: companyName,
    country,
    currency
  };
  
  // Create new admin user
  const newUserId = (global.db.users.length + 1).toString();
  const newUser = {
    id: newUserId,
    name,
    email,
    password, // In a real app, this would be hashed
    role: 'admin',
    companyId: newCompanyId
  };
  
  // Add to our in-memory database
  global.db.companies.push(newCompany);
  global.db.users.push(newUser);
  
  // Create default approval rule for the new company
  const newRuleId = (global.db.approvalRules.length + 1).toString();
  const defaultRule = {
    id: newRuleId,
    companyId: newCompanyId,
    name: 'Default Approval',
    type: 'sequential',
    approvers: [newUserId] // Admin is the default approver
  };
  
  global.db.approvalRules.push(defaultRule);
  
  // In a real app, we would generate a JWT token here
  const token = `fake-jwt-token-${newUserId}-admin`;
  
  // Return user info and token
  res.status(201).json({
    token,
    user: {
      id: newUserId,
      name,
      email,
      role: 'admin',
      companyId: newCompanyId
    }
  });
});

// Verify token route
router.get('/verify', (req, res) => {
  // In a real app, we would verify the JWT token here
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Parse our fake token to get user info
  const parts = token.split('-');
  if (parts[0] !== 'fake' || parts[1] !== 'jwt' || parts[2] !== 'token') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  const userId = parts[3];
  const user = global.db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    }
  });
});

module.exports = router;
const express = require('express');
const router = express.Router();

// Get all users for a company
router.get('/', (req, res) => {
  const { companyId } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }
  
  const users = global.db.users.filter(u => u.companyId === companyId);
  
  // Don't send passwords in response
  const safeUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    companyId: u.companyId,
    managerId: u.managerId || null
  }));
  
  res.json(safeUsers);
});

// Create new user (employee or manager)
router.post('/', (req, res) => {
  const { name, email, password, role, companyId, managerId } = req.body;
  
  // Validate required fields
  if (!name || !email || !password || !role || !companyId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check if email already exists
  if (global.db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  // Validate role
  if (role !== 'employee' && role !== 'manager') {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  // Create new user
  const newUserId = (global.db.users.length + 1).toString();
  const newUser = {
    id: newUserId,
    name,
    email,
    password, // In a real app, this would be hashed
    role,
    companyId,
    managerId: managerId || null
  };
  
  // Add to our in-memory database
  global.db.users.push(newUser);
  
  // Don't send password in response
  const { password: _, ...safeUser } = newUser;
  
  res.status(201).json(safeUser);
});

// Update user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, managerId } = req.body;
  
  // Find user
  const userIndex = global.db.users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user fields
  if (name) global.db.users[userIndex].name = name;
  if (email) global.db.users[userIndex].email = email;
  if (role) global.db.users[userIndex].role = role;
  if (managerId !== undefined) global.db.users[userIndex].managerId = managerId;
  
  // Don't send password in response
  const { password: _, ...safeUser } = global.db.users[userIndex];
  
  res.json(safeUser);
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Find user
  const userIndex = global.db.users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Remove user
  global.db.users.splice(userIndex, 1);
  
  res.status(204).send();
});

// Get managers for a company
router.get('/managers', (req, res) => {
  const { companyId } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }
  
  const managers = global.db.users.filter(
    u => u.companyId === companyId && (u.role === 'manager' || u.role === 'admin')
  );
  
  // Don't send passwords in response
  const safeManagers = managers.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role
  }));
  
  res.json(safeManagers);
});

module.exports = router;
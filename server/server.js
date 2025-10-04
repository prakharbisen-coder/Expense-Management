const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const approvalRoutes = require('./routes/approvals');
const currencyRoutes = require('./routes/currency');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database for demo
global.db = {
  users: [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // In a real app, this would be hashed
      role: 'admin',
      companyId: '1'
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'password123',
      role: 'manager',
      companyId: '1',
      managerId: null
    },
    {
      id: '3',
      name: 'Employee User',
      email: 'employee@example.com',
      password: 'password123',
      role: 'employee',
      companyId: '1',
      managerId: '2'
    }
  ],
  companies: [
    {
      id: '1',
      name: 'Demo Company',
      country: 'United States',
      currency: 'USD'
    }
  ],
  expenses: [
    {
      id: '1',
      userId: '3',
      category: 'Travel',
      amount: 120.00,
      currency: 'USD',
      description: 'Business trip to client site',
      date: '2023-09-15',
      status: 'approved',
      approvals: [
        { userId: '2', status: 'approved', comments: 'Approved', timestamp: '2023-09-16T10:30:00Z' }
      ]
    },
    {
      id: '2',
      userId: '3',
      category: 'Office Supplies',
      amount: 45.75,
      currency: 'USD',
      description: 'Purchased office supplies for the team',
      date: '2023-09-20',
      status: 'pending',
      approvals: []
    }
  ],
  approvalRules: [
    {
      id: '1',
      companyId: '1',
      name: 'Standard Approval',
      type: 'sequential',
      approvers: ['2'] // Manager ID
    },
    {
      id: '2',
      companyId: '1',
      name: 'High Amount Rule',
      type: 'percentage',
      threshold: 1000,
      percentage: 75,
      approvers: ['2', '1'] // Manager and Admin IDs
    },
    {
      id: '3',
      companyId: '1',
      name: 'CFO Override',
      type: 'specific_approver',
      approverId: '1' // Admin ID (acting as CFO)
    }
  ]
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/currency', currencyRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
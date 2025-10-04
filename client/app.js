// Global variables
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let countries = [];
let currencies = {};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Auth related elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const countrySelect = document.getElementById('country');
    const signupCountrySelect = document.getElementById('signup-country');
    
    // Event listeners for auth forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
    
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    
    // Fetch countries and currencies on page load
    fetchCountriesAndCurrencies();
    
    // Check if user is already logged in
    checkAuthStatus();
});

// Fetch countries and currencies from API
async function fetchCountriesAndCurrencies() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const data = await response.json();
        
        countries = data.map(country => {
            const currencyCode = Object.keys(country.currencies)[0];
            const currencyName = country.currencies[currencyCode].name;
            const currencySymbol = country.currencies[currencyCode].symbol;
            
            return {
                name: country.name.common,
                currencyCode,
                currencyName,
                currencySymbol
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
        
        populateCountryDropdowns();
    } catch (error) {
        console.error('Error fetching countries:', error);
        // For demo purposes, add some default countries
        countries = [
            { name: 'United States', currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$' },
            { name: 'United Kingdom', currencyCode: 'GBP', currencyName: 'British Pound', currencySymbol: '£' },
            { name: 'Euro Zone', currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€' },
            { name: 'Japan', currencyCode: 'JPY', currencyName: 'Japanese Yen', currencySymbol: '¥' },
            { name: 'India', currencyCode: 'INR', currencyName: 'Indian Rupee', currencySymbol: '₹' }
        ];
        populateCountryDropdowns();
    }
}

// Populate country dropdowns
function populateCountryDropdowns() {
    const countrySelect = document.getElementById('country');
    const signupCountrySelect = document.getElementById('signup-country');
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = `${country.name} (${country.currencyCode})`;
        option.dataset.currency = country.currencyCode;
        
        const signupOption = option.cloneNode(true);
        
        countrySelect.appendChild(option);
        signupCountrySelect.appendChild(signupOption);
    });
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const countrySelect = document.getElementById('country');
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex].value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        // In a real app, this would be an API call
        // For demo, we'll simulate a successful login
        const user = {
            id: '1',
            email,
            name: email.split('@')[0],
            role: 'admin', // For demo, first user is admin
            company: {
                id: '1',
                name: 'Demo Company',
                country: selectedCountry,
                currency: countrySelect.options[countrySelect.selectedIndex].dataset.currency
            }
        };
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        
        // Show dashboard based on role
        showDashboard(user.role);
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Handle signup
async function handleSignup() {
    const companyName = document.getElementById('company-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const countrySelect = document.getElementById('signup-country');
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex].value;
    
    if (!companyName || !email || !password || !selectedCountry) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        // In a real app, this would be an API call
        // For demo, we'll simulate a successful signup
        const user = {
            id: '1',
            email,
            name: email.split('@')[0],
            role: 'admin', // First user is always admin
            company: {
                id: '1',
                name: companyName,
                country: selectedCountry,
                currency: countrySelect.options[countrySelect.selectedIndex].dataset.currency
            }
        };
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        
        // Show admin dashboard
        showDashboard('admin');
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

// Check if user is already logged in
function checkAuthStatus() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showDashboard(currentUser.role);
    }
}

// Show dashboard based on user role
function showDashboard(role) {
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard');
    
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    
    // Load dashboard content based on role
    switch (role) {
        case 'admin':
            loadAdminDashboard();
            break;
        case 'manager':
            loadManagerDashboard();
            break;
        case 'employee':
            loadEmployeeDashboard();
            break;
        default:
            console.error('Unknown role:', role);
    }
}

// Load admin dashboard
function loadAdminDashboard() {
    const dashboardContainer = document.getElementById('dashboard');
    
    dashboardContainer.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-2 sidebar">
                    <h4 class="text-center mb-4">Admin Panel</h4>
                    <div class="nav flex-column">
                        <a class="nav-link active" href="#" data-section="users">Users</a>
                        <a class="nav-link" href="#" data-section="approval-rules">Approval Rules</a>
                        <a class="nav-link" href="#" data-section="expenses">All Expenses</a>
                        <a class="nav-link" href="#" data-section="reports">Reports</a>
                        <a class="nav-link" href="#" id="logout-btn">Logout</a>
                    </div>
                </div>
                <div class="col-md-10 main-content">
                    <div id="admin-users-section">
                        <h2>User Management</h2>
                        <button class="btn btn-primary mb-3" id="add-user-btn">Add New User</button>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Users</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Manager</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="users-table-body">
                                        <tr>
                                            <td>${currentUser.name}</td>
                                            <td>${currentUser.email}</td>
                                            <td>Admin</td>
                                            <td>-</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                            </td>
                                        </tr>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>John Manager</td>
                                            <td>john@demo.com</td>
                                            <td>Manager</td>
                                            <td>-</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                                <button class="btn btn-sm btn-outline-danger">Delete</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>jane@demo.com</td>
                                            <td>Employee</td>
                                            <td>John Manager</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                                <button class="btn btn-sm btn-outline-danger">Delete</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div id="admin-approval-rules-section" style="display: none;">
                        <h2>Approval Rules</h2>
                        <button class="btn btn-primary mb-3" id="add-rule-btn">Add New Rule</button>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Current Rules</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Rule Name</th>
                                            <th>Type</th>
                                            <th>Condition</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>Standard Approval</td>
                                            <td>Sequential</td>
                                            <td>Manager → Finance → Director</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                                <button class="btn btn-sm btn-outline-danger">Delete</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>High Amount Rule</td>
                                            <td>Percentage</td>
                                            <td>If amount > 1000: 75% approval required</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                                <button class="btn btn-sm btn-outline-danger">Delete</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>CFO Override</td>
                                            <td>Specific Approver</td>
                                            <td>If CFO approves: Auto-approved</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                                <button class="btn btn-sm btn-outline-danger">Delete</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div id="admin-expenses-section" style="display: none;">
                        <h2>All Expenses</h2>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Expense List</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>2023-09-15</td>
                                            <td>Travel</td>
                                            <td>$120.00</td>
                                            <td><span class="badge status-badge status-approved">Approved</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>2023-09-20</td>
                                            <td>Office Supplies</td>
                                            <td>$45.75</td>
                                            <td><span class="badge status-badge status-pending">Pending</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div id="admin-reports-section" style="display: none;">
                        <h2>Reports</h2>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5>Expense Summary</h5>
                                    </div>
                                    <div class="card-body">
                                        <p>Total Expenses: $1,245.75</p>
                                        <p>Approved: $875.25</p>
                                        <p>Pending: $370.50</p>
                                        <p>Rejected: $0.00</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5>Category Breakdown</h5>
                                    </div>
                                    <div class="card-body">
                                        <p>Travel: $450.00</p>
                                        <p>Office Supplies: $325.75</p>
                                        <p>Meals: $270.00</p>
                                        <p>Other: $200.00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for admin dashboard
    setupAdminDashboardEvents();
}

// Load manager dashboard
function loadManagerDashboard() {
    const dashboardContainer = document.getElementById('dashboard');
    
    dashboardContainer.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-2 sidebar">
                    <h4 class="text-center mb-4">Manager Panel</h4>
                    <div class="nav flex-column">
                        <a class="nav-link active" href="#" data-section="pending-approvals">Pending Approvals</a>
                        <a class="nav-link" href="#" data-section="team-expenses">Team Expenses</a>
                        <a class="nav-link" href="#" data-section="my-expenses">My Expenses</a>
                        <a class="nav-link" href="#" id="logout-btn">Logout</a>
                    </div>
                </div>
                <div class="col-md-10 main-content">
                    <div id="manager-pending-approvals-section">
                        <h2>Pending Approvals</h2>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Expenses Awaiting Your Approval</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <!-- Demo data -->
                                    <div class="col-md-6">
                                        <div class="card expense-card">
                                            <div class="card-header d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0">Office Supplies</h6>
                                                <span class="badge status-badge status-pending">Pending</span>
                                            </div>
                                            <div class="card-body">
                                                <p><strong>Employee:</strong> Jane Employee</p>
                                                <p><strong>Date:</strong> 2023-09-20</p>
                                                <p><strong>Amount:</strong> $45.75</p>
                                                <p><strong>Description:</strong> Purchased office supplies for the team.</p>
                                                <div class="d-flex justify-content-between mt-3">
                                                    <button class="btn btn-success btn-sm">Approve</button>
                                                    <button class="btn btn-danger btn-sm">Reject</button>
                                                    <button class="btn btn-primary btn-sm">View Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card expense-card">
                                            <div class="card-header d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0">Travel</h6>
                                                <span class="badge status-badge status-pending">Pending</span>
                                            </div>
                                            <div class="card-body">
                                                <p><strong>Employee:</strong> Jane Employee</p>
                                                <p><strong>Date:</strong> 2023-09-22</p>
                                                <p><strong>Amount:</strong> $325.50</p>
                                                <p><strong>Description:</strong> Client meeting travel expenses.</p>
                                                <div class="d-flex justify-content-between mt-3">
                                                    <button class="btn btn-success btn-sm">Approve</button>
                                                    <button class="btn btn-danger btn-sm">Reject</button>
                                                    <button class="btn btn-primary btn-sm">View Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="manager-team-expenses-section" style="display: none;">
                        <h2>Team Expenses</h2>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>All Team Expenses</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>2023-09-15</td>
                                            <td>Travel</td>
                                            <td>$120.00</td>
                                            <td><span class="badge status-badge status-approved">Approved</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>2023-09-20</td>
                                            <td>Office Supplies</td>
                                            <td>$45.75</td>
                                            <td><span class="badge status-badge status-pending">Pending</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Jane Employee</td>
                                            <td>2023-09-22</td>
                                            <td>Travel</td>
                                            <td>$325.50</td>
                                            <td><span class="badge status-badge status-pending">Pending</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div id="manager-my-expenses-section" style="display: none;">
                        <!-- Similar to employee dashboard -->
                        <h2>My Expenses</h2>
                        
                        <button class="btn btn-primary mb-3" id="manager-add-expense-btn">Add New Expense</button>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>My Expense History</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>2023-09-10</td>
                                            <td>Meals</td>
                                            <td>$65.00</td>
                                            <td><span class="badge status-badge status-approved">Approved</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for manager dashboard
    setupManagerDashboardEvents();
}

// Load employee dashboard
function loadEmployeeDashboard() {
    const dashboardContainer = document.getElementById('dashboard');
    
    dashboardContainer.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-2 sidebar">
                    <h4 class="text-center mb-4">Employee Panel</h4>
                    <div class="nav flex-column">
                        <a class="nav-link active" href="#" data-section="my-expenses">My Expenses</a>
                        <a class="nav-link" href="#" data-section="new-expense">New Expense</a>
                        <a class="nav-link" href="#" id="logout-btn">Logout</a>
                    </div>
                </div>
                <div class="col-md-10 main-content">
                    <div id="employee-my-expenses-section">
                        <h2>My Expenses</h2>
                        
                        <button class="btn btn-primary mb-3" id="add-expense-btn">Add New Expense</button>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Expense History</h5>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Demo data -->
                                        <tr>
                                            <td>2023-09-15</td>
                                            <td>Travel</td>
                                            <td>$120.00</td>
                                            <td><span class="badge status-badge status-approved">Approved</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2023-09-20</td>
                                            <td>Office Supplies</td>
                                            <td>$45.75</td>
                                            <td><span class="badge status-badge status-pending">Pending</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">View</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div id="employee-new-expense-section" style="display: none;">
                        <h2>Submit New Expense</h2>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Expense Details</h5>
                            </div>
                            <div class="card-body">
                                <form id="expense-form">
                                    <div class="mb-3">
                                        <label for="expense-date" class="form-label">Date</label>
                                        <input type="date" class="form-control" id="expense-date" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="expense-category" class="form-label">Category</label>
                                        <select class="form-control" id="expense-category" required>
                                            <option value="">Select Category</option>
                                            <option value="Travel">Travel</option>
                                            <option value="Meals">Meals</option>
                                            <option value="Office Supplies">Office Supplies</option>
                                            <option value="Equipment">Equipment</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="expense-amount" class="form-label">Amount</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" id="expense-amount" step="0.01" min="0" required>
                                            <select class="form-control" id="expense-currency">
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="JPY">JPY</option>
                                                <option value="INR">INR</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="expense-description" class="form-label">Description</label>
                                        <textarea class="form-control" id="expense-description" rows="3" required></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="expense-receipt" class="form-label">Receipt (Optional)</label>
                                        <input type="file" class="form-control" id="expense-receipt">
                                        <div class="form-text">Upload a photo or scan of your receipt.</div>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Submit Expense</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for employee dashboard
    setupEmployeeDashboardEvents();
}

// Setup admin dashboard events
function setupAdminDashboardEvents() {
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        if (link.id === 'logout-btn') {
            link.addEventListener('click', handleLogout);
        } else {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Hide all sections
                document.getElementById('admin-users-section').style.display = 'none';
                document.getElementById('admin-approval-rules-section').style.display = 'none';
                document.getElementById('admin-expenses-section').style.display = 'none';
                document.getElementById('admin-reports-section').style.display = 'none';
                
                // Show selected section
                document.getElementById(`admin-${section}-section`).style.display = 'block';
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        }
    });
    
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            alert('Add user functionality would be implemented here.');
        });
    }
    
    // Add rule button
    const addRuleBtn = document.getElementById('add-rule-btn');
    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', () => {
            alert('Add approval rule functionality would be implemented here.');
        });
    }
}

// Setup manager dashboard events
function setupManagerDashboardEvents() {
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        if (link.id === 'logout-btn') {
            link.addEventListener('click', handleLogout);
        } else {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Hide all sections
                document.getElementById('manager-pending-approvals-section').style.display = 'none';
                document.getElementById('manager-team-expenses-section').style.display = 'none';
                document.getElementById('manager-my-expenses-section').style.display = 'none';
                
                // Show selected section
                document.getElementById(`manager-${section}-section`).style.display = 'block';
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        }
    });
    
    // Approve/Reject buttons
    const approveButtons = document.querySelectorAll('.btn-success');
    const rejectButtons = document.querySelectorAll('.btn-danger');
    
    approveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseCard = this.closest('.expense-card');
            alert('Expense approved!');
            expenseCard.remove();
        });
    });
    
    rejectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseCard = this.closest('.expense-card');
            const reason = prompt('Please provide a reason for rejection:');
            if (reason) {
                alert('Expense rejected!');
                expenseCard.remove();
            }
        });
    });
    
    // Add expense button for manager
    const addExpenseBtn = document.getElementById('manager-add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            // Hide all sections
            document.getElementById('manager-pending-approvals-section').style.display = 'none';
            document.getElementById('manager-team-expenses-section').style.display = 'none';
            document.getElementById('manager-my-expenses-section').style.display = 'none';
            
            // Create and show new expense form
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML += `
                <div id="manager-new-expense-section">
                    <h2>Submit New Expense</h2>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Expense Details</h5>
                        </div>
                        <div class="card-body">
                            <form id="manager-expense-form">
                                <div class="mb-3">
                                    <label for="manager-expense-date" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="manager-expense-date" required>
                                </div>
                                <div class="mb-3">
                                    <label for="manager-expense-category" class="form-label">Category</label>
                                    <select class="form-control" id="manager-expense-category" required>
                                        <option value="">Select Category</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Meals">Meals</option>
                                        <option value="Office Supplies">Office Supplies</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="manager-expense-amount" class="form-label">Amount</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" id="manager-expense-amount" step="0.01" min="0" required>
                                        <select class="form-control" id="manager-expense-currency">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                            <option value="JPY">JPY</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="manager-expense-description" class="form-label">Description</label>
                                    <textarea class="form-control" id="manager-expense-description" rows="3" required></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="manager-expense-receipt" class="form-label">Receipt (Optional)</label>
                                    <input type="file" class="form-control" id="manager-expense-receipt">
                                    <div class="form-text">Upload a photo or scan of your receipt.</div>
                                </div>
                                <button type="submit" class="btn btn-primary">Submit Expense</button>
                                <button type="button" class="btn btn-secondary" id="manager-cancel-expense">Cancel</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('manager-new-expense-section').style.display = 'block';
            
            // Add event listener for form submission
            document.getElementById('manager-expense-form').addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Expense submitted successfully!');
                
                // Hide form and show my expenses section
                document.getElementById('manager-new-expense-section').style.display = 'none';
                document.getElementById('manager-my-expenses-section').style.display = 'block';
                
                // Update active link
                navLinks.forEach(l => {
                    if (l.dataset.section === 'my-expenses') {
                        l.classList.add('active');
                    } else {
                        l.classList.remove('active');
                    }
                });
            });
            
            // Add event listener for cancel button
            document.getElementById('manager-cancel-expense').addEventListener('click', function() {
                document.getElementById('manager-new-expense-section').style.display = 'none';
                document.getElementById('manager-my-expenses-section').style.display = 'block';
                
                // Update active link
                navLinks.forEach(l => {
                    if (l.dataset.section === 'my-expenses') {
                        l.classList.add('active');
                    } else {
                        l.classList.remove('active');
                    }
                });
            });
        });
    }
}

// Setup employee dashboard events
function setupEmployeeDashboardEvents() {
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        if (link.id === 'logout-btn') {
            link.addEventListener('click', handleLogout);
        } else {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Hide all sections
                document.getElementById('employee-my-expenses-section').style.display = 'none';
                document.getElementById('employee-new-expense-section').style.display = 'none';
                
                // Show selected section
                document.getElementById(`employee-${section}-section`).style.display = 'block';
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        }
    });
    
    // Add expense button
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            // Hide my expenses section
            document.getElementById('employee-my-expenses-section').style.display = 'none';
            
            // Show new expense section
            document.getElementById('employee-new-expense-section').style.display = 'block';
            
            // Update active link
            navLinks.forEach(l => {
                if (l.dataset.section === 'new-expense') {
                    l.classList.add('active');
                } else {
                    l.classList.remove('active');
                }
            });
        });
    }
    
    // Expense form submission
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Expense submitted successfully!');
            
            // Reset form
            this.reset();
            
            // Hide new expense section
            document.getElementById('employee-new-expense-section').style.display = 'none';
            
            // Show my expenses section
            document.getElementById('employee-my-expenses-section').style.display = 'block';
            
            // Update active link
            navLinks.forEach(l => {
                if (l.dataset.section === 'my-expenses') {
                    l.classList.add('active');
                } else {
                    l.classList.remove('active');
                }
            });
        });
    }
}

// Handle logout
function handleLogout() {
    // Clear user data
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Show auth container
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard');
    
    authContainer.style.display = 'block';
    dashboardContainer.style.display = 'none';
}
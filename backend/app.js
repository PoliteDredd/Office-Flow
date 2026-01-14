'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const { readDB, writeDB } = require('./db/dbHelper');
const { hashPassword, comparePassword, generateToken, authenticateToken, requireSuperAdmin, requireAdmin } = require('./utils/auth');

//Create instance of server
const app = express();

const PORT = 3000;

//Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

//register-form-api
app.post('/register-form-api', async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, companyCode, companyName, isCreatingCompany } = req.body;

        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Missing required fields', success: false });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format', success: false });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long', success: false });
        }

        if (confirmPassword !== password) {
            return res.status(400).json({ message: 'Passwords do not match', success: false });
        }

        const db = await readDB();

        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already registered', success: false });
        }

        let companyId;
        let role = 'user';
        let leaveBalance = { annual: 20, sick: 10 };

        if (isCreatingCompany) {
            if (!companyName) {
                return res.status(400).json({ message: 'Company name is required', success: false });
            }

            const generatedCompanyCode = companyName.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
            companyId = Date.now().toString();

            db.companies.push({
                id: companyId,
                name: companyName,
                companyCode: generatedCompanyCode,
                settings: {
                    annualLeaveBalance: 20,
                    sickLeaveBalance: 10,
                    departments: ['IT', 'HR', 'Maintenance', 'Finance', 'Operations'],
                    jobTitles: {
                        IT: ['Head of IT', 'IT Manager', 'Developer', 'System Administrator', 'IT Support'],
                        HR: ['Head of HR', 'HR Manager', 'HR Coordinator', 'Recruiter'],
                        Maintenance: ['Head of Maintenance', 'Maintenance Manager', 'Technician'],
                        Finance: ['Head of Finance', 'Finance Manager', 'Accountant', 'Financial Analyst'],
                        Operations: ['Head of Operations', 'Operations Manager', 'Coordinator']
                    }
                },
                createdAt: new Date().toISOString()
            });

            role = 'superadmin';
        } else {
            if (!companyCode) {
                return res.status(400).json({ message: 'Company code is required', success: false });
            }

            const company = db.companies.find(c => c.companyCode === companyCode);
            if (!company) {
                return res.status(400).json({ message: 'Invalid company code', success: false });
            }

            companyId = company.id;
            leaveBalance = {
                annual: company.settings.annualLeaveBalance,
                sick: company.settings.sickLeaveBalance
            };
        }

        const hashedPassword = await hashPassword(password);

        db.users.push({
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            fullName,
            role,
            jobTitle: role === 'superadmin' ? 'Head of IT' : 'Employee',
            department: role === 'superadmin' ? 'IT' : '',
            companyId,
            leaveBalance,
            createdAt: new Date().toISOString()
        });

        await writeDB(db);

        res.status(201).json({ message: `${fullName} successfully registered!`, success: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration', success: false });
    }
});

//login-form-api
app.post('/login-form-api', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required', success: false });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format', success: false });
        }

        const db = await readDB();
        const user = db.users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        const token = generateToken(user.id, user.companyId, user.role);

        res.status(200).json({ 
            message: 'Login successful!', 
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                jobTitle: user.jobTitle,
                department: user.department,
                companyId: user.companyId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', success: false });
    }
});

// ===== ADMIN REQUESTS API =====

// Request admin role
app.post('/api/request-admin', authenticateToken, async (req, res) => {
    try {
        const database = await readDB();
        const existingRequest = database.adminRequests.find(r => 
            r.userId === req.user.userId && r.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request', success: false });
        }

        const user = database.users.find(u => u.id === req.user.userId);

        database.adminRequests.push({
            id: Date.now().toString(),
            userId: req.user.userId,
            userName: user.fullName,
            userEmail: user.email,
            companyId: req.user.companyId,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        await writeDB(database);

        res.status(201).json({ message: 'Admin request submitted successfully', success: true });
    } catch (error) {
        console.error('Error creating admin request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Get admin requests
app.get('/api/admin-requests', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const database = await readDB();
        const requests = database.adminRequests.filter(r => 
            r.companyId === req.user.companyId && r.status === 'pending'
        );

        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Approve admin request
app.post('/api/admin-requests/:requestId/approve', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { userId } = req.body;

        const database = await readDB();
        const company = database.companies.find(c => c.id === req.user.companyId);
        const user = database.users.find(u => u.id === userId);
        const request = database.adminRequests.find(r => r.id === requestId);

        if (!user || !request) {
            return res.status(404).json({ message: 'User or request not found', success: false });
        }

        user.role = 'admin';
        user.department = company.settings.departments[0] || 'IT';
        user.jobTitle = 'Manager';

        request.status = 'approved';
        request.approvedAt = new Date().toISOString();

        await writeDB(database);

        res.status(200).json({ message: 'Admin request approved', success: true });
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Reject admin request
app.post('/api/admin-requests/:requestId/reject', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const database = await readDB();
        const request = database.adminRequests.find(r => r.id === req.params.requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found', success: false });
        }

        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();

        await writeDB(database);

        res.status(200).json({ message: 'Admin request rejected', success: true });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Create admin directly
app.post('/api/create-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { fullName, email, password, department, jobTitle } = req.body;

        const database = await readDB();

        if (database.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already exists', success: false });
        }

        const hashedPassword = await hashPassword(password);
        const company = database.companies.find(c => c.id === req.user.companyId);

        database.users.push({
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            fullName,
            role: 'admin',
            jobTitle,
            department,
            companyId: req.user.companyId,
            leaveBalance: {
                annual: company.settings.annualLeaveBalance,
                sick: company.settings.sickLeaveBalance
            },
            createdAt: new Date().toISOString()
        });

        await writeDB(database);

        res.status(201).json({ message: 'Admin created successfully', success: true });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// ===== COMPANY SETTINGS API (Super Admin Only) =====

// Get company settings (available to any authenticated user)
app.get('/api/company/settings', authenticateToken, async (req, res) => {
    try {
        const database = await readDB();
        const company = database.companies.find(c => c.id === req.user.companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company not found', success: false });
        }

        // Ensure leave balance keys exist so clients always receive the expected fields
        const settings = Object.assign({
            annualLeaveBalance: 0,
            sickLeaveBalance: 0,
            personalLeaveBalance: 0,
            emergencyLeaveBalance: 0,
            departments: [],
            jobTitles: {}
        }, company.settings || {});

        res.status(200).json({ 
            success: true,
            company: {
                id: company.id,
                name: company.name,
                companyCode: company.companyCode,
                settings
            }
        });
    } catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Update company settings
app.put('/api/company/settings', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { annualLeaveBalance, sickLeaveBalance, departments, jobTitles } = req.body;
        const database = await readDB();
        const company = database.companies.find(c => c.id === req.user.companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company not found', success: false });
        }

        if (annualLeaveBalance !== undefined) company.settings.annualLeaveBalance = annualLeaveBalance;
        if (sickLeaveBalance !== undefined) company.settings.sickLeaveBalance = sickLeaveBalance;
        if (departments) company.settings.departments = departments;
        if (jobTitles) company.settings.jobTitles = jobTitles;

        await writeDB(database);

        res.status(200).json({ message: 'Company settings updated successfully', success: true });
    } catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Get all users in company (Admin only)
app.get('/api/company/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const database = await readDB();
        const users = database.users
            .filter(u => u.companyId === req.user.companyId)
            .map(u => ({
                id: u.id,
                email: u.email,
                fullName: u.fullName,
                role: u.role,
                jobTitle: u.jobTitle,
                department: u.department,
                leaveBalance: u.leaveBalance,
                createdAt: u.createdAt
            }));

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Update user role (Super Admin only)
app.put('/api/users/:userId/role', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, jobTitle, department } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role', success: false });
        }

        const database = await readDB();
        const user = database.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        user.role = role;
        if (jobTitle) user.jobTitle = jobTitle;
        if (department) user.department = department;

        await writeDB(database);

        res.status(200).json({ message: 'User role updated successfully', success: true });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// ===== LEAVE REQUESTS API =====

// Create a leave request (users) - optionally deduct from balance immediately
app.post('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
        const { title, description, priority, leave, deduct } = req.body;

        const database = await readDB();
        if (!database.leaveRequests) database.leaveRequests = [];

        const user = database.users.find(u => u.id === req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found', success: false });

        const newRequest = {
            id: Date.now().toString(),
            userId: req.user.userId,
            userName: user.fullName,
            userEmail: user.email,
            companyId: req.user.companyId,
            title: title || 'Leave Request',
            description: description || '',
            priority: priority || 'Normal',
            category: 'HR',
            type: 'Leave',
            leave: leave || {},
            deduct: !!deduct,
            status: 'Pending',
            dateSubmitted: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // Persist request (do not deduct balances yet — deduction occurs on approval)
        database.leaveRequests.unshift(newRequest);

        await writeDB(database);

        res.status(201).json({ success: true, request: newRequest });
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Approve a leave request (admin/superadmin) — deduct balances and mark approved
app.post('/api/leave-requests/:requestId/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const database = await readDB();
        const request = database.leaveRequests.find(r => r.id === requestId && r.companyId === req.user.companyId);
        if (!request) return res.status(404).json({ message: 'Request not found', success: false });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request is not pending', success: false });

        // If this is a leave request and was marked to deduct, apply deduction
        if (request.type === 'Leave' && request.deduct && request.leave && request.leave.days) {
            const user = database.users.find(u => u.id === request.userId);
            if (!user) return res.status(404).json({ message: 'Request owner not found', success: false });

            const days = Number(request.leave.days) || 0;
            const type = (request.leave.leaveType || 'annual').toLowerCase();

            if (!user.leaveBalance) user.leaveBalance = {};
            if (user.leaveBalance.annual === undefined) user.leaveBalance.annual = 0;
            if (user.leaveBalance.sick === undefined) user.leaveBalance.sick = 0;
            if (user.leaveBalance.personal === undefined) user.leaveBalance.personal = 0;
            if (user.leaveBalance.emergency === undefined) user.leaveBalance.emergency = 0;

            if (type === 'sick') user.leaveBalance.sick = Math.max(0, user.leaveBalance.sick - days);
            else if (type === 'personal') user.leaveBalance.personal = Math.max(0, user.leaveBalance.personal - days);
            else if (type === 'emergency') user.leaveBalance.emergency = Math.max(0, user.leaveBalance.emergency - days);
            else user.leaveBalance.annual = Math.max(0, user.leaveBalance.annual - days);
        }

        request.status = 'Approved';
        request.approvedAt = new Date().toISOString();
        request.lastUpdated = new Date().toISOString();

        await writeDB(database);

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error('Error approving leave request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Reject a leave request (admin/superadmin)
app.post('/api/leave-requests/:requestId/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const database = await readDB();
        const request = database.leaveRequests.find(r => r.id === requestId && r.companyId === req.user.companyId);
        if (!request) return res.status(404).json({ message: 'Request not found', success: false });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request is not pending', success: false });

        request.status = 'Rejected';
        request.rejectedAt = new Date().toISOString();
        request.lastUpdated = new Date().toISOString();

        await writeDB(database);

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

// Get leave requests (users get their requests; admins get company requests)
app.get('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
        const database = await readDB();
        if (!database.leaveRequests) database.leaveRequests = [];

        let requests;
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            requests = database.leaveRequests.filter(r => r.companyId === req.user.companyId);
        } else {
            requests = database.leaveRequests.filter(r => r.userId === req.user.userId);
        }

        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});


//Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// Delete user (Super Admin only)
app.delete('/api/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const database = await readDB();
        
        const userIndex = database.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        
        const user = database.users[userIndex];
        if (user.role === 'superadmin') {
            return res.status(403).json({ message: 'Cannot delete super admin', success: false });
        }
        
        database.users.splice(userIndex, 1);
        await writeDB(database);
        
        res.status(200).json({ message: 'User deleted successfully', success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
});

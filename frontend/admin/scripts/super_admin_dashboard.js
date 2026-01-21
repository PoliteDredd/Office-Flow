let companySettings = null;
let allUsers = [];

function getToken() {
    return localStorage.getItem('authToken');
}

function checkAuth() {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.role) {
        window.location.href = '../../users/pages/login.html';
        return false;
    }
    
    if (user.role !== 'superadmin') {
        alert('Access denied. Super admin only.');
        window.location.href = '../../users/pages/login.html';
        return false;
    }
    
    return true;
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '../../users/pages/login.html';
}

function scrollToUsers(event) {
    event.preventDefault();
    document.getElementById('all-users').scrollIntoView({ behavior: 'smooth' });
}

async function loadData() {
    if (!checkAuth()) return;
    
    // Display user name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.fullName || 'Admin';
    
    await loadCompanySettings();
    await loadUsers();
    await loadAdminRequests();
    // Initialize profile dropdown quick-settings
    initProfileDropdownSettings();
}

async function loadCompanySettings() {
    const response = await fetch('http://localhost:3000/api/company/settings', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (data.success) companySettings = data.company.settings;
}

async function loadUsers() {
    const response = await fetch('http://localhost:3000/api/company/users', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (data.success) {
        allUsers = data.users;
        displayUsers();
    }
}

async function loadAdminRequests() {
    const response = await fetch('http://localhost:3000/api/admin-requests', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (data.success && data.requests.length > 0) {
        displayAdminRequests(data.requests);
    }
}

function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = allUsers.map(user => `
        <tr>
            <td>
                ${user.role !== 'superadmin' ? `<input type="checkbox" class="user-checkbox" value="${user.id}" onchange="updateBulkActions()">` : ''}
            </td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${user.department || '-'}</td>
            <td>${user.jobTitle || '-'}</td>
            <td>
                ${user.role !== 'superadmin' ? `
                    ${user.role === 'admin' ? `
                        <button class="btn-small btn-warning" onclick="demoteAdmin('${user.id}')" title="Remove Admin">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    ` : ''}
                    <button class="btn-small btn-danger" onclick="deleteUser('${user.id}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="text-muted">-</span>'}
            </td>
        </tr>
    `).join('');
}

function displayAdminRequests(requests) {
    const container = document.getElementById('adminRequests');
    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-info">
                <h3>${req.userName}</h3>
                <p>${req.userEmail}</p>
                <small>Requested: ${new Date(req.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="request-actions">
                <button class="btn-success" onclick="approveRequest('${req.id}', '${req.userId}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-danger" onclick="rejectRequest('${req.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function showCreateAdminModal() {
    const modal = document.getElementById('createAdminModal');
    modal.style.display = 'flex';
    populateDepartments();
}

function closeCreateAdminModal() {
    const modal = document.getElementById('createAdminModal');
    modal.style.display = 'none';
    document.getElementById('createAdminForm').reset();
}

function populateDepartments() {
    const select = document.getElementById('adminDepartment');
    select.innerHTML = companySettings.departments.map(dept => 
        `<option value="${dept}">${dept}</option>`
    ).join('');
    updateJobTitles();
}

document.getElementById('adminDepartment')?.addEventListener('change', updateJobTitles);

function updateJobTitles() {
    const dept = document.getElementById('adminDepartment').value;
    const select = document.getElementById('adminJobTitle');
    const titles = companySettings.jobTitles[dept] || [];
    const headTitles = titles.filter(t => t.includes('Head of') || t.includes('Manager'));
    select.innerHTML = headTitles.map(title => 
        `<option value="${title}">${title}</option>`
    ).join('');
}

document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3000/api/create-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            fullName: document.getElementById('adminFullName').value,
            email: document.getElementById('adminEmail').value,
            password: document.getElementById('adminPassword').value,
            department: document.getElementById('adminDepartment').value,
            jobTitle: document.getElementById('adminJobTitle').value
        })
    });
    const data = await response.json();
    alert(data.message);
    if (data.success) {
        closeCreateAdminModal();
        loadUsers();
    }
});

async function approveRequest(requestId, userId) {
    const response = await fetch(`http://localhost:3000/api/admin-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ userId })
    });
    const data = await response.json();
    alert(data.message);
    if (data.success) loadData();
}

async function rejectRequest(requestId) {
    const response = await fetch(`http://localhost:3000/api/admin-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    alert(data.message);
    if (data.success) loadData();
}

document.addEventListener('DOMContentLoaded', loadData);


function showTab(tabName, event) {
    event.preventDefault();
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        console.log('Hiding tab:', tab.id);
    });
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    console.log('Target tab:', targetTab);
    if (targetTab) {
        targetTab.classList.add('active');
        event.currentTarget.classList.add('active');
    }
    
    // Load data for settings tab
    if (tabName === 'settings') {
        loadCompanyInfo();
    }
}

async function loadCompanyInfo() {
    const response = await fetch('http://localhost:3000/api/company/settings', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (data.success) {
        document.getElementById('companyName').textContent = data.company.name;
        document.getElementById('companyCode').textContent = data.company.companyCode;
        document.getElementById('annualLeave').value = data.company.settings.annualLeaveBalance;
        document.getElementById('sickLeave').value = data.company.settings.sickLeaveBalance;
    }
}

document.getElementById('leaveBalanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3000/api/company/settings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            annualLeaveBalance: parseInt(document.getElementById('annualLeave').value),
            sickLeaveBalance: parseInt(document.getElementById('sickLeave').value)
        })
    });
    const data = await response.json();
    alert(data.message);
});


// Theme handling
document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const theme = e.target.value;
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('theme', theme);
    });
});

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}


function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile') && !e.target.closest('.profile-dropdown')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Helper to open a tab by name (used by dropdown quick actions)
function openTabByName(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) targetTab.classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const match = navItems.find(a => a.getAttribute('onclick') && a.getAttribute('onclick').includes(`showTab('${tabName}'`));
    if (match) match.classList.add('active');

    if (tabName === 'settings') loadCompanyInfo();
}

// Initialize the compact settings inside the profile dropdown
function initProfileDropdownSettings() {
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) return;

    // Theme radios
    document.querySelectorAll('input[name="sa-theme"]').forEach(r => {
        r.addEventListener('change', (e) => {
            const theme = e.target.value;
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
            } else if (theme === 'light') {
                document.body.classList.remove('dark-mode');
            } else {
                // auto -> remove explicit class and let app decide
                document.body.classList.remove('dark-mode');
            }
            localStorage.setItem('theme', theme);
            // close dropdown
            dropdown.classList.remove('show');
        });
    });

    // Quick action buttons
    document.getElementById('saGoToProfile')?.addEventListener('click', () => {
        dropdown.classList.remove('show');
        openTabByName('profile');
    });

    document.getElementById('saGoToSettings')?.addEventListener('click', () => {
        dropdown.classList.remove('show');
        openTabByName('settings');
    });

    document.getElementById('saLogoutBtn')?.addEventListener('click', () => {
        dropdown.classList.remove('show');
        logout();
    });

    // Apply saved theme selection in dropdown
    const saved = localStorage.getItem('theme') || 'light';
    const sel = document.querySelector(`input[name="sa-theme"][value="${saved}"]`);
    if (sel) sel.checked = true;
}


function toggleSelectAll(checkbox) {
    document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.checked = checkbox.checked;
    });
    updateBulkActions();
}

function updateBulkActions() {
    const selected = document.querySelectorAll('.user-checkbox:checked').length;
    const bulkBtn = document.getElementById('bulkRemoveBtn');
    if (bulkBtn) {
        bulkBtn.style.display = selected > 0 ? 'inline-flex' : 'none';
        bulkBtn.innerHTML = `<i class="fas fa-trash"></i> Remove Selected (${selected})`;
    }
}

async function demoteAdmin(userId) {
    if (!confirm('Remove admin privileges from this user?')) return;
    
    const response = await fetch(`http://localhost:3000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ role: 'user', jobTitle: 'Employee', department: '' })
    });
    const data = await response.json();
    alert(data.message);
    if (data.success) loadUsers();
}

async function deleteUser(userId) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();
    alert(data.message);
    if (data.success) loadUsers();
}

async function bulkRemoveAdmins() {
    const selected = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
    if (selected.length === 0) return;
    
    if (!confirm(`Remove admin privileges from ${selected.length} user(s)?`)) return;
    
    for (const userId of selected) {
        await demoteAdmin(userId);
    }
    
    document.getElementById('selectAll').checked = false;
    updateBulkActions();
}

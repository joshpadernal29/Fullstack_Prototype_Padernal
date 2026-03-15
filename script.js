let currentUser = null;
const STORAGE_KEY = "ipt_demo_v1";
const login_hash = ['#/userProfile', '#/request'];
const admin_hash = ['#/accounts', '#/employees', '#/departments'];

// --- CHANGED: Added Auth Header helper to retrieve token for API requests ---
function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// save window.db data to local storage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// load data from the local storage
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            window.db = JSON.parse(data);
        } else {
            throw new Error("No data");
        }
    } catch (e) {
        window.db = {
            accounts: [
                {
                    email: "admin@example.com",
                    password: "Password123!",
                    verified: true,
                    role: "admin",
                    Fname: "Admin",
                    Lname: "123"
                }
            ],
            departments: [
                { id: 1, name: "Engineering", description: "software team" },
                { id: 2, name: "HR", description: "Human resources" }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}
loadFromStorage(); // initialize db

function navigateTo(hash) {
    window.location.hash = hash;
}

// render profile when user navigates to profile
function renderProfile() {
    const NameDisplay = document.getElementById('nav-name-display');
    const profileClass = document.getElementById('profile-class');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');

    if (NameDisplay && currentUser) {
        NameDisplay.innerText = currentUser.Fname;
        profileClass.innerText = currentUser.role;
        profileName.innerText = currentUser.Fname + " " + currentUser.Lname;
        profileEmail.innerText = currentUser.email;
        profileRole.innerText = currentUser.role;
    }
}

// setAuthState for logged as user or admin etc...
function setAuthState(user) {
    currentUser = user;
    const body = document.body;
    body.classList.remove('not-authenticated', 'authenticated', 'is-admin');

    if (currentUser) {
        body.classList.add('authenticated');
        renderProfile();
        if (currentUser.role === 'admin') {
            body.classList.add('is-admin');
        }
    } else {
        body.classList.add('not-authenticated');
        // --- CHANGED: Clear sessionStorage instead of localStorage on logout ---
        sessionStorage.removeItem('authToken');
    }

    handleRouting();
}

function handleRouting() {
    const hash = window.location.hash || '#/';

    if ((login_hash.includes(hash) || admin_hash.includes(hash)) && !currentUser) {
        navigateTo('#/');
        return;
    }

    if (admin_hash.includes(hash) && currentUser && currentUser.role !== 'admin') {
        navigateTo('#/userProfile');
        return;
    }

    const pages = document.querySelectorAll(".page");
    const verifyAlert = document.getElementById("verified-alert");

    pages.forEach(page => page.classList.remove('active'));

    let sectionId;
    if (hash === '#/' || hash === '') {
        sectionId = "home-page";
    } else if (hash === '#/register') {
        sectionId = "register-page";
    } else if (hash.includes('#/login')) {
        sectionId = 'login-page';
    } else if (hash === '#/verify') {
        sectionId = 'verify-email';
    } else if (hash === '#/userProfile') {
        sectionId = 'profile';
    } else if (hash === '#/employees') {
        sectionId = 'employees';
        renderEmployees();
        populateDeptDropdown();
    } else if (hash === '#/departments') {
        sectionId = 'departments';
        renderDepartments();
    } else if (hash === '#/accounts') {
        sectionId = 'accounts';
        renderAccounts();
    } else if (hash === '#/request') {
        sectionId = 'requests';
        renderRequests();
    }

    if (verifyAlert) {
        verifyAlert.style.display = hash.includes('verified=true') ? 'block' : 'none';
    }

    const activePage = document.getElementById(sectionId);
    if (activePage) {
        activePage.classList.add('active');
    }
}

// --- CHANGED: Updated load event to check sessionStorage for the API token ---
window.addEventListener('load', () => {
    const token = sessionStorage.getItem('authToken');
    let found = null;

    if (token) {
        // Mocking token validation: Finding user in db whose email matches the token string
        found = window.db.accounts.find(acc => acc.email === token);
    }

    if (!window.location.hash || window.location.hash === "#") {
        window.location.replace("#/");
    }

    setAuthState(found);
});

window.addEventListener('hashchange', handleRouting);

// --- CHANGED: Replaced local registration with dummy function for now (keep as is if logic is frontend only) ---
function registration(event) {
    event.preventDefault();
    const inputFname = document.getElementById('fname').value;
    const inputLname = document.getElementById('lname').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;
    const regForm = document.getElementById('regFrom');

    const emailExist = window.db.accounts.some(acc => acc.email === inputEmail);
    if (emailExist) {
        alert("Email already Exists!");
    } else if (inputPassword.length < 6) {
        alert("Password Must be 6 or more characters!");
    } else {
        const newAccount = {
            Fname: inputFname,
            Lname: inputLname,
            email: inputEmail,
            password: inputPassword,
            verified: false,
            role: "user"
        };
        window.db.accounts.push(newAccount);
        regForm.reset();
        saveToStorage();
        localStorage.setItem('unverified_email', inputEmail);
        document.getElementById('showEmail').innerText = inputEmail;
        navigateTo('#/verify');
    }
}

// --- CHANGED: Replaced the old local login() with the async API fetch logic from Step 1 ---
async function login(event) {
    event.preventDefault();
    const userEmail = document.getElementById('loginEmail').value;
    const userPassword = document.getElementById('loginPassword').value;
    const loginForm = document.getElementById('loginForm');

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userEmail,
                password: userPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Step 1: Save token in sessionStorage
            sessionStorage.setItem('authToken', data.token);

            // Step 2: Use the user object returned by backend
            setAuthState(data.user);

            showLoginToast();
            loginForm.reset();
            navigateTo('#/userProfile');
            console.log("Login successful via API");
        } else {
            alert("Login failed: " + (data.error || "Invalid credentials"));
        }
    } catch (err) {
        alert("Network error! Is the backend server running at localhost:3000?");
    }
}

// --- CHANGED: Updated logout to clear the session token ---
function logout() {
    sessionStorage.removeItem('authToken');
    setAuthState(null);
    navigateTo('#/');
}

// --- CHANGED: Example function to test Step 2 (Protected Requests) ---
async function loadAdminDashboard() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/dashboard', {
            headers: getAuthHeader() // Step 2: Adds the Bearer Token automatically
        });

        if (res.ok) {
            const data = await res.json();
            // Assuming you have an element with ID 'content' to show this
            const contentDiv = document.getElementById('content');
            if (contentDiv) contentDiv.innerHTML = data.message;
        } else {
            alert("Access denied to dashboard!");
        }
    } catch (err) {
        console.error("Fetch error", err);
    }
}

// Remaining CRUD functions (unchanged)
function addAccount(event) {
    const accFname = document.getElementById('accFname').value;
    const accLname = document.getElementById('accLname').value;
    const accEmail = document.getElementById('accEmail').value;
    const accPassword = document.getElementById('accPassword').value;
    const accRole = document.getElementById('accRole').value;
    const isVerified = document.getElementById('isVerified').checked;

    const emailExist = window.db.accounts.some(acc => acc.email === accEmail);
    if (emailExist) {
        alert("Email already Exists!");
    } else if (accPassword.length < 6) {
        alert("Password Must be 6 or more characters!");
    } else {
        const newAccount = {
            Fname: accFname,
            Lname: accLname,
            email: accEmail,
            password: accPassword,
            verified: isVerified,
            role: accRole
        };
        window.db.accounts.push(newAccount);
        saveToStorage();
        renderAccounts();
        bootstrap.Modal.getInstance(document.getElementById('account-modal')).hide();
        document.getElementById('accountForm').reset();
    }
}

function verifyEmail() {
    const findEmail = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(acc => acc.email === findEmail);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem("unverified_email");
        navigateTo('#/login?verified=true');
    }
}

function showLoginToast() {
    const loginToast = document.getElementById('login-toast');
    if (loginToast) {
        const showToast = new bootstrap.Toast(loginToast, { autohide: true, delay: 1000 });
        showToast.show();
    }
}

function renderDepartments() {
    const tableBody = document.getElementById('department-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    window.db.departments.forEach((dept) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description || 'No description available'}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id})">Edit</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderAccounts() {
    const tableBody = document.getElementById('account-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    window.db.accounts.forEach((acc, index) => {
        const isSelf = currentUser && acc.email === currentUser.email;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${acc.Fname} ${acc.Lname}<br><small class="text-muted">${acc.email}</small></td>
            <td><span class="badge bg-secondary">${acc.role}</span></td>
            <td>${acc.verified ? '<span class="text-success">&#9989;</span>' : '<span class="text-danger">&#x2715;</span>'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="openEditAccount('${acc.email}')">Edit</button>
                    <button class="btn btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset Password</button>
                    <button class="btn btn-outline-danger" ${isSelf ? 'disabled' : ''} onclick="deleteAccount('${acc.email}')">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderEmployees() {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    window.db.employees.forEach(emp => {
        const account = window.db.accounts.find(a => a.email === emp.userEmail);
        const dept = window.db.departments.find(d => d.id == emp.deptId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td><b>${account ? account.Fname + ' ' + account.Lname : 'Unknown'}</b><br><small class="text-muted">${emp.userEmail}</small></td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : 'N/A'}</td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.employeeId}')">Remove</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function populateDeptDropdown() {
    const deptSelect = document.getElementById('employeeDepartment');
    if (!deptSelect) return;
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    window.db.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.id;
        opt.textContent = dept.name;
        deptSelect.appendChild(opt);
    });
}

function getStatusBadge(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}

window.renderRequests = function () {
    const userView = document.getElementById('user-request-view');
    const adminView = document.getElementById('admin-request-view');
    const emptyView = document.getElementById('empty-request-view');
    const tableView = document.getElementById('table-request-view');
    const userTable = document.getElementById('user-request-table');
    const adminTable = document.getElementById('admin-request-table');
    const hideRequest = document.getElementById('request-add');

    if (!currentUser) return;

    if (currentUser.role === 'admin') {
        if (userView) userView.style.display = 'none';
        if (adminView) adminView.style.display = 'block';
        if (hideRequest) hideRequest.style.display = 'none';
        const allRequests = window.db.requests || [];
        if (adminTable) {
            adminTable.innerHTML = '';
            allRequests.forEach(req => {
                const badge = getStatusBadge(req.status);
                const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');
                adminTable.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td><small>${req.employeeEmail}</small></td>
                        <td>${req.date}</td>
                        <td>${req.type}</td>
                        <td>${items}</td>
                        <td><span class="badge ${badge}">${req.status}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-success" onclick="processRequest(${req.id}, 'Approved')" ${req.status !== 'Pending' ? 'disabled' : ''}>Approve</button>
                                <button class="btn btn-danger" onclick="processRequest(${req.id}, 'Rejected')" ${req.status !== 'Pending' ? 'disabled' : ''}>Reject</button>
                            </div>
                        </td>
                    </tr>`);
            });
        }
    } else {
        if (adminView) adminView.style.display = 'none';
        if (userView) userView.style.display = 'block';
        const userRequest = (window.db.requests || []).filter(r => r.employeeEmail === currentUser.email);
        if (userRequest.length === 0) {
            if (emptyView) emptyView.style.display = 'block';
            if (tableView) tableView.style.display = 'none';
        } else {
            if (emptyView) emptyView.style.display = 'none';
            if (tableView) tableView.style.display = 'block';
            if (hideRequest) hideRequest.style.display = 'block';
            if (userTable) {
                userTable.innerHTML = '';
                userRequest.forEach(req => {
                    const badge = getStatusBadge(req.status);
                    const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');
                    userTable.insertAdjacentHTML('beforeend', `<tr><td>${req.date}</td><td>${req.type}</td><td>${items}</td><td><span class="badge ${badge}">${req.status}</span></td></tr>`);
                });
            }
        }
    }
};
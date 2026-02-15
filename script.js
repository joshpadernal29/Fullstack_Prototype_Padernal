let currentUser = null;
const STORAGE_KEY = "ipt_demo_v1";
const login_hash = ['#/userProfile', '#/request'];
const admin_hash = ['#/accounts', '#/employees', '#/departments'];

// save windwo.db data to local storage
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
        // default data
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

// render profile whne use navigates to profile
function renderProfile() {
    const NameDisplay = document.getElementById('nav-name-display');
    const profileClass = document.getElementById('profile-class');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');

    if (NameDisplay) {
        NameDisplay.innerText = currentUser.Fname; // put user name in the navigation bar
        profileClass.innerText = currentUser.role;
        profileName.innerText = currentUser.Fname + " " + currentUser.Lname;
        profileEmail.innerText = currentUser.email;
        profileRole.innerText = currentUser.role;
    }

}


// setAuthState for logged as user or admin etc...
function setAuthState(user) {
    currentUser = user;
    // remove body class
    const body = document.body;
    body.classList.remove('not-authenticated', 'authenticated', 'is-admin');


    // if user log in
    if (currentUser) {
        // if current user = true
        body.classList.add('authenticated');
        renderProfile(); // render current user profile
        // if current user = admin add .is-admin
        if (currentUser.role === 'admin') {
            body.classList.add('is-admin')
        }
    } else {
        body.classList.add('not-authenticated');
        localStorage.removeItem('auth_token');
    }

    handleRouting();
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    console.log("location:" + hash);

    // cant access other pages without login
    if ((login_hash.includes(hash) || admin_hash.includes(hash)) && !currentUser) {
        navigateTo('#/');
        return;
    }

    // cant acces admin pages if not admin role
    if (admin_hash.includes(hash) && currentUser.role !== 'admin') {
        navigateTo('#/userProfile');
        return;
    }


    // select pages
    const pages = document.querySelectorAll(".page");
    // select the alert class
    const verifyAlert = document.getElementById("verified-alert") // only show when email is verified

    // hide pages
    pages.forEach(page => page.classList.remove('active'));

    // switch between section id
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

    // show only when done with email verification
    // check if the hash includes a query string before displaying the alert
    if (verifyAlert) {
        if (hash.includes('verified=true')) {
            verifyAlert.style.display = 'block';
        } else {
            verifyAlert.style.display = 'none';
        }
    }

    // show page
    const activePage = document.getElementById(sectionId);
    if (activePage) {
        activePage.classList.add('active'); // add active to the class
    }
}
// to stop being loged out incase of refresh
window.addEventListener('load', () => {
    const token = localStorage.getItem('auth_token');
    let found = null;

    if (token) {
        found = window.db.accounts.find(acc => acc.email === token);
    }

    if (!window.location.hash || window.location.hash === "#") {
        window.location.replace("#/");
    }

    setAuthState(found);
});
window.addEventListener('hashchange', handleRouting);

// Authentication
function registration(event) {
    event.preventDefault();
    // get input data
    const inputFname = document.getElementById('fname').value;
    const inputLname = document.getElementById('lname').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;

    // check if email already exist in window.db.accounts
    const emailExist = window.db.accounts.some(acc => acc.email === inputEmail);
    // check if email already exists
    if (emailExist) {
        alert("Email already Exists!");
    } else {
        // save new account 
        const newAccount = {
            Fname: inputFname,
            Lname: inputLname,
            email: inputEmail,
            password: inputPassword,
            verified: false,
            role: "user" // default
        };

        console.log("account pushed:" + inputEmail);
        window.db.accounts.push(newAccount);

        //save to local storage
        saveToStorage();
        localStorage.setItem('unverified_email', inputEmail);

        let userEmail = document.getElementById('email').value;
        document.getElementById('showEmail').innerText = inputEmail;
        navigateTo('#/verify');
    }
}

// verify email
function verifyEmail() {
    const findEmail = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(acc => acc.email === findEmail);

    // set the email verified to true
    if (user) {
        user.verified = true;

        // save to local storage
        saveToStorage();
        localStorage.removeItem("unverified_email"); // remove the temp unvrified email
        console.log("Account verified:" + findEmail);

        navigateTo('#/login?verified=true');
    }
}


// login account
function login(event) {
    event.preventDefault();
    // get user input
    const userEmail = document.getElementById('loginEmail').value;
    const userPassword = document.getElementById('loginPassword').value;

    // find email + password and verified in the storage and compare
    const findAccount = window.db.accounts.find(acc =>
        acc.email === userEmail &&
        acc.password === userPassword &&
        acc.verified === true
    );

    if (findAccount) {
        // Save auth_token = email in localStorage
        localStorage.setItem('auth_token', findAccount.email);

        // Call `setAuthState(account) = true ,user
        setAuthState(findAccount);

        navigateTo('#/userProfile');
        console.log("Login successful");
    } else {
        alert("Invalid Email and password!");
    }
}

// logout function
function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(null);
    navigateTo('#/');
}

// edit profile
function editProfile() {
    alert("changed to Edit profile page!");
}

// read department table
function renderDepartments() {
    const tableBody = document.getElementById('department-table-body');
    if (!tableBody) return;

    // Clear existing static rows
    tableBody.innerHTML = '';

    // Loop through window.db.departments
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

// render accounts
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
                    <button class="btn btn-outline-primary" data-bs-toggle="modal"
                        data-bs-target="#account-modal")" onclick="openEditAccount('${acc.email}')">Edit</button>
                    <button class="btn btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset Password</button>
                    <button class="btn btn-outline-danger" ${isSelf ? 'disabled' : ''} onclick="deleteAccount('${acc.email}')">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// edit & and populate account
let editingEmail = null;

window.openEditAccount = function (email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) return;

    editingEmail = email; // Mark as editing

    // Fill inputs using IDs from your HTML
    document.getElementById('accFname').value = acc.Fname;
    document.getElementById('accLname').value = acc.Lname;
    document.getElementById('accEmail').value = acc.email;
    document.getElementById('accEmail').readOnly = true; // Email is the unique key
    document.getElementById('accPassword').value = acc.password;
    document.getElementById('accRole').value = acc.role;
    document.getElementById('isVerified').checked = !!acc.verified;

    // Change Modal UI
    document.querySelector('#account-modal .modal-title').innerText = "Edit Account";

    // Show Modal manually (stop hanging)
    const modalEl = document.getElementById('account-modal');
    const modalInst = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInst.show();
};

// password reset(account)
window.resetPassword = function (email) {
    // Ask for the new password
    const newPw = prompt(`Enter new password for ${email} (Minimum 6 characters):`);

    // If user clicks "Cancel", newPw will be null
    if (newPw === null) return;

    // Validation
    if (newPw.trim().length < 6) {
        alert("Error: Password is too short! It must be at least 6 characters.");
    } else {
        // 4. Find account and update
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPw;
            saveToStorage(); // Sync with localStorage
            alert("Password updated successfully!");
        }
    }
};

// delete account (account)
window.deleteAccount = function (email) {
    // 1. Prevent self-deletion (Double Check)
    if (currentUser && email === currentUser.email) {
        alert("You cannot delete your own account while logged in.");
        return;
    }

    // Confirm action
    const confirmed = confirm(`Are you sure you want to permanently delete the account: ${email}?`);

    if (confirmed) {
        //  Filter out the account
        window.db.accounts = window.db.accounts.filter(acc => acc.email !== email);

        //  Save and Update
        saveToStorage();
        renderAccounts();
        alert("Account deleted.");
    }
};

// render employees
function renderEmployees() {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    window.db.employees.forEach(emp => {
        // Join data from accounts and departments
        const account = window.db.accounts.find(a => a.email === emp.userEmail);
        const dept = window.db.departments.find(d => d.id == emp.deptId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>
                <b>${account ? account.Fname + ' ' + account.Lname : 'Unknown'}</b><br>
                <small class="text-muted">${emp.userEmail}</small>
            </td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.employeeId}')">Remove</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// POPULATE DEPT DROPDOWN
function populateDeptDropdown() {
    const deptSelect = document.getElementById('employeeDepartment');
    if (!deptSelect) return;
    // loop through the departments db to get departments
    window.db.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.id;
        opt.textContent = dept.name;
        deptSelect.appendChild(opt);
    });
}

// FORM Empoyee
window.saveEmployee = function () {
    // get values from the input
    const empId = document.getElementById('employeeId').value;
    const email = document.getElementById('employeeEmail').value;
    const pos = document.getElementById('employeePosition').value;
    const dept = document.getElementById('employeeDepartment').value;
    const hireDate = document.getElementById('hire-date')?.value || "";

    if (!empId || !email || !pos || !dept || !hireDate) {
        alert("Please fill in all required fields.");
        return;
    }

    // 3. Validation: Check if the User Email exists in accounts
    const accountExists = window.db.accounts.some(acc => acc.email === email);
    if (!accountExists) {
        alert("Error: No account found with this email. Create the account first.");
        return;
    }

    // 4. Create the new Employee object
    const newEmp = {
        employeeId: empId,
        userEmail: email,
        position: pos,
        deptId: dept,
        hireDate: hireDate
    };

    // Save to database
    window.db.employees.push(newEmp);
    saveToStorage();
    renderEmployees();

    //Close Modal and Reset Form
    const modalEl = document.getElementById('employee-modal');
    const modalInst = bootstrap.Modal.getInstance(modalEl);
    if (modalInst) modalInst.hide();

    document.getElementById('employeeForm').reset();
    alert("Employee saved successfully!");
};

// DELETE EMPLOYEE
window.deleteEmployee = function (id) {
    if (confirm("Permanently remove this employee record?")) {
        window.db.employees = window.db.employees.filter(e => e.employeeId !== id);
        saveToStorage();
        renderEmployees();
    }
};

// for status badges
function getStatusBadge(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}

// render request page
window.renderRequests = function () {
    const userView = document.getElementById('user-request-view');
    const adminView = document.getElementById('admin-request-view');
    const emptyView = document.getElementById('empty-request-view');
    const tableView = document.getElementById('table-request-view');
    const userTable = document.getElementById('user-request-table');
    const adminTable = document.getElementById('admin-request-table');
    const hideRequest = document.getElementById('request-add');

    if (!emptyView || !tableView || !currentUser) return;
    // Admin view
    if (currentUser.role === 'admin') {
        userView.style.display = 'none';
        adminView.style.display = 'block';
        hideRequest.style.display = 'none';

        const allRequests = window.db.requests || [];
        adminTable.innerHTML = '';

        allRequests.forEach(req => {
            const badge = getStatusBadge(req.status);
            const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');

            const row = `<tr>
                <td><small>${req.employeeEmail}</small></td>
                <td>${req.date}</td>
                <td>${req.type}</td>
                <td>${items}</td>
                <td><span class="badge ${badge}">${req.status}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success" onclick="processRequest(${req.id}, 'Approved')" 
                            ${req.status !== 'Pending' ? 'disabled' : ''}>Approve</button>
                        <button class="btn btn-danger" onclick="processRequest(${req.id}, 'Rejected')" 
                            ${req.status !== 'Pending' ? 'disabled' : ''}>Reject</button>
                    </div>
                </td>
            </tr>`;
            adminTable.insertAdjacentHTML('beforeend', row);
        });
    } else {
        // user view
        adminView.style.display = 'none';
        userView.style.display = 'block';

        const userRequest = (window.db.requests || []).filter(request => request.employeeEmail === currentUser.email);

        if (userRequest.length === 0) {
            emptyView.style.display = 'block';
            tableView.style.display = 'none';
        } else {
            emptyView.style.display = 'none';
            tableView.style.display = 'block';
            userTable.innerHTML = '';

            userRequest.forEach(req => {
                const badge = getStatusBadge(req.status);
                const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');
                const row = `<tr>
                    <td>${req.date}</td>
                    <td>${req.type}</td>
                    <td>${items}</td>
                    <td><span class="badge ${badge}">${req.status}</span></td>
                </tr>`;
                userTable.insertAdjacentHTML('beforeend', row);
            });
        }
    }
};

// Admin:Approve/Reject
window.processRequest = function (id, newStatus) {
    const req = window.db.requests.find(request => request.id === id);
    if (req) {
        req.status = newStatus;
        saveToStorage();
        renderRequests();
    }
};

// dynamic item row
window.addRequestItemRow = function () {
    const container = document.getElementById('dynamic-items-container');
    const rowId = Date.now();
    // insert request item
    const html = `
        <div class="row g-2 mb-2 align-items-center" id="row-${rowId}">
            <div class="col-8">
                <input type="text" class="form-control form-control-sm item-name" placeholder="Item Name" required>
            </div>
            <div class="col-3">
                <input type="number" class="form-control form-control-sm item-qty" value="1" min="1">
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn-close" style="font-size:0.6rem" onclick="document.getElementById('row-${rowId}').remove()"></button>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
};

window.openRequestModal = function () {
    const container = document.getElementById('dynamic-items-container');
    container.querySelectorAll('.row').forEach(row => row.remove());

    addRequestItemRow();

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('request-modal'));
    modal.show();
};

// request submit
const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const names = document.querySelectorAll('.item-name');
        const qtys = document.querySelectorAll('.item-qty');
        const items = [];

        names.forEach((input, i) => {
            if (input.value.trim() !== "") {
                items.push({ name: input.value.trim(), qty: qtys[i].value });
            }
        });

        if (items.length === 0) return alert("Please add at least one item.");

        const newRequest = {
            id: Date.now(),
            type: document.getElementById('requestType').value,
            items: items,
            status: "Pending",
            date: new Date().toLocaleDateString(),
            employeeEmail: currentUser.email
        };

        if (!window.db.requests) window.db.requests = [];
        window.db.requests.push(newRequest);

        saveToStorage();
        renderRequests();

        bootstrap.Modal.getInstance(document.getElementById('request-modal')).hide();
        this.reset();
    });
}
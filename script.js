let currentUser = null;
const STORAGE_KEY = "ipt_demo_v1";

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
            employees: [

            ]
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
        //renderEmployees();
    } else if (hash === '#/departments') {
        sectionId = 'departments';
        renderDepartments();
    } else if (hash === '#/accounts') {
        sectionId = 'accounts';
        renderAccounts();
    } else if (hash === '#/request') {
        sectionId = 'requests';
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
    navigateTo('#/login');
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
                    <button class="btn btn-outline-warning" onclick="resetPassword('${acc.email}')">PW</button>
                    <button class="btn btn-outline-danger" ${isSelf ? 'disabled' : ''} onclick="deleteAccount('${acc.email}')">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// edit account
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

    // Show Modal manually (prevents hanging)
    const modalEl = document.getElementById('account-modal');
    const modalInst = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInst.show();
};



// render employees
function renderEmployees() {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    window.db.employees.forEach((emp) => {
        const user = window.db.accounts.find(acc => acc.email === emp.userEmail);
        const dept = window.db.departments.find(dept => dept.id == emp.deptId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${user ? user.Fname + ' ' + user.Lname : emp.userEmail}</td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.employeeId}')">Delete</button>
            </td>`;
        tableBody.appendChild(row);
    });
}
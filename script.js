let currentUser = null;

function navigateTo(hash) {
    window.location.hash = hash;
}

// update body for logged as user or admin etc...
function updateBody() {
    const body = document.body;

    // remove body class
    body.classList.remove('not-authenticated', 'authenticated', 'is-admin');

    // if user log in
    if (currentUser) {
        // if current user = true
        body.classList.add('authenticated');
        // if current user = admin add .is-admin
        if (currentUser.role === 'admin') {
            body.classList.add('is-admin')
        }
    } else {
        body.classList.add('not-authenticated');
    }
}

// setAuthstate
function setAuthState(user) {
    currentUser = user;
    updateBody();
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

    if (token) {
        const found = window.db.accounts.find(acc => acc.email === token);
        if (found) {
            currentUser = found;
        }
    }

    updateBody();
    handleRouting();
});
window.addEventListener('hashchange', handleRouting);

// Authentication

window.db = {
    // intialize temp db
    accounts: JSON.parse(localStorage.getItem('accounts')) || []
};

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
        localStorage.setItem('accounts', JSON.stringify(window.db.accounts));
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
        localStorage.setItem("accounts", JSON.stringify(window.db.accounts));
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
    }
}

// logout function
function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(null);
    navigateTo('#/login');
}




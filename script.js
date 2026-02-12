let currentUser = null;

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash;
    console.log("location:" + hash);
    // select pages
    const pages = document.querySelectorAll(".page");

    // hide pages
    for (let i = 0; i < pages.length; i++) {
        pages[i].style.display = 'none';
    }

    // switch between section id
    let sectionId;
    if (hash === '#/' || hash === '') {
        sectionId = "home-page";
    } else if (hash === '#/register') {
        sectionId = "register-page";
    } else if (hash === '#/login') {
        sectionId = 'login-page';
    } else if (hash === '#/verify') {
        sectionId = 'verify-email';
    }


    // show page
    const activePage = document.getElementById(sectionId);
    if (activePage) {
        activePage.style.display = 'block';
    }
}
// set to default home page
window.addEventListener('load', () => {
    // If the URL is empty, set it to home page
    if (!window.location.hash || window.location.hash === "#") {
        window.location.replace("#/");
    }

    handleRouting();
});
window.addEventListener('hashchange', handleRouting);

// Authentication
// temp db
window.db = {
    accounts: []
};

function registration(event) {
    // check if email already exist in window.db.accounts
    const emailExist = window.db.accounts.some(acc => acc.email === email);
    event.preventDefault();

    // get input data
    const inputFname = document.getElementById('fname').value;
    const inputLname = document.getElementById('lname').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;

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
            verified: false
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


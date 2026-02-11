let currentUser = null;

function navigateTo(hash) {
    window.location.hash;
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
    if (hash === '#/') {
        sectionId = "home-page";
    } else if (hash === '#/register') {
        sectionId = "register-page";
    } else if (hash === '#/login') {
        sectionId = 'login-page';
    }

    // show page
    const activePage = document.getElementById(sectionId);
    if (activePage) {
        activePage.style.display = 'block';
    }
}

window.addEventListener('hashchange', handleRouting);


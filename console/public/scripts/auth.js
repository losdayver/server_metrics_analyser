function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const cookieValue = getCookie("auth");

if (!cookieValue && window.location.pathname != "/diploma/views-authenticate") {
    window.location.href = CONSOLE_URL + "views-authenticate";
}
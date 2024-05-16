function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


// Set a cookie
//document.cookie = "auth=very-secret-password; expires=Thu, 18 Dec 2025 12:00:00 UTC; path=/diploma/";
const cookieValue = getCookie("auth");

if (!cookieValue && window.location.pathname != "/diploma/views-authenticate") {
    window.location.href = CONSOLE_URL + "views-authenticate";

    //window.location.replace(CONSOLE_URL + "views-authenticate");
}
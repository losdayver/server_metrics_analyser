// Authentication middleware
const authMiddleware = (req, res, next) => {
    // Get the 'auth' cookie
    const authCookie = req.cookies.auth;

    if (authCookie) {
        // Verify the cookie value against the secret key
        const isAuthenticated = authCookie === "temp-session";

        if (isAuthenticated) {
            next();
        } else {
            // Invalid cookie value
            return res.status(401).send("Invalid authentication cookie");
        }
    } else {
        // No authentication cookie found
        return res.status(401).send("Invalid authentication cookie");
    }
};

export { authMiddleware };
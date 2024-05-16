// Authentication middleware
const authMiddleware = (req, res, next) => {
    // Get the 'auth' cookie
    const authCookie = req.cookies.auth;

    if (authCookie) {
        console.log("found auth cookie", authCookie);
        // Verify the cookie value against the secret key
        const isAuthenticated = authCookie === SECRET_KEY;

        if (isAuthenticated) {
            // User is authenticated
            next();
        } else {
            // Invalid cookie value
            next();
            console.log(123);
            //return res.status(401).json({ message: 'Invalid authentication cookie' });
        }
    } else {
        // No authentication cookie found
        next();
        console.log(321);
        //return res.status(401).json({ message: 'Authentication cookie missing' });
    }
};

export { authMiddleware };
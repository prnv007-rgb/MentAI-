// middle.js
const jwt = require("jsonwebtoken");
const { UserModel, ClientModel } = require("./models");
const JWT_SECRET = "abc123"; // Move to .env in production

// Middleware to verify JWT and load user
async function middle(req, res, next) {
    const token = req.headers.token; // You can also use req.headers.authorization

    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check in both collections
        let user = await UserModel.findOne({ username: decoded.username });
        if (!user) {
            user = await ClientModel.findOne({ username: decoded.username });
        }

        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        req.user = user;
        req.tokenPayload = decoded; // So we can check role later
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

// Middleware for admin-only routes
function adminOnly(req, res, next) {
    if (req.tokenPayload?.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Admins only" });
}

module.exports = { middle, adminOnly };

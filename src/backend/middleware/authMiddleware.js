import jwt from "jsonwebtoken";

const JWT_DEFAULT_SECRET = "super_secret_jwt_key_job_tracker_pro_2026";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  const secret = process.env.JWT_SECRET || JWT_DEFAULT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token is invalid, expired, or tampered" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role unauthorized. Required roles: ${roles.join(", ")}. Received: ${req.user.role}`,
      });
    }

    next();
  };
};

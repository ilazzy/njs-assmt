import jwt from "jsonwebtoken";
import models from "../models/index.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and include their role
      req.user = await models.User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
        include: [{ model: models.Role, as: "role" }],
      });

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      req.user.roleName = req.user.role.role_name;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default protect;

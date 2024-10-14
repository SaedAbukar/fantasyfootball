const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If there's no auth header or it doesn't start with "Bearer", return 401
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  // Extract the token part from the header
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token and extract the user payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID to the request object
    req.user = decoded;
    next();
  } catch (error) {
    // If there's an error (invalid token), return a 401 response
    console.log("Token Verification Error: ", error.message); // Log any verification errors
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;

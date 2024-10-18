require("dotenv").config();
const connectDB = require("../backend/src/config/db");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
// const authRoutes = require("./src/routes/authRouter");
const adminRoutes = require("./src/routes/adminRouter");
const userRoutes = require("./src/routes/userRouter");
const teamRoutes = require("./src/routes/teamRouter");
const gameWeekRoutes = require("./src/routes/gameWeekRouter");
const fixtureRoutes = require("./src/routes/fixtureRouter");
const playerRoutes = require("./src/routes/footballRouter");
const futsalRoutes = require("./src/routes/futsalRouter");
const {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} = require("./src/middleware/customMiddleware");
const statusMonitor = require("express-status-monitor");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger/swagger.yaml"); // Load the YAML file

const path = require("path");

const app = express();

app.use(
  cors({
    origin: "https://jobscout-frontend.onrender.com", // Allowing the Frontend to interact with backend
  })
);

app.use(helmet()); // Adding Helmet for security

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs. Currently per 15min
  message: "Too many requests, please try again later.",
});

app.use(express.json());

app.use(statusMonitor());
app.use(morgan("dev"));

connectDB();

// Routers
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/gameweek", gameWeekRoutes);
app.use("/api/fixtures", fixtureRoutes);
app.use("/api/football", playerRoutes);
app.use("/api/futsal", futsalRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Example route that throws an error
app.get("/error", (req, res, next) => {
  // Trigger an error
  const error = new Error("Something went wrong!");
  next(error);
});

app.get("/", (req, res) => {
  res.json({ message: "API is Running!" });
});

// Use the unknownEndpoint middleware for handling undefined routes
app.use(unknownEndpoint);
// Use the errorHandler middleware for handling errors
app.use(errorHandler);

module.exports = app;

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// ✅ Configure CORS properly
app.use(cors({
  origin: "http://localhost:5173", // React frontend URL
  credentials: true               // ✅ Allow cookies and Authorization headers
}));

app.use(express.json());
app.use(cookieParser());

// Import routes
const studentsRoute = require("./routes/students");
const staffRoute = require("./routes/staff");
const authRoute = require("./routes/auth");

// Mount routes
app.use("/staff", staffRoute);
app.use("/auth", authRoute);
app.use("/students", studentsRoute);

app.listen(5001, () => console.log("✅ Library Server running on port 5001"));

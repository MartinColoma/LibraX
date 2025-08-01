const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const studentsRoute = require("./routes/students");

// Mount routes
app.use("/students", studentsRoute);

app.listen(5001, () => console.log("✅ Library Server running on port 5001"));

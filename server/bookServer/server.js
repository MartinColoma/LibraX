const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Add this line for cookie parsing

// Import routes
const addbooks = require("./routes/add_book");
const categories = require("./routes/categories");
const authors = require("./routes/authors");

// Mount routes
app.use("/add_book", addbooks);
app.use("/categories", categories);
app.use("/authors", authors);

app.listen(5000, () => console.log("✅ Book Server running on port 5000"));
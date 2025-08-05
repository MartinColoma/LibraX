const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const booksRoute = require("./routes/books");

// Mount routes
app.use("/books", booksRoute);

app.listen(5000, () => console.log("✅ Book Server running on port 5000"));

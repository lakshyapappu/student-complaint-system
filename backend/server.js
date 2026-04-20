const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/student_complaint_system";

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/complaints", complaintRoutes);

const projectRoot = path.join(__dirname, "..");
app.use(express.static(projectRoot));

app.get("/", (req, res) => {
  res.redirect("/frontend/login.html");
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch complaints.", error: error.message });
  }
});

module.exports = router;

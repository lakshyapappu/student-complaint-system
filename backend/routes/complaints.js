const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

// ✅ GET ALL COMPLAINTS
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch complaints." });
  }
});

// ✅ CREATE COMPLAINT
router.post("/", async (req, res) => {
  try {
    const { category, description, userId } = req.body;

    const complaint = await Complaint.create({
      category,
      description,
      userId,
      status: "Pending",
      votes: 0
    });

    res.json({ message: "Complaint submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit complaint." });
  }
});

// ✅ GET USER COMPLAINTS
router.get("/user/:id", async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.params.id });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user complaints." });
  }
});

// ✅ VOTE
router.put("/:id/vote", async (req, res) => {
  try {
    const { value } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    complaint.votes += value;

    await complaint.save();

    res.json({ message: "Vote updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update vote." });
  }
});

// ✅ UPDATE STATUS (ADMIN)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    complaint.status = status;
    complaint.remarks = remarks;

    await complaint.save();

    res.json({ message: "Complaint updated." });
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint." });
  }
});

// ✅ DELETE (WITHDRAW)
router.delete("/:id", async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Complaint deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete complaint." });
  }
});

module.exports = router;
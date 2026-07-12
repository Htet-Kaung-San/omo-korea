const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(__dirname, "../data/memory_db.json");

// Helper to ensure file exists
const readMemoryDb = () => {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify({}));
    }
    const data = fs.readFileSync(MEMORY_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading memory db:", err);
    return {};
  }
};

const writeMemoryDb = (data) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing memory db:", err);
  }
};

exports.getMemory = async (req, res) => {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const db = readMemoryDb();
    const memoryProfile = db[studentId] || "";

    res.json({ success: true, data: memoryProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get memory" });
  }
};

exports.updateMemory = async (req, res) => {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { memory } = req.body;
    if (typeof memory !== "string") {
      return res.status(400).json({ success: false, message: "Memory must be a string" });
    }

    const db = readMemoryDb();
    db[studentId] = memory;
    writeMemoryDb(db);

    res.json({ success: true, message: "Memory updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update memory" });
  }
};

exports.getMemoryForContext = (studentId) => {
  if (!studentId) return "";
  const db = readMemoryDb();
  return db[studentId] || "";
};

require("dotenv").config();
const express = require("express");
const studentRoutes = require("./routes/studentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const busRoutes = require("./routes/busRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("public"));

app.use("/api/students", studentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/bus", busRoutes);

// Register the error handler AFTER all routes
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Hey! PNU backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;

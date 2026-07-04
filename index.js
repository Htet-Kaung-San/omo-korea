require('dotenv').config();
const express = require('express');
const studentRoutes = require('./routes/studentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const errorHandler = require('./middleware/errorHandler'); // 1. Import the global error handler

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/students', studentRoutes);
app.use('/api/ai', aiRoutes);

// 2. CRITICAL: Register the error handler AFTER all routes, but BEFORE app.listen
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Hey! PNU backend running on http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/students', studentRoutes);

app.listen(PORT, () => {
  console.log(`Hey! PNU backend running on http://localhost:${PORT}`);
});

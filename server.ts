import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/auth/auth.routes';
import pool from './config/db';

dotenv.config();

const app = express();
app.use(express.json());

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

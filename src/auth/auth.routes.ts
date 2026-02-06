import { Router } from 'express';
import { AuthService } from './auth.service';

const router = Router();
const authService = new AuthService();

router.post('/google', async (req, res) => {
  try {
    const { token, role } = req.body;

    const result = await authService.googleAuth(token, role);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

export default router;

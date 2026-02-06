import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';
import { UserRole } from '../users/user.types';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  async googleAuth(token: string, role: UserRole) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new Error('Invalid Google token');
    }

    const { email, name, picture } = payload;

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user
      const insert = await pool.query(
        `INSERT INTO users (email, name, role, avatar)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [email, name, role, picture]
      );

      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return { accessToken, user };
  }
}

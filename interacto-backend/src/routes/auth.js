import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken, requireAuth } from '../lib/auth.js';

const router = express.Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (!googleClientId) {
  console.warn('Missing GOOGLE_CLIENT_ID environment variable. "Sign in with Google" will fail until this is set.');
}
const googleClient = new OAuth2Client(googleClientId);

function serializeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send({ error: 'Name, email, and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).send({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).send({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash });
    const token = signToken(user);
    res.send({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Signup failed:', error);
    res.status(500).send({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }
    if (!user.passwordHash) {
      return res.status(401).send({ error: 'This account uses Google sign-in. Please continue with Google instead.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.send({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).send({ error: 'Failed to sign in' });
  }
});

router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).send({ error: 'Missing Google credential' });
  }
  if (!googleClientId) {
    return res.status(500).send({ error: 'Google sign-in is not configured on the server yet.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).send({ error: 'Google did not return an email for this account.' });
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || normalizedEmail.split('@')[0];

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({ name, email: normalizedEmail, googleId });
      }
    }

    const token = signToken(user);
    res.send({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Google sign-in failed:', error);
    res.status(401).send({ error: 'Could not verify Google sign-in. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).send({ error: 'User not found' });
  }
  res.send({ user: serializeUser(user) });
});

export default router;

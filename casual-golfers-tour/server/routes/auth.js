const express = require('express');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  req.session.isAdmin = true;
  res.json({ authenticated: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ authenticated: false });
  });
});

router.get('/me', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

module.exports = router;

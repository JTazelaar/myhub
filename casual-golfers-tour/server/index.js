require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

require('./db/db');
require('./db/seed')();

const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const seasonRoutes = require('./routes/season');
const eventsRoutes = require('./routes/events');
const segmentsRoutes = require('./routes/segments');
const foursomesRoutes = require('./routes/foursomes');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/season', seasonRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/foursomes', foursomesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Casual Golfers Tour API running on http://localhost:${PORT}`);
});

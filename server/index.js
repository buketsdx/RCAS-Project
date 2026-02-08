import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';

// Initialize DB
const defaultData = { 
  subscriptions: {}, // userId -> { plan, startDate, expiryDate }
  usage: {}          // userId -> { feature: count }
};
const db = await JSONFilePreset('db.json', defaultData);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Middleware to simulate user context (in real app, use JWT)
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'] || 'guest';
  req.user = { id: userId };
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'RCAS Backend Running', status: 'OK' });
});

// Subscription Routes
app.get('/api/subscription', async (req, res) => {
  const { id } = req.user;
  await db.read();
  const sub = db.data.subscriptions[id] || { plan: 'free', validUntil: null };
  res.json(sub);
});

app.post('/api/subscription/upgrade', async (req, res) => {
  const { id } = req.user;
  const { plan } = req.body;
  
  await db.update(({ subscriptions }) => {
    subscriptions[id] = {
      plan: plan || 'premium',
      startDate: new Date().toISOString(),
      validUntil: null // null means lifetime or until cancelled
    };
  });
  
  res.json({ success: true, plan: db.data.subscriptions[id] });
});

app.post('/api/subscription/downgrade', async (req, res) => {
  const { id } = req.user;
  
  await db.update(({ subscriptions }) => {
    subscriptions[id] = {
      plan: 'free',
      startDate: new Date().toISOString(),
      validUntil: null
    };
  });
  
  res.json({ success: true, plan: 'free' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

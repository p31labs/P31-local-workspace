import { Hono } from 'hono';

type Bindings = {
  // Add your bindings here (KV, D1, R2, etc.)
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'worker-template' });
});

export default app;

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createRouter } from './routes/router.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(morgan('dev'));

app.use('/api', createRouter());

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`I AM backend listening on port ${PORT}`);
});

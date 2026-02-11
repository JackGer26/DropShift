import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index';

declare module 'express-serve-static-core' {
  interface Request {
    // Add custom properties here if needed
  }
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

export default app;

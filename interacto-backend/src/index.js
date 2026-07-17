import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import presentationsRouter from './routes/presentations.js';
import imagesRouter from './routes/images.js';
import surveysRouter from './routes/surveys.js';
import quizzesRouter from './routes/quizzes.js';
import authRouter from './routes/auth.js';
import { attachQuizSocket } from './socket/quiz.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/presentations', presentationsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/surveys', surveysRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.send({ status: 'ok' });
});

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interacto';
const port = process.env.PORT || 4000;

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

io.on('connection', (socket) => {
  socket.on('join-room', ({ room }) => {
    socket.join(room);
  });

  socket.on('presentation:update', (payload) => {
    const { room, data } = payload;
    if (room) {
      socket.to(room).emit('presentation:update', data);
    }
  });
});

attachQuizSocket(io);

import express from "express";
import cors from "cors";
import mysql from 'mysql2/promise';

//Import routes
import gamesRoutes from './routes/games.js';
import usersRoutes from './routes/users.js';
import itemsRoutes from './routes/items.js';
import communityRoutes from './routes/community.js';
import postsRoutes from './routes/posts.js';
import achievementRoutes from './routes/achievement.js';
import inventoryRoutes from './routes/inventory.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'db4free.net',
  user: 'cemguven001',
  password: '20012002Cc',
  database: 'ministeam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Set up the database connection pool
app.use((req, res, next) => {
    req.pool = pool;
    next();
  });
  
// Include the routes
app.use('/games', gamesRoutes);
app.use('/users', usersRoutes);
app.use('/items', itemsRoutes);
app.use('/posts', postsRoutes);
app.use('/community', communityRoutes);
app.use('/achievement', achievementRoutes);
app.use('/inventory', inventoryRoutes);


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });
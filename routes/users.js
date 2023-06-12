import { Router } from 'express';
import { checkLoginCredentials } from '../auth.js';

const router = Router();

//Get all users
router.get('/', async (req, res) => {
  try {
    const getUsersQuery = 'SELECT * FROM Users';
    const [users] = await req.pool.query(getUsersQuery);

    res.json(users);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific user
router.get('/:user_id', async (req, res) => {
    const userId = req.params.user_id;
  
    try {
      const query = 'SELECT * FROM users WHERE user_id = ?';
      const [rows] = await req.pool.query(query, [userId]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

//Register a new user 
  router.post('/register', async (req, res) => {
    const { username, password, email, name, surname } = req.body;
  
    try {
      // Check if the username and email are valid
      const CheckQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
      const [CheckRows] = await req.pool.query(CheckQuery, [username, email]);
  
      if (CheckRows.length > 0) {
        res.status(400).json({ error: 'Username or email is not valid' });
        return;
      }
      
      // Get the highest user_id from the Users table
      const getMaxUserIdQuery = 'SELECT MAX(user_id) AS max_user_id FROM users';
      const [maxUserIdRows] = await req.pool.query(getMaxUserIdQuery);
      const maxUserId = maxUserIdRows[0].max_user_id || 0;
      const newUserId = maxUserId + 1;

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the new user into the database
      const insertQuery = 'INSERT INTO users (user_id, username, user_password, user_email, user_name, user_surname) VALUES (?, ?, ?, ?, ?, ?)';
      const [insertResult] = await req.pool.query(insertQuery, [newUserId, username, hashedPassword, email, name, surname ]);
  
      // Retrieve the newly created user
      const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
      const [userRows] = await req.pool.query(getUserQuery, [insertResult.insertId]);
  
      res.status(201).json(userRows[0]);
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
//Login credentials check
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const loginResult = await checkLoginCredentials(username, password, req.pool);
  
      if (loginResult.success) {
        // Login successful
        res.json({ message: 'Login successful', user: loginResult.user });
      } else {
        // Login failed
        res.status(401).json({ error: loginResult.error });
      }
    } catch (error) {
      console.error('Error handling login:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


export default router;
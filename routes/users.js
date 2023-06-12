import { Router } from 'express';
import { checkLoginCredentials } from '../auth.js';

const router = Router();

//Get all users
router.get('/', async (req, res) => {
  try {
    const getUsersQuery = 'SELECT * FROM users';
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
      const CheckQuery = 'SELECT * FROM users WHERE username = ? OR user_email = ?';
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
      //const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the new user into the database
      const insertQuery = 'INSERT INTO users (user_id, username, user_password, user_email, user_name, user_surname, user_balance) VALUES (?, ?, ?, ?, ?, ?, 0)';
      const [insertResult] = await req.pool.query(insertQuery, [newUserId, username, password, email, name, surname ]);
  
      // Retrieve the newly created user
      const getUserQuery = 'SELECT * FROM users WHERE username = ?';
      const [userRows] = await req.pool.query(getUserQuery, [username]);
      
      res.status(201).json({user: userRows[0]});
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
        res.status(401).json({ error: loginResult.error});
      }
    } catch (error) {
      console.error('Error handling login:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add balance to user
router.post('/:user_id/balance/:balance/add', async (req, res) => {
  const { user_id, balance } = req.params; // Retrieve the user ID and balance from the route parameters

  try {
    // Check if the user exists
    const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
    const [user] = await req.pool.query(getUserQuery, [user_id]);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add balance to the user's account
    const addBalanceQuery = 'UPDATE users SET user_balance = user_balance + ? WHERE user_id = ?';
    await req.pool.query(addBalanceQuery, [balance, user_id]);

    res.json({ message: 'Balance added successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// subtract balance from user
router.post('/:user_id/balance/:balance/sub', async (req, res) => {
  const { user_id, balance } = req.params; // Retrieve the user ID and balance from the route parameters

  try {
    // Check if the user exists
    const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
    const [user] = await req.pool.query(getUserQuery, [user_id]);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has sufficient balance
    const currentUserBalance = user[0].user_balance;
    if (currentUserBalance < +balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Subtract balance from the user's account
    const subtractBalanceQuery = 'UPDATE users SET user_balance = user_balance - ? WHERE user_id = ?';
    await req.pool.query(subtractBalanceQuery, [balance, user_id]);

    res.json({ message: 'Balance subtracted successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
import { Router } from 'express';
const router = Router();

//add game to the user inventory
router.post('/User/:user_id/Game/:game_id/add', async (req, res) => {
    const { user_id, game_id } = req.params; // Retrieve the user ID and game ID from the route parameters
  
    try {
      // Check if the user and game exist
      const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
      const [user] = await req.pool.query(getUserQuery, [user_id]);
  
      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const getGameQuery = 'SELECT * FROM games WHERE game_id = ?';
      const [game] = await req.pool.query(getGameQuery, [game_id]);
  
      if (game.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
  
      // Check if the game is already in the user's inventory
      const checkInventoryQuery = 'SELECT * FROM inventory WHERE owner_id = ? AND game_id = ?';
      const [existingInventory] = await req.pool.query(checkInventoryQuery, [user_id, game_id]);
  
      if (existingInventory.length > 0) {
        return res.status(400).json({ error: 'Game already exists in the user\'s inventory' });
      }
  
      // Insert the game into the user's inventory
      const addToInventoryQuery = 'INSERT INTO inventory (owner_id, game_id) VALUES (?, ?)';
      await req.pool.query(addToInventoryQuery, [user_id, game_id]);
  
      res.json({ message: 'Game added to user\'s inventory' });
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  export default router;
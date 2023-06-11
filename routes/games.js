import { Router } from 'express';
const router = Router();

//Get all games
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Games';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific game
router.get('/:game_id', async (req, res) => {
    const game_id = req.params.game_id;
  
    try {
      const query = 'SELECT * FROM Games WHERE game_id = ?';
      const [rows] = await req.pool.query(query, [game_id]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'Game not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add more routes for games, such as creating, updating, deleting, etc.

export default router;
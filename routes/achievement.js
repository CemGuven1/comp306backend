import { Router } from 'express';
const router = Router();

//Get all achievements
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Achievements';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific achievement
router.get('/:achievement_id', async (req, res) => {
    const achievement_id = req.params.achievement_id;
  
    try {
      const query = 'SELECT * FROM Achievements WHERE achievement_id = ?';
      const [rows] = await req.pool.query(query, [achievement_id]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'Achievement not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add more routes for achievements, such as creating, updating, deleting, etc.

export default router;
import { Router } from 'express';
const router = Router();

//Get all items
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Items';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific item
router.get('/:item_id', async (req, res) => {
    const item_id = req.params.item_id;
  
    try {
      const query = 'SELECT * FROM Items WHERE item_id = ?';
      const [rows] = await req.pool.query(query, [item_id]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'Item not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add more routes for items, such as creating, updating, deleting, etc.

export default router;
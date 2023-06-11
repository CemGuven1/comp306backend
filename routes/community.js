import { Router } from 'express';
const router = Router();

//Get all communities
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Communities';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific community
router.get('/:community_id', async (req, res) => {
    const community_id = req.params.community_id;
  
    try {
      const query = 'SELECT * FROM Communities WHERE community_id = ?';
      const [rows] = await req.pool.query(query, [community_id]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'Community not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add more routes for communities, such as creating, updating, deleting, etc.

export default router;
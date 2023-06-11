import { Router } from 'express';
const router = Router();

//Get all posts
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Posts';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific post
router.get('/:post_id', async (req, res) => {
    const post_id = req.params.post_id;
  
    try {
      const query = 'SELECT * FROM Posts WHERE post_id = ?';
      const [rows] = await req.pool.query(query, [post_id]);
  
      if (rows.length === 0) {
        res.status(404).json({ error: 'Post not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Add more routes for posts, such as creating, updating, deleting, etc.

export default router;
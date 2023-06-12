import { Router } from 'express';
const router = Router();

//Get items along with their games, spesific to a user
router.get('/user/:user_id/items', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter

  try {
    // Retrieve items and their associated games for the user
    const query = `
      SELECT i.item_id, i.item_name, i.item_price, g.game_id, g.game_name, g.game_price
      FROM items AS i
      JOIN games AS g ON i.game_id = g.game_id
      WHERE i.owner_id = ?
    `;
    const [results] = await req.pool.query(query, [user_id]);

    // Return the results
    res.json(results);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
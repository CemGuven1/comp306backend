import { Router } from 'express';
const router = Router();

//Get all games
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM games';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get games by best matching name 
// Example route: /games/search?name=mine
router.get('/search', async (req, res) => {
  const { name } = req.query; // Retrieve the game name from the query parameters

  try {
    const searchGamesQuery = 'SELECT * FROM games WHERE game_name LIKE ?';
    const [games] = await req.pool.query(searchGamesQuery, [`%${name}%`]);

    res.json(games);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get spesific games by game id
router.get('/:game_id', async (req, res) => {
  const { game_id } = req.params; // Retrieve the game ID from the route parameters

  try {
    const getGameQuery = 'SELECT * FROM games WHERE game_id = ?';
    const [game] = await req.pool.query(getGameQuery, [game_id]);

    if (game.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game[0]);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get the owned games. (FOR INVENTORY)
router.get('/User/:user_id/owned-games', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve the user ID from the route parameter

  try {
    // Retrieve games owned by the user
    const query = `
      SELECT *
      FROM games G
      INNER JOIN inventory I ON G.game_id = I.game_id
      WHERE I.owner_id = ?
    `;
    const [results] = await req.pool.query(query, [user_id]);

    res.json(results);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get the unowned games (FOR MARKET) 
router.get('/User/:user_id/unowned-games', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve the user ID from the route parameter

  try {
    // Retrieve unowned games for the user
    const query = `
      SELECT *
      FROM games G
      LEFT JOIN inventory I ON G.game_id = I.game_id AND I.owner_id = ?
      WHERE I.owner_id IS NULL
    `;
    const [results] = await req.pool.query(query, [user_id]);

    res.json({ games: results });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get the unowned recommended games (FOR MARKET RECOMMENDATION) 
router.get('/User/:user_id/recommended-games', (req, res) => {
  const userId = req.params.user_id;

  const query = `
    SELECT g.*
    FROM games g
    WHERE g.game_category NOT IN (
        SELECT DISTINCT g2.game_category
        FROM games g2
        INNER JOIN inventory i ON i.game_id = g2.game_id
        WHERE i.owner_id = ?
    )
    ORDER BY (
        SELECT COUNT(*) 
        FROM inventory i2 
        INNER JOIN games g3 ON g3.game_id = i2.game_id 
        WHERE i2.owner_id = ?
        AND g3.game_category = g.game_category
    ) DESC, g.game_id ASC;
  `;

  connection.query(query, [userId, userId], (error, results) => {
    if (error) {
      console.error('Error retrieving unowned games:', error);
      return res.status(500).json({ error: 'Failed to retrieve unowned games' });
    }

    res.json(results);
  });
});


export default router;
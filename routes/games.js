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
router.get('/User/:user_id/recommended-games', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve the user ID from the route parameter

  try {
    // Retrieve the user's inventory preference of game category
    const inventoryQuery = `
      SELECT game_category, COUNT(*) AS count
      FROM inventory I
      INNER JOIN games G ON I.game_id = G.game_id
      WHERE I.owner_id = ?
      GROUP BY game_category
      ORDER BY count DESC
    `;
    const [inventoryResults] = await req.pool.query(inventoryQuery, [user_id]);

    // Build the category preference order based on the user's inventory
    const categoryOrder = inventoryResults.map((row) => row.game_category);

    // Retrieve unowned games for the user, ordered by inventory preference of game category
    const gamesQuery = `
      SELECT *
      FROM games G
      LEFT JOIN inventory I ON G.game_id = I.game_id AND I.owner_id = ?
      WHERE I.owner_id IS NULL
      ORDER BY FIELD(G.game_category, ${categoryOrder.map(() => '?').join(',')})
    `;
    const [gamesResults] = await req.pool.query(gamesQuery, [user_id, ...categoryOrder]);

    res.json({ games: gamesResults });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
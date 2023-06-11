import { Router } from 'express';
const router = Router();

//Get all games with all of its achievements
router.get('/', async (req, res) => {
  try {
    // Retrieve all games with their achievements
    const query = `
      SELECT Games.game_id, Games.game_name, Achievements.achievement_id, Achievements.achievement_name
      FROM Games
      LEFT JOIN Achievements ON Games.game_id = Achievements.game_id
    `;
    const [results] = await req.pool.query(query);

    // Organize the data into an object with games and their achievements
    const games = {};
    results.forEach((row) => {
      const { game_id, game_name, achievement_id, achievement_name } = row;
      if (!games[game_id]) {
        games[game_id] = {
          game_id,
          game_name,
          achievements: [],
        };
      }
      if (achievement_id) {
        games[game_id].achievements.push({
          achievement_id,
          achievement_name,
        });
      }
    });

    res.json({ games });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get the owned games with all of its achievements that are earned by user. (FOR INVENTORY)
router.get('/ownedgames/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Retrieve the games owned by the user and their earned achievements
    const getUserGamesQuery = `
      SELECT Games.*, Achievements.achievement_id, Achievements.achievement_name
      FROM Games
      INNER JOIN Inventory ON Games.game_id = Inventory.game_id
      LEFT JOIN Achievements ON Games.game_id = Achievements.game_id
      LEFT JOIN XP ON Achievements.achievement_id = XP.achievement_id AND XP.player_id = ?
      WHERE Inventory.owner_id = ?
    `;
    const [gameRows] = await req.pool.query(getUserGamesQuery, [user_id, user_id]);

    // Group the games by game ID and combine their earned achievements
    const games = {};
    gameRows.forEach((row) => {
      const { game_id, game_name, game_price, game_description, game_category, release_date, game_rating } = row;

      if (!games[game_id]) {
        games[game_id] = {
          game_id,
          game_name,
          game_price,
          game_description,
          game_category,
          release_date,
          game_rating,
          achievements: [],
        };
      }

      if (row.achievement_id && row.achievement_name) {
        const isAchievementEarned = row.player_id !== null;
        games[game_id].achievements.push({
          achievement_id: row.achievement_id,
          achievement_name: row.achievement_name,
          earned: isAchievementEarned,
        });
      }
    });

    res.json(Object.values(games));
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get the unowned games by that user along with its achievements. (FOR MARKET) 
router.get('/unownedgames/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Retrieve the unowned games by the user and their associated achievements
    const getUnownedGamesQuery = `
      SELECT Games.*, Achievements.achievement_id, Achievements.achievement_name
      FROM Games
      LEFT JOIN Inventory ON Games.game_id = Inventory.game_id AND Inventory.owner_id = ?
      LEFT JOIN Achievements ON Games.game_id = Achievements.game_id
      WHERE Inventory.owner_id IS NULL
    `;
    const [gameRows] = await req.pool.query(getUnownedGamesQuery, [user_id]);

    // Group the games by game ID and combine their achievements
    const games = {};
    gameRows.forEach((row) => {
      const { game_id, game_name, game_price, game_description, game_category, release_date, game_rating } = row;

      if (!games[game_id]) {
        games[game_id] = {
          game_id,
          game_name,
          game_price,
          game_description,
          game_category,
          release_date,
          game_rating,
          achievements: [],
        };
      }

      if (row.achievement_id && row.achievement_name) {
        games[game_id].achievements.push({
          achievement_id: row.achievement_id,
          achievement_name: row.achievement_name,
        });
      }
    });

    res.json(Object.values(games));
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//get the unowned games by that user along with its achievements. (FOR MARKET RECOMMENDATION) 
router.get('/prefferedgames/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Get the user's preferred game category
    const [userCategoryRows] = await req.pool.query(
      'SELECT game_category FROM Games JOIN Inventory ON Games.game_id = Inventory.game_id WHERE owner_id = ? GROUP BY game_category ORDER BY COUNT(*) DESC LIMIT 1',
      [user_id]
    );

    const userPreferredCategory = userCategoryRows[0].game_category;

    // Get the unowned games of the user's preferred category
    const [unownedGamesRows] = await req.pool.query(
      'SELECT * FROM Games WHERE game_category = ? AND game_id NOT IN (SELECT game_id FROM Inventory WHERE owner_id = ?)',
      [userPreferredCategory, user_id]
    );

    res.json(unownedGamesRows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
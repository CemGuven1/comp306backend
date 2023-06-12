import { Router } from 'express';
const router = Router();

//Get all achievements
router.get('/', async (req, res) => {
  try {
    const getAchievementsQuery = 'SELECT * FROM achievements';
    const [achievements] = await req.pool.query(getAchievementsQuery);

    res.json(achievements);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get spesific achievements of a game 
router.get('/Game/:game_id', async (req, res) => {
  const game_id = req.params.game_id; // Retrieve the game ID from the route parameter

  try {
    // Retrieve achievements specific to the game
    const query = `
      SELECT achievement_id, achievement_name
      FROM achievements
      WHERE game_id = ?
    `;
    const [results] = await req.pool.query(query, [game_id]);

    res.json({ achievements: results });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

 //Get earned achievements of a spesific user
 router.get('/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const getUserAchievementsQuery = `
      SELECT achievements.achievement_id, achievements.achievement_name
      FROM achievements
      INNER JOIN xp ON achievements.achievement_id = XP.achievement_id
      WHERE XP.player_id = ?
    `;
    const [achievementRows] = await req.pool.query(getUserAchievementsQuery, [user_id]);

    res.json(achievementRows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
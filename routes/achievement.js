import { Router } from 'express';
const router = Router();

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

 //Get earned achievements of a spesific user
 router.get('/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const getUserAchievementsQuery = `
      SELECT Achievements.achievement_id, Achievements.achievement_name
      FROM Achievements
      INNER JOIN XP ON Achievements.achievement_id = XP.achievement_id
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
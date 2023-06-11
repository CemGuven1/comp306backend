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

//Get User spesific community
router.get('/User/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await req.pool.query(
      'SELECT Communities.community_id, Communities.community_name FROM Communities JOIN Member_Of ON Communities.community_id = Member_Of.community_id WHERE Member_Of.member_id = ?',
      [user_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Join to a community 
router.post('/User/:user_id/Community/:community_id/join', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve community_id from the route parameter

  try {
    // Check if the user is already a member of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM Member_Of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );
    const isMember = result[0].count > 0;

    if (isMember) {
      return res.status(409).json({ error: 'User is already a member of the community' });
    }

    // Join the community
    await req.pool.query(
      'INSERT INTO Member_Of (member_id, community_id) VALUES (?, ?)',
      [user_id, community_id]
    );

    res.json({ message: 'Joined the community successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Leave from a community
router.post('/User/:user_id/Community/:community_id/leave', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve community_id from the route parameter

  try {
    // Check if the user is a member of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM Member_Of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );
    const isMember = result[0].count > 0;

    if (!isMember) {
      return res.status(404).json({ error: 'User is not a member of the community' });
    }

    // Leave the community
    await req.pool.query(
      'DELETE FROM Member_Of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );

    res.json({ message: 'Left the community successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
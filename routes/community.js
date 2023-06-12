import { Router } from 'express';
const router = Router();

//Get all communities
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM communities';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get User spesific community (either member of or admin of)
router.get('/User/:user_id', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve the user ID from the route parameters

  try {
    const getCommunitiesQuery = `
      SELECT DISTINCT c.community_id, c.community_name, c.community_admin, c.community_odes
      FROM communities c
      LEFT JOIN member_of m ON c.community_id = m.community_id
      WHERE m.member_id = ? OR c.community_admin = ?
    `;
    const [communities] = await req.pool.query(getCommunitiesQuery, [user_id, user_id]);

    res.json(communities);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Join to a community 
router.post('/:community_id/User/:user_id/join', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve community_id from the route parameter

  try {
    // Check if the user is already a member of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM member_of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );
    const isMember = result[0].count > 0;

    if (isMember) {
      return res.status(409).json({ error: 'User is already a member of the community' });
    }

    // Join the community
    await req.pool.query(
      'INSERT INTO member_of (member_id, community_id) VALUES (?, ?)',
      [user_id, community_id]
    );

    res.json({ message: 'Joined the community successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Leave from a community
router.post('/:community_id/User/:user_id/leave', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve community_id from the route parameter

  try {
    // Check if the user is a member of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM member_of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );
    const isMember = result[0].count > 0;

    if (!isMember) {
      return res.status(404).json({ error: 'User is not a member of the community' });
    }

    // Leave the community
    await req.pool.query(
      'DELETE FROM member_of WHERE member_id = ? AND community_id = ?',
      [user_id, community_id]
    );

    res.json({ message: 'Left the community successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//ADMIN OPERATION --> UPDATE THE COMMUNITY INFO
router.put('/:community_id/Admin/:user_id/update', async (req, res) => {
  const admin_id = req.params.user_id; // Retrieve the admin ID from the route parameter
  const community_id = req.params.community_id; // Retrieve the community ID from the route parameter
  const { community_name, community_description } = req.body; // Retrieve the updated community information from the request body

  try {
    // Check if the user is the admin of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM communities WHERE community_id = ? AND community_admin = ?',
      [community_id, admin_id]
    );
    const isAdmin = result[0].count > 0;

    if (!isAdmin) {
      return res.status(403).json({ error: 'You are not the admin of the community' });
    }

    // Update the community information
    await req.pool.query(
      'UPDATE communities SET community_name = ?, community_description = ? WHERE community_id = ?',
      [community_name, community_description, community_id]
    );

    res.json({ message: 'Community information updated successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// get most popular community i.e the community which has most members in it.
router.get('/most-popular', async (req, res) => {
  try {
    const getMostPopularCommunityQuery = `
      SELECT *
      FROM community c
      INNER JOIN (
        SELECT community_id, COUNT(*) AS member_count
        FROM member_of
        GROUP BY community_id
      ) m ON c.community_id = m.community_id
      ORDER BY member_count DESC
      LIMIT 1
    `;
    const [community] = await req.pool.query(getMostPopularCommunityQuery);

    if (community.length === 0) {
      return res.status(404).json({ error: 'No communities found' });
    }

    res.json(community[0]);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
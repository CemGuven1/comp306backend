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

//Get all posts of the communities where the user is a member of. (SORT BY ADMIN'S POST)
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await req.pool.query(
      `SELECT Posts.post_id, Posts.post_name, Posts.post_title, Posts.post_text, Posts.post_date 
      FROM Posts 
      JOIN Member_Of ON Posts.community_id = Member_Of.community_id 
      WHERE Member_Of.member_id = ? 
      ORDER BY CASE WHEN Posts.author_id = ? THEN 0 ELSE 1 END`,
      [user_id, user_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Add new post for the spesified author and spesified community
router.post('/User/:user_id/Community/:community_id/addPost', async (req, res) => {
  const { post_name, post_title, post_text } = req.body;
  const author_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve user_id from the route parameter

  try {
    const [result] = await req.pool.query('SELECT MAX(post_id) AS max_post_id FROM Posts');
    const maxPostId = result[0].max_post_id;
    const newPostId = maxPostId ? maxPostId + 1 : 1;

    await req.pool.query(
      'INSERT INTO Posts (post_id, post_name, post_title, post_text, post_date, author_id, community_id) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
      [newPostId, post_name, post_title, post_text, author_id, community_id]
    );

    res.json({ message: 'Post added successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//delete a post for the spesified author 
router.delete('/users/:user_id/posts/:post_id/delete', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const post_id = req.params.post_id; // Retrieve post_id from the route parameter

  try {
    // Check if the user has permission to delete the post
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM Posts WHERE post_id = ? AND author_id = ?',
      [post_id, user_id]
    );
    const postExists = result[0].count > 0;

    if (!postExists) {
      return res.status(404).json({ error: 'Post not found or user does not have permission' });
    }

    // Delete the post
    await req.pool.query('DELETE FROM Posts WHERE post_id = ?', [post_id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//ADMIN OPERATION --> DELETE POST FROM THE COMMUNITY WHICH HE IS THE ADMIN OF
router.delete('/Admin/:user_id/Community/:community_id/Post/:post_id/delete', async (req, res) => {
  const admin_id = req.params.user_id; // Retrieve the admin ID from the route parameter
  const community_id = req.params.community_id; // Retrieve the community ID from the route parameter
  const post_id = req.params.post_id; // Retrieve the post ID from the route parameter

  try {
    // Check if the user is the admin of the community
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM Communities WHERE community_id = ? AND community_admin = ?',
      [community_id, admin_id]
    );
    const isAdmin = result[0].count > 0;

    if (!isAdmin) {
      return res.status(403).json({ error: 'You are not the admin of the community' });
    }

    // Delete the post from the community
    await req.pool.query('DELETE FROM Posts WHERE post_id = ?', [post_id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
import { Router } from 'express';
const router = Router();

//Get all posts
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM posts';
    const [rows] = await req.pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get all the posts shared on a community
router.get('/Community/:community_id', async (req, res) => {
  const { community_id } = req.params; // Retrieve the community ID from the route parameters

  try {
    const getPostsQuery = 'SELECT * FROM posts WHERE community_id = ?';
    const [posts] = await req.pool.query(getPostsQuery, [community_id]);

    res.json(posts);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Get user spesific posts for the given communities where the user is a member of.
router.get('/User/:user_id/Community/:community_id/', async (req, res) => {
  const { user_id, community_id } = req.params; // Retrieve the user ID and community ID from the route parameters

  try {
    const checkMembershipQuery = 'SELECT COUNT(*) AS count FROM member_of WHERE member_id = ? AND community_id = ?';
    const [membershipResult] = await req.pool.query(checkMembershipQuery, [user_id, community_id]);

    if (membershipResult[0].count === 0) {
      // User is not a member of the community
      return res.status(404).json({ error: 'User is not a member of the community' });
    }

    const getPostsQuery = 'SELECT * FROM posts WHERE author_id = ? AND community_id = ?';
    const [posts] = await req.pool.query(getPostsQuery, [user_id, community_id]);

    res.json(posts);
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Add new post for the spesified author and spesified community
router.post('/User/:user_id/Community/:community_id/addPost', async (req, res) => {
  const { post_name, post_text } = req.body;
  const author_id = req.params.user_id; // Retrieve user_id from the route parameter
  const community_id = req.params.community_id; // Retrieve user_id from the route parameter

  try {
    const [result] = await req.pool.query('SELECT MAX(post_id) AS max_post_id FROM posts');
    const maxPostId = result[0].max_post_id;
    const newPostId = maxPostId ? maxPostId + 1 : 1;

    await req.pool.query(
      'INSERT INTO posts (post_id, post_name, post_text, post_date, author_id, community_id) VALUES (?, ?, ?, NOW(), ?, ?)',
      [newPostId, post_name, post_text, author_id, community_id]
    );

    res.json({ message: 'Post added successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//delete a post for the spesified author 
router.delete('/:post_id/User/:user_id/delete', async (req, res) => {
  const user_id = req.params.user_id; // Retrieve user_id from the route parameter
  const post_id = req.params.post_id; // Retrieve post_id from the route parameter

  try {
    // Check if the user has permission to delete the post
    const [result] = await req.pool.query(
      'SELECT COUNT(*) AS count FROM posts WHERE post_id = ? AND author_id = ?',
      [post_id, user_id]
    );
    const postExists = result[0].count > 0;

    if (!postExists) {
      return res.status(404).json({ error: 'Post not found or user does not have permission' });
    }

    // Delete the post
    await req.pool.query('DELETE FROM posts WHERE post_id = ?', [post_id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//ADMIN OPERATION --> DELETE POST FROM THE COMMUNITY WHICH HE IS THE ADMIN OF
router.delete('/:post_id/Admin/:user_id/Community/:community_id/delete', async (req, res) => {
  const admin_id = req.params.user_id; // Retrieve the admin ID from the route parameter
  const community_id = req.params.community_id; // Retrieve the community ID from the route parameter
  const post_id = req.params.post_id; // Retrieve the post ID from the route parameter

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

    // Check if the post belongs to the specified community
    const postQuery = 'SELECT author_id FROM posts WHERE post_id = ? AND community_id = ?';
    const [postResult] = await req.pool.query(postQuery, [post_id, community_id]);

    if (postResult.length === 0) {
      return res.status(404).json({ error: 'Post not found in the specified community.' });
    }

    // Delete the post from the community
    await req.pool.query('DELETE FROM posts WHERE post_id = ?', [post_id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
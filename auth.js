import bcrypt from 'bcrypt';

async function checkLoginCredentials(username, password, pool) {
  try {
    // Retrieve the user from the database based on the provided username
    const getUserQuery = 'SELECT * FROM users WHERE username = ?';
    const [userRows] = await pool.query(getUserQuery, [username]);

    // Check if the user exists
    if (userRows.length === 0) {
      return { success: false, error: 'Invalid username or password' };
    }

    const user = userRows[0];

    // Compare the provided password with the hashed password stored in the database
    //const passwordMatch = await bcrypt.compare(password, user.user_password);

    if (password === user.user_password) {
      // Passwords match, login successful
      return { success: true, user };
    } else {
      // Passwords do not match
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

export { checkLoginCredentials };
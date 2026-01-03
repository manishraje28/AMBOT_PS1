const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');
const { ROLES } = require('../config/constants');

class AuthService {
  // Hash password
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new user
  async register({ email, password, role, firstName, lastName }) {
    // Validate role
    if (!Object.values(ROLES).includes(role) || role === ROLES.ADMIN) {
      throw new Error('Invalid role. Must be student or alumni.');
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user with transaction
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, first_name, last_name, created_at`,
        [email.toLowerCase(), passwordHash, role, firstName, lastName]
      );

      const user = userResult.rows[0];

      // Create profile based on role
      if (role === ROLES.STUDENT) {
        await client.query(
          'INSERT INTO student_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      } else if (role === ROLES.ALUMNI) {
        await client.query(
          'INSERT INTO alumni_profiles (user_id) VALUES ($1)',
          [user.id]
        );
      }

      return user;
    });

    // Generate token
    const token = this.generateToken(result);

    return {
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        firstName: result.first_name,
        lastName: result.last_name
      },
      token
    };
  }

  // Login user
  async login({ email, password }) {
    // Find user
    const result = await query(
      `SELECT id, email, password_hash, role, first_name, last_name, avatar_url, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account has been deactivated. Please contact support.');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url
      },
      token
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const result = await query(
      `SELECT id, email, role, first_name, last_name, avatar_url, is_active, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    return { success: true };
  }
}

module.exports = new AuthService();

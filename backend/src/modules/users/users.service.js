import { prisma } from '../../config/database.js';

/**
 * Users Service
 * Business logic for user management operations
 */

/**
 * Format user response (exclude sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Formatted user object
 */
const formatUserResponse = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Get all users with optional filtering and pagination
 * @param {Object} options - { role, page, limit }
 * @returns {Object} { users, pagination }
 */
export const getUsers = async ({ role, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // Build where clause
  const where = role ? { role: { name: role } } : {};

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: { name: true }
        },
        createdAt: true,
        updatedAt: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  // Format users
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  return {
    users: formattedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update user role (admin only)
 * @param {Number} userId - User ID to update
 * @param {String} roleName - New role name
 * @param {Number} currentUserId - ID of user making the request
 * @returns {Object} Updated user
 */
export const updateUserRole = async (userId, roleName, currentUserId) => {
  // Prevent self-role change (safety feature)
  if (userId === currentUserId) {
    const error = new Error('You cannot change your own role');
    error.statusCode = 403;
    throw error;
  }

  // Find the role
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  // Find and update user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id },
    include: { role: true }
  });

  return formatUserResponse(updatedUser);
};

/**
 * Get user lookup list for ECO dropdowns
 * @returns {Array} Lightweight users list
 */
export const getUserLookup = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      role: {
        select: {
          name: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return users;
};

export default { getUsers, updateUserRole, getUserLookup };

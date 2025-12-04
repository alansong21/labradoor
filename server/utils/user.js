/**
 * User Utility
 * Helper functions for user data manipulation.
 * e.g., sanitizing user objects before sending to client.
 */
function publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
}

module.exports = {
    publicUser,
};

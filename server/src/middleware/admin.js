// Use after requireAuth. Only lets administrators through.
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can do this' });
  }
  next();
}

module.exports = requireAdmin;

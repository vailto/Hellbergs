function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization;
  if (!token || !auth || auth !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { requireAdminToken };

// Csak a megadott szerepkörű felhasználóknak enged hozzáférést.
// A requireAuth middleware-nek előtte kell futnia, hogy req.user létezzen.
function requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Nincs jogosultságod ehhez a művelethez.' });
      }
      next();
    };
  }
  
  module.exports = { requireRole };
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    console.log('Auth middleware - received token:', token ? 'Yes' : 'No');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - decoded token:', decoded);

    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    console.log('Auth middleware - set user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth; 
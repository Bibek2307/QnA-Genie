const speakerAuth = (req, res, next) => {
  console.log('Checking speaker auth:', {
    user: req.user,
    role: req.user?.role
  });

  if (!req.user || req.user.role !== 'speaker') {
    return res.status(403).json({ 
      message: 'Access denied. Speaker only.',
      currentRole: req.user?.role
    });
  }
  next();
};

const listenerAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'listener') {
    return res.status(403).json({ message: 'Access denied. Listener only.' });
  }
  next();
};

module.exports = { speakerAuth, listenerAuth }; 
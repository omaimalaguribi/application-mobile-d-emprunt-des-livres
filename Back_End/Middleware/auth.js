const jwt = require('jsonwebtoken');
const jwtConfig = require('../Config/jwt');


//pour l'inscription:
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token non fourni' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentification échouée' });
  }
};

//pour l'authentification:
// Middleware pour vérifier le token JWT


// Middleware pour vérifier le token JWT
// Middleware unique et cohérent
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token non fourni' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Standardisez la structure des données utilisateur
    req.userData = {
      id: decoded.id,        // Garantissez toujours 'id'
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Erreur vérification token:', error);
    return res.status(401).json({ message: 'Authentification échouée' });
  }
};

// Middleware pour vérifier si l'utilisateur est administrateur
const isAdmin = (req, res, next) => {
  if (!req.userData || req.userData.role !== 'administrateur') {
    return res.status(403).json({ message: 'Accès refusé. Vous devez être administrateur.' });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};



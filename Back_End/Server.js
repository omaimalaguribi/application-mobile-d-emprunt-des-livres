require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS pour React Native
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middleware
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes

const adminRoutes = require('./Routes/adminRoutes');
const userRoutes = require('./Routes/userRoutes');

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
// Dossier pour les images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gestion des erreurs (spécifique React Native)
app.use((err, req, res, next) => {
  console.error('Erreur API:', err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Serveur prêt pour React Native sur le port ${PORT}`);
});
// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
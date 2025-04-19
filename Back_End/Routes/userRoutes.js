const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../DB/db');
const jwtConfig = require('../Config/jwt');
const nodemailer = require('nodemailer');
const { verifyToken } = require('../Middleware/auth');
const multer = require('multer');
const fs = require('fs');


const cors = require('cors');
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ajouter ceci au début de votre fichier Server.js
require('dotenv').config();
console.log("Email config:", { 
  user: process.env.EMAIL_USER ? "Défini" : "Non défini", 
  pass: process.env.EMAIL_APP_PASSWORD ? "Défini" : "Non défini" 
});
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Utilise STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    // Ne pas rejeter les certificats non autorisés
    rejectUnauthorized: false,
    // Forcer l'utilisation de TLSv1.2 ou supérieur
    minVersion: 'TLSv1.2'
  }
});
// Route pour la réinitialisation du mot de passe (étape 1: demande de réinitialisation)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'L\'email est requis' });
    }
    
    // Vérifier si l'utilisateur existe
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Aucun compte associé à cet email' });
    }
    
    const user = users[0];
    
    // Générer un code de réinitialisation numérique à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Créer un token JWT qui contient le code (pour vérification ultérieure)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, code: resetCode },
      jwtConfig.secret,
      { expiresIn: '1h' }
    );
    
    // Stocker le token dans la base de données
    await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = NOW() + INTERVAL 1 HOUR WHERE id = ?', 
      [resetToken, user.id]);
    
    // Configurer le transporteur nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });
    
    // Préparer l'email avec le code de réinitialisation
    const mailOptions = {
      from: {
        name: "Ouma-Books",
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Code de réinitialisation de mot de passe',
      text: `Bonjour ${user.prenom}, votre code de réinitialisation est: ${resetCode}. Ce code expirera dans 1 heure.`,
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour ${user.prenom},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Voici votre code de réinitialisation :</p>
        <h2 style="font-size: 24px; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px; text-align: center; font-family: monospace;">${resetCode}</h2>
        <p>Ce code expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      `,
      headers: {
        'X-Priority': '1',
        'Importance': 'high'
      }
    };
    
    // Envoyer l'email
    transporter.sendMail(mailOptions)
      .then(info => {
        console.log('Email avec code de réinitialisation envoyé avec succès:', info.messageId);
        console.log('Destinataire:', user.email);
        res.status(200).json({ message: 'Code de réinitialisation envoyé avec succès' });
      })
      .catch(error => {
        console.error('Erreur détaillée lors de l\'envoi de l\'email:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du code de réinitialisation' });
      });
    
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la demande de réinitialisation' });
  }
});
// Route pour la vérification du code et la mise à jour du mot de passe (étape 2)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    
    console.log("Données reçues:", { 
      email: email || "Non fourni", 
      resetCode: resetCode || "Non fourni",
      newPasswordLength: newPassword ? newPassword.length : 0
    });
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: 'L\'email, le code de réinitialisation et le nouveau mot de passe sont requis' });
    }
    
    // Récupérer l'utilisateur et son token
    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND reset_token_expiry > NOW()', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Code expiré ou email invalide' });
    }
    
    const user = users[0];
    const resetToken = user.reset_token;
    
    if (!resetToken) {
      return res.status(401).json({ message: 'Aucune demande de réinitialisation active' });
    }
    
    // Vérifier le token et le code
    try {
      const decoded = jwt.verify(resetToken, jwtConfig.secret);
      
      // Vérifier que le code fourni correspond au code dans le token
      if (decoded.code !== resetCode) {
        return res.status(401).json({ message: 'Code de réinitialisation invalide' });
      }
      
      // Vérifier que l'email correspond
      if (decoded.email !== email) {
        return res.status(401).json({ message: 'Information utilisateur invalide' });
      }
      
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Mettre à jour le mot de passe et supprimer le token de réinitialisation
      await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', 
        [hashedPassword, user.id]);
      
      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
      
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return res.status(401).json({ message: 'Code expiré ou invalide' });
    }
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation du mot de passe' });
  }
});
// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, cin, password, role } = req.body;

    // Validation des données
    if (!nom || !prenom || !email || !telephone || !cin || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Définir un rôle par défaut si non spécifié
    const userRole = role || 'utilisateur';

    // Vérifier si l'email existe déjà
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hashage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insérer le nouvel utilisateur dans la base de données avec le rôle
    const [result] = await db.query(
      'INSERT INTO users (nom, prenom, email, telephone, cin, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone, cin, hashedPassword, userRole]
    );

    // Créer le token JWT pour connexion automatique
    const token = jwt.sign(
      { id: result.insertId, email, role: userRole },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Réponse réussie
    res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      userId: result.insertId,
      token
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
});
// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    // Rechercher l'utilisateur par email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Créer le token JWT avec le rôle inclus
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Réponse réussie
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        cin: user.cin,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
});


// Route pour récupérer le profil utilisateur (protégée par JWT)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    
    const [users] = await db.query(
      `SELECT id, nom, prenom, email, telephone, cin, role, 
       profile_picture FROM users WHERE id = ?`, 
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const user = users[0];
    
    // Ne pas convertir en URL data ici, laisser le frontend gérer cela
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Dans userRoutes.js
// Configuration multer
// Dans votre route Express
const storage = require('multer');
const upload = multer({ 
  storage: storage.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/profile/picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image reçue' });
    }

    const userId = req.userData.id;
    const imageBase64 = req.file.buffer.toString('base64');

    await db.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [imageBase64, userId]
    );

    res.status(200).json({ 
      message: 'Photo mise à jour avec succès',
      profile_picture: imageBase64 // Retourner directement le base64
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/profile/picture/:userId', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (!users[0]?.profile_picture) {
      return res.status(404).send('Image non trouvée');
    }

    const img = Buffer.from(users[0].profile_picture, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': img.length
    });
    res.end(img);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).send('Erreur serveur');
  }
});
module.exports = router;
// Back_End/Routes/userRoutes.js

// Get all books (for regular users)
router.get('/books', verifyToken,async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM books');
    res.status(200).json(results);
  } catch (err) {

    console.error('Erreur lors de la récupération des livres:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Search books
router.get('/books/search', verifyToken, (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Paramètre de recherche manquant' });
  }
  
  const searchQuery = `%${query}%`;
  const sql = `
    SELECT * FROM books 
    WHERE Title LIKE ? 
    OR Author LIKE ? 
    OR ISBN LIKE ? 
    OR Domain LIKE ?
  `;
  
  connection.query(sql, [searchQuery, searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche de livres:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    res.status(200).json(results);
  });
});
// Get user profile
router.get('/profile', verifyToken, (req, res) => {
  const userId = req.userData.userId;
  
  connection.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = results[0];
    
    res.status(200).json(userWithoutPassword);
  });
});
// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    // Debug: Vérifiez ce qui est reçu
    console.log('UserData:', req.userData);
    console.log('Body:', req.body);

    const userId = req.userData.id; // Maintenant garanti d'exister
    const { nom, prenom, email, telephone, cin } = req.body;

    // Validation
    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: 'Nom, prénom et email requis' });
    }

    // Vérifiez l'email unique
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Mise à jour
    const [result] = await db.query(
      'UPDATE users SET nom = ?, prenom = ?, email = ?, telephone = ?, cin = ? WHERE id = ?',
      [nom, prenom, email, telephone || null, cin || null, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Réponse avec données mises à jour
    const [updatedUser] = await db.query(
      'SELECT id, nom, prenom, email, telephone, cin FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json(updatedUser[0]);

  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      userData: req.userData
    });
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});
// Change password
// Dans userRoutes.js
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query(
      'SELECT id, password FROM users WHERE id = ?', 
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Comparaison sécurisée des hashs
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hashage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mise à jour
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});
// Middleware pour vérifier le token JWT
router.use(verifyToken);

router.post('/profile/picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.userData.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    
    await db.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [imageBuffer, userId]
    );
    
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({ message: 'Photo mise à jour' });
    
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Erreur photo profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});
// Récupérer le profil de l'utilisateur connecté
router.get('/profile', async (req, res) => {
  try {
    const userId = req.userData.id;
    
    const [users] = await db.query(
      `SELECT id, nom, prenom, email, telephone, cin, role, 
       profile_picture FROM users WHERE id = ?`, 
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const user = users[0];
    
    // Convertir l'image de profil en base64 si elle existe
    if (user.profile_picture) {
      user.profile_picture = `data:image/jpeg;base64,${user.profile_picture.toString('base64')}`;
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/profile/picture/:userId', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (!users[0]?.profile_picture) {
      return res.status(404).send('Image non trouvée');
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(users[0].profile_picture);
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Mettre à jour le profil de l'utilisateur
router.put('/profile', verifyToken, async (req, res) => {
  try {
    // Utilisez req.userData._id au lieu de req.userData.id
    const userId = req.userData._id || req.userData.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur manquant dans le token' });
    }

    const { nom, prenom, email, telephone, cin } = req.body;

    // Vérification email unique
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [email, userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Construction de l'objet de mise à jour
    const updateData = {
      nom,
      prenom,
      email,
      telephone: telephone || null,  // Permet les valeurs null
      cin: cin || null               // Permet les valeurs null
    };

    // Exécution de la mise à jour
    const [result] = await db.query(
      'UPDATE users SET ? WHERE id = ?',
      [updateData, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Récupération des données mises à jour
    const [updatedUser] = await db.query(
      'SELECT id, nom, prenom, email, telephone, cin FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json(updatedUser[0]);

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour',
      error: error.message,
      stack: error.stack // Pour le débogage
    });
  }
});

// Mettre à jour l'image de profil
router.post('/profile/picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.userData.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image téléchargée' });
    }
    
    // Lire le fichier image
    const imageBuffer = fs.readFileSync(req.file.path);
    
    // Mise à jour de la photo de profil
    await db.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [imageBuffer, userId]
    );
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({ message: 'Photo de profil mise à jour avec succès' });
    
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Erreur lors de la mise à jour de la photo de profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Changer le mot de passe
router.put('/change-password', async (req, res) => {
  try {
    const userId = req.userData.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Les mots de passe actuels et nouveaux sont requis' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }
    
    // Récupérer le mot de passe actuel
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?', 
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Dans une vraie application, vous devriez comparer les hashs
    // Ici, nous faisons une simple comparaison pour l'exemple
    const storedPassword = users[0].password;
    
    if (currentPassword !== storedPassword) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Mettre à jour le mot de passe (dans une vraie app, il faudrait hasher)
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, userId]
    );
    
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Récupérer les livres disponibles
router.get('/books', async (req, res) => {
  try {
// Dans votre backend (route GET /books)
const [books] = await db.query('SELECT ISBN, Title, Author, Language, Picture_link, Date, Description, Quantity FROM books');    const booksWithImages = books.map(book => {
      if (book.Picture_link) {
        const base64Image = book.Picture_link.toString('base64');
        return {
          ...book,
          Picture_link: `data:image/jpeg;base64,${base64Image}`
        };
      }
      return book;
    });
    
    res.status(200).json(booksWithImages);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/books/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    const [books] = await db.query('SELECT ISBN, Title, Author, Language, Picture_link, Date, Description, Quantity FROM books WHERE ISBN = ?', [isbn]);
    if (books.length === 0) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    
    res.status(200).json(books[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du livre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour emprunter un livre
router.post('/borrow/:isbn', verifyToken, async (req, res) => {
  console.log('Début processus emprunt...');
  
  let connection;
  
  try {
    const isbn = req.params.isbn;
    const userId = req.userData.id;

    console.log(`ISBN: ${isbn}, UserID: ${userId}`);

    // Obtenir une connexion du pool
    connection = await db.getConnection();
    
    // 1. Vérifier si le livre existe et est disponible
    const [books] = await connection.query('SELECT * FROM books WHERE ISBN = ?', [isbn]);
    
    if (books.length === 0) {
      console.log('Livre non trouvé');
      return res.status(404).json({ 
        success: false,
        message: 'Livre non trouvé' 
      });
    }

    const book = books[0];
    console.log(`Quantité disponible: ${book.Quantity}`);

    if (book.Quantity <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Ce livre n\'est plus disponible' 
      });
    }

    // 2. Vérifier si l'utilisateur a déjà emprunté ce livre
    const [existingBorrowings] = await connection.query(
      `SELECT * FROM borrowings 
       WHERE book_isbn = ? AND user_id = ? AND status = 'emprunté'`,
      [isbn, userId]
    );
    
    if (existingBorrowings.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Vous avez déjà emprunté ce livre' 
      });
    }

    // 3. Récupérer les infos utilisateur
    const [users] = await connection.query(
      'SELECT nom, prenom, email, telephone, cin FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const user = users[0];

    // 4. Démarrer une transaction
    await connection.beginTransaction();

    try {
      console.log('Début transaction...');

      // a. Diminuer la quantité du livre
      const [updateResult] = await connection.query(
        'UPDATE books SET Quantity = Quantity - 1 WHERE ISBN = ? AND Quantity > 0',
        [isbn]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error('La quantité n\'a pas pu être mise à jour');
      }

      // b. Enregistrer l'emprunt
      const [insertResult] = await connection.query(
        `INSERT INTO borrowings 
        (book_isbn, user_id, user_nom, user_prenom, user_email, user_telephone, user_cin) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [isbn, userId, user.nom, user.prenom, user.email, user.telephone, user.cin]
      );

      // c. Valider la transaction
      await connection.commit();
      console.log('Transaction réussie');

      res.status(200).json({ 
        success: true,
        message: 'Livre emprunté avec succès',
        borrowingId: insertResult.insertId
      });

    } catch (transactionError) {
      // Annuler la transaction en cas d'erreur
      await connection.rollback();
      console.error('Erreur transaction:', transactionError);
      
      throw transactionError; // Propage l'erreur au catch principal
    }

  } catch (error) {
    console.error('Erreur complète emprunt:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'emprunt',
      error: error.message
    });
  } finally {
    // Relâcher la connexion dans tous les cas
    if (connection) connection.release();
  }
});
// Route pour obtenir les emprunts de l'utilisateur
router.get('/my-borrowings', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    
    const [borrowings] = await db.query(`
      SELECT 
        b.id,
        b.book_isbn,
        b.borrow_date,
        b.return_date,
        b.status,
        bk.Title,
        bk.Author,
        bk.Picture_link,
        bk.Language
      FROM borrowings b
      JOIN books bk ON b.book_isbn = bk.ISBN
      WHERE b.user_id = ?
      ORDER BY b.borrow_date DESC
    `, [userId]);
    
    // Convertir les images si nécessaire
    const borrowingsWithImages = borrowings.map(item => {
      if (item.Picture_link) {
        return {
          ...item,
          Picture_link: `data:image/jpeg;base64,${item.Picture_link.toString('base64')}`
        };
      }
      return item;
    });
    
    res.status(200).json({
      success: true,
      borrowings: borrowingsWithImages
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

// Route pour annuler un emprunt par l'utilisateur (suppression complète)
router.post('/cancel-borrowing/:borrowingId', verifyToken, async (req, res) => {
  let connection;
  
  try {
    const borrowingId = req.params.borrowingId;
    const userId = req.userData.id;
    
    connection = await db.getConnection();
    
    // 1. Vérifier l'emprunt
    const [borrowings] = await connection.query(
      `SELECT * FROM borrowings 
       WHERE id = ? AND user_id = ? AND status = 'emprunté'`,
      [borrowingId, userId]
    );
    
    if (borrowings.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Emprunt non trouvé ou déjà annulé/retourné' 
      });
    }

    const borrowing = borrowings[0];

    // 2. Démarrer une transaction
    await connection.beginTransaction();

    try {
      // a. Augmenter la quantité du livre
      await connection.query(
        'UPDATE books SET Quantity = Quantity + 1 WHERE ISBN = ?',
        [borrowing.book_isbn]
      );

      // b. Supprimer l'emprunt au lieu de le marquer comme annulé
      await connection.query(
        `DELETE FROM borrowings WHERE id = ?`,
        [borrowingId]
      );

      // c. Valider la transaction
      await connection.commit();

      res.status(200).json({ 
        success: true,
        message: 'Emprunt annulé avec succès' 
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'annulation de l\'emprunt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});


// Route pour obtenir les statistiques d'emprunt de l'utilisateur
// Route pour obtenir les statistiques d'emprunt de l'utilisateur (version simplifiée)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    
    // Récupérer uniquement les statistiques d'emprunt
    const [stats] = await db.query(`
      SELECT
        COUNT(*) AS totalBorrowed,
        SUM(CASE WHEN status = 'emprunté' THEN 1 ELSE 0 END) AS currentBorrowed,
        SUM(CASE WHEN status = 'retourné' THEN 1 ELSE 0 END) AS returnedBooks
      FROM borrowings
      WHERE user_id = ?
    `, [userId]);
    
    res.status(200).json({
      success: true,
      totalBorrowed: stats[0].totalBorrowed || 0,
      currentBorrowed: stats[0].currentBorrowed || 0,
      returnedBooks: stats[0].returnedBooks || 0,
      unreadNotifications: 0 // Valeur par défaut
    });
    
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;    
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    res.status(200).json({ 
      success: true, 
      count: result[0].count 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les notifications d'un utilisateur
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    
    const [notifications] = await db.query(`
      SELECT n.id, n.message, n.is_read, n.created_at, n.book_isbn, 
             b.Title as book_title, b.Author as book_author
      FROM notifications n
      LEFT JOIN books b ON n.book_isbn = b.ISBN
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `, [userId]);
    
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userData.id;    
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }
    
    res.status(200).json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// Marquer toutes les notifications comme lues
router.put('/notifications/mark-all-read', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;    
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Toutes les notifications ont été marquées comme lues',
      count: result.affectedRows
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// Compter les notifications non lues
router.get('/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;    
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    res.status(200).json({ 
      success: true, 
      count: result[0].count 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// Remplacer les deux versions par cette seule implémentation
router.get('/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;    
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    
    res.status(200).json({ 
      success: true, 
      count: result[0].count 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});



// Dans votre fichier de routes d'authentification
router.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // 1. Vérifiez le token Google avec la librairie Google Auth
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // 2. Cherchez ou créez l'utilisateur dans votre base de données
    let user = await User.findOne({ where: { email: payload.email } });
    
    if (!user) {
      // Création d'un nouvel utilisateur
      user = await User.create({
        email: payload.email,
        nom: payload.family_name,
        prenom: payload.given_name,
        googleId: payload.sub,
        role: 'utilisateur' // Par défaut
      });
    }
    
    // 3. Générez votre token JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 4. Renvoyez le token
    res.json({ 
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Erreur auth Google:', error);
    res.status(401).json({ message: 'Authentification Google échouée' });
  }
});
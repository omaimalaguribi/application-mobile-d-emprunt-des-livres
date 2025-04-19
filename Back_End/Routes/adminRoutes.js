const express = require('express');
const router = express.Router();
const db = require('../DB/db');
const { verifyToken, isAdmin } = require('../Middleware/auth');
const fs = require('fs');
const multer = require('multer');


if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Middleware pour vérifier si l'utilisateur est administrateur
router.use(verifyToken, isAdmin);
// Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, nom, prenom, email, telephone, cin, role FROM users');
    res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un utilisateur par ID
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query('SELECT id, nom, prenom, email, telephone, cin, role FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



// Middleware to check admin role
const checkAdmin = (req, res, next) => {
  if (req.userData.role !== 'administrateur') {
    return res.status(403).json({ message: 'Accès refusé - Droits d\'administrateur requis' });
  }
  next();
};

// Get all users
router.get('/users', verifyToken, checkAdmin, (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    // Remove password from the results
    const users = results.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json(users);
  });
});

// Get single user
router.get('/users/:id', verifyToken, checkAdmin, (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Remove password from the result
    const { password, ...userWithoutPassword } = results[0];
    
    res.status(200).json(userWithoutPassword);
  });
});

// Create user
router.post('/users', verifyToken, checkAdmin, (req, res) => {
  const { nom, prenom, email, telephone, cin, password, role } = req.body;
  
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
  }
  
  // Check if user already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'email:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hash password would normally go here
    // For simplicity, we'll insert directly
    
    const newUser = {
      nom,
      prenom,
      email,
      telephone: telephone || null,
      cin: cin || null,
      password, // In real app, this should be hashed
      role: role || 'utilisateur',
      created_at: new Date()
    };
    
    db.query('INSERT INTO users SET ?', newUser, (err, result) => {
      if (err) {
        console.error('Erreur lors de la création de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      
      const userId = result.insertId;
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        id: userId,
        ...userWithoutPassword
      });
    });
  });
});

// Update user
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { nom, prenom, email, telephone, cin, role } = req.body;
  
  if (!nom || !prenom || !email) {
    return res.status(400).json({ message: 'Nom, prénom et email sont obligatoires' });
  }

  try {
    // Vérifier si l'email existe déjà pour un autre utilisateur
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [email, userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const updatedUser = {
      nom,
      prenom,
      email,
      telephone: telephone || null,
      cin: cin || null,
      role: role || 'utilisateur'
    };

    const [result] = await db.query(
      'UPDATE users SET ? WHERE id = ?', 
      [updatedUser, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Retourner les données mises à jour sans le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      id: userId,
      ...userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Delete user
router.delete('/users/:id', verifyToken, checkAdmin, (req, res) => {
  const userId = req.params.id;
  
  db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  });
});



// Get all books
// Nouveau endpoint pour récupérer les livres
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

// Get single book
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

// Create book

// Endpoint pour ajouter un nouveau livre
// Dans AdminRoutes.js
router.post('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const { ISBN, Title, Author, Language, Date, Description, Quantity } = req.body;

    await db.query(
      `INSERT INTO books 
      (ISBN, Title, Author, Language, Date, Description, Quantity) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ISBN, Title, Author, Language, Date, Description, Quantity]
    );

    // Ajout de la notification après l'insertion du livre
    const message = `Nouveau livre disponible: "${Title}" par ${Author}. Empruntez-le vite avant qu'il ne soit indisponible!`;
    
    // Récupérer tous les utilisateurs (sauf les admins)
    const [users] = await db.query('SELECT id FROM users WHERE role = "utilisateur"');

    // Insérer une notification pour chaque utilisateur
    const insertPromises = users.map(user => {
      return db.query(
        'INSERT INTO notifications (user_id, message, is_read, created_at, book_isbn) VALUES (?, ?, 0, NOW(), ?)',
        [user.id, message, ISBN]  // Ajouter l'ISBN du livre
      );
    });

    await Promise.all(insertPromises); // Attendre que toutes les insertions soient terminées

    res.status(201).json({
      message: 'Livre ajouté avec succès',
      ISBN: ISBN
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});


// Route pour uploader l'image du livre
router.post('/books/:isbn/image', upload.single('bookImage'), async (req, res) => {
  const { isbn } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image n\'a été téléchargée' });
  }
  
  try {
    const imagePath = req.file.path;
    console.log(`Uploading image for ISBN ${isbn}: ${imagePath}`);
    
    // Vérifier si le livre existe
    const [books] = await db.query('SELECT * FROM books WHERE ISBN = ?', [isbn]);
    if (books.length === 0) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    
    // Lire le fichier image
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Mise à jour de la colonne Picture_link avec les données binaires de l'image
    const [result] = await db.query('UPDATE books SET Picture_link = ? WHERE ISBN = ?', [imageBuffer, isbn]);
    
    console.log('Update result:', result);
    
    res.status(200).json({ message: 'Image téléchargée avec succès' });
  } catch (error) {
    console.error('Erreur détaillée lors de la mise à jour de l\'image:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Update book
router.put('/books/:isbn', verifyToken, isAdmin, async (req, res) => {
  const isbn = req.params.isbn;
  const { Title, Author, Language, Date, Description, Quantity } = req.body;
  
  try {
    const updatedBook = {
      Title,
      Author,
      Language: Language || 'français',
      Date: Date || null,
      Description: Description || null,
      Quantity: Quantity ? parseInt(Quantity) : 0
    };
    
    const [result] = await db.query('UPDATE books SET ? WHERE ISBN = ?', [updatedBook, isbn]);
     
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    
    res.status(200).json({
      message: 'Livre mis à jour avec succès',
      ISBN: isbn,
      ...updatedBook
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// 1. Ajoutez cette route pour l'upload d'image
router.post('/books/:isbn/image', upload.single('bookImage'), async (req, res) => {
  const { isbn } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Aucune image téléchargée' });
  }
  
  try {
    // Vérifier si le livre existe
    const [books] = await db.query('SELECT ISBN FROM books WHERE ISBN = ?', [isbn]);
    if (books.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Lire le fichier image
    const imageBuffer = fs.readFileSync(req.file.path);
    
    // Mise à jour de l'image
    await db.query(
      'UPDATE books SET Picture_link = ? WHERE ISBN = ?',
      [imageBuffer, isbn]
    );
    
    // Nettoyage
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({ 
      message: 'Image mise à jour avec succès',
      imageSize: imageBuffer.length
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// 2. Ajoutez cette route pour récupérer l'image
router.get('/books/:isbn/image', async (req, res) => {
  try {
    const { isbn } = req.params;
    const [books] = await db.query(
      'SELECT Picture_link FROM books WHERE ISBN = ?', 
      [isbn]
    );
    
    if (books.length === 0 || !books[0].Picture_link) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    
    const imageBase64 = books[0].Picture_link.toString('base64');
    res.status(200).json({
      image: `data:image/jpeg;base64,${imageBase64}`
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Delete book
router.delete('/books/:isbn', verifyToken, isAdmin, async (req, res) => {
  try {
    const isbn = req.params.isbn;
    const [result] = await db.query('DELETE FROM books WHERE ISBN = ?', [isbn]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    
    res.status(200).json({ message: 'Livre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});
// Dans votre fichier de routes admin
router.get('/user/profile-picture/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send('Authentification requise');
    }
    
    // Vérification que l'utilisateur est bien admin (à adapter selon votre logique d'authentification)
    // ...
    
    const [users] = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [req.params.userId]
    );

    if (!users[0] || !users[0].profile_picture) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    // Renvoyer l'image en base64
    res.json({ profile_picture: users[0].profile_picture.toString('base64') });
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les statistiques du tableau de bord admin
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    // Requête pour obtenir le nombre total d'utilisateurs
    const [usersResult] = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Requête pour obtenir le nombre total de livres
    const [booksResult] = await db.query('SELECT COUNT(*) as count FROM books');
    
    // Requête pour obtenir le nombre de livres retournés
    const [returnedBooksResult] = await db.query(
      `SELECT COUNT(*) as count FROM borrowings WHERE status = 'retourné'`
    );
    
    // Requête pour obtenir le nombre d'emprunts actifs
    const [activeBorrowingsResult] = await db.query(
      `SELECT COUNT(*) as count FROM borrowings WHERE status = 'emprunté'`
    );
    
    const stats = {
      usersCount: usersResult[0].count,
      booksCount: booksResult[0].count,
      returnedBooksCount: returnedBooksResult[0].count,
      activeBorrowingsCount: activeBorrowingsResult[0].count
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: error.message
    });
  }
});


// Route pour obtenir tous les emprunts
router.get('/borrowings', verifyToken, isAdmin, async (req, res) => {
  try {
    const [borrowings] = await db.query(`
      SELECT 
        b.id,
        b.book_isbn,
        b.user_id,
        b.borrow_date,
        b.return_date,
        b.status,
        bk.Title AS book_title,
        bk.Author AS book_author,
        u.nom AS user_nom,
        u.prenom AS user_prenom
      FROM borrowings b
      JOIN books bk ON b.book_isbn = bk.ISBN
      JOIN users u ON b.user_id = u.id
      ORDER BY b.borrow_date DESC
    `);
    
    res.status(200).json(borrowings);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Route pour marquer un emprunt comme retourné
router.post('/borrowings/:id/return', async (req, res) => {
  let connection;
  
  try {
    const borrowingId = req.params.id;
    
    connection = await db.getConnection();
    
    // 1. Vérifier l'emprunt
    const [borrowings] = await connection.query(
      `SELECT * FROM borrowings 
       WHERE id = ? AND status = 'emprunté'`,
      [borrowingId]
    );
    
    if (borrowings.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Emprunt non trouvé ou déjà retourné' 
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

      // b. Marquer l'emprunt comme retourné
      await connection.query(
        `UPDATE borrowings 
         SET status = 'retourné', return_date = NOW() 
         WHERE id = ?`,
        [borrowingId]
      );

      // c. Valider la transaction
      await connection.commit();

      res.status(200).json({ 
        success: true,
        message: 'Livre marqué comme retourné avec succès' 
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Erreur retour:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du retour du livre',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});
module.exports = router;

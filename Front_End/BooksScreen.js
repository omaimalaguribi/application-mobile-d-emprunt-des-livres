import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Image, 
  ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

const API_URL = 'http://10.0.2.2:5000/api/user';

const UserBooksScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const booksWithImages = response.data.map(book => {
        let pictureUri = null;
        
        if (book.Picture_link) {
          if (typeof book.Picture_link === 'string') {
            pictureUri = book.Picture_link.startsWith('http') 
              ? book.Picture_link 
              : `http://10.0.2.2:5000${book.Picture_link}`;
          } else if (book.Picture_link.data) {
            pictureUri = `data:image/jpeg;base64,${Buffer.from(book.Picture_link).toString('base64')}`;
          }
        }
        
        return {
          ...book,
          Picture_link: pictureUri
        };
      });

      setBooks(booksWithImages);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBooks().finally(() => setRefreshing(false));
  };

  const handleBookAction = (book) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const BookImage = ({ imageData }) => {
    const [error, setError] = useState(false);
  
    if (error || !imageData) {
      return (
        <View style={styles.bookImagePlaceholder}>
          <Icon name="book" size={40} color="#87512a" />
        </View>
      );
    }
  
    return (
      <Image 
        source={{ uri: imageData }}
        style={styles.bookImage}
        resizeMode="cover"
        onError={() => {
          console.log("Erreur de chargement de l'image");
          setError(true);
        }}
      />
    );
  };

  const handleEmprunterBook = async (isbn) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(`Emprunt du livre avec ISBN: ${isbn}`);
      console.log(`Token utilisé: ${token.substring(0, 10)}...`); // Affiche le début du token
      
      const response = await axios.post(
        `${API_URL}/borrow/${isbn}`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Réponse du serveur:', response.data);
      Alert.alert('Succès', 'Livre emprunté avec succès');
      setShowBookModal(false);
      fetchBooks();
    } catch (error) {
      console.error('Erreur lors de l\'emprunt:', error);
      console.error('Détails de l\'erreur:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      Alert.alert(
        'Erreur', 
        error.response?.data?.message || 
        error.message || 
        'Impossible d\'emprunter le livre'
      );
    }
  };
  const filteredBooks = books.filter(book => 
    book.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.Author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.ISBN?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredByLanguage = searchQuery 
    ? filteredBooks 
    : selectedLanguage === 'all' 
      ? books 
      : books.filter(book => book.Language?.toLowerCase() === selectedLanguage.toLowerCase());

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
        <Text style={styles.loadingText}>Chargement des livres...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Contenu principal */}
      <View style={styles.mainContent}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ISBN, titre ou auteur..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filtres par langue */}
        <View style={styles.languageFilterContainer}>
          <Text style={styles.filterTitle}>Filtrer par langue:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languagesContainer}
          >
            <TouchableOpacity 
              style={[
                styles.languageChip, 
                selectedLanguage === 'all' && styles.languageChipActive
              ]} 
              onPress={() => setSelectedLanguage('all')}
            >
              <Text style={[
                styles.languageChipText,
                selectedLanguage === 'all' && styles.languageChipTextActive
              ]}>
                Tous
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageChip, 
                selectedLanguage === 'french' && styles.languageChipActive
              ]} 
              onPress={() => setSelectedLanguage('french')}
            >
              <Text style={[
                styles.languageChipText,
                selectedLanguage === 'french' && styles.languageChipTextActive
              ]}>
                Français
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageChip, 
                selectedLanguage === 'anglais' && styles.languageChipActive
              ]} 
              onPress={() => setSelectedLanguage('anglais')}
            >
              <Text style={[
                styles.languageChipText,
                selectedLanguage === 'anglais' && styles.languageChipTextActive
              ]}>
                Anglais
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageChip, 
                selectedLanguage === 'arabic' && styles.languageChipActive
              ]} 
              onPress={() => setSelectedLanguage('arabic')}
            >
              <Text style={[
                styles.languageChipText,
                selectedLanguage === 'arabic' && styles.languageChipTextActive
              ]}>
                Arabe
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Liste des livres */}
        <FlatList
          data={filteredByLanguage}
          keyExtractor={(item) => item.ISBN?.toString() || Math.random().toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.bookCardGrid}
              onPress={() => handleBookAction(item)}
            >
              <View style={styles.bookImageContainer}>
                <BookImage imageData={item.Picture_link} />
              </View>
              <View style={styles.bookInfoContainer}>
                <Text style={styles.bookGridTitle} numberOfLines={2}>{item.Title}</Text>
                <Text style={styles.bookGridAuthor} numberOfLines={1}>{item.Author}</Text>
                <View style={styles.bookLanguageContainer}>
                  <Text style={styles.bookLanguage}>{item.Language}</Text>
                </View>
                <View style={styles.availabilityContainer}>
                  <Text style={[
                    styles.availabilityText,
                    item.Quantity > 0 ? styles.available : styles.unavailable
                  ]}>
                    {item.Quantity > 0 ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="book" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Aucun livre trouvé</Text>
            </View>
          }
          contentContainerStyle={styles.booksListContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>

      {/* Barre de navigation en bas */}
      <View style={styles.bottomNavBar}>
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('UserDashboard')}
  >
    <Icon name="home" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Accueil</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('Books')}
  >
    <Icon name="book" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Livres</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('MyBooks')}
  >
    <Icon name="bookmark" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Emprunts</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('UserProfile')}
  >
    <Icon name="user" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Profil</Text>
  </TouchableOpacity>
</View>

      {/* Modal de détail du livre */}
      <Modal
        visible={showBookModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bookDetailModal}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.bookHeader}>
                <View style={styles.bookImageWrapper}>
                  {selectedBook?.Picture_link ? (
                    <Image 
                      source={{ uri: selectedBook.Picture_link }}
                      style={styles.bookModalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.bookImagePlaceholder}>
                      <Icon name="book" size={50} color="#87512a" />
                    </View>
                  )}
                </View>
                
                <View style={styles.bookTitleWrapper}>
                  <Text style={styles.bookModalTitle} numberOfLines={2}>{selectedBook?.Title}</Text>
                  <Text style={styles.bookModalAuthor}>Par {selectedBook?.Author}</Text>
                  <View style={styles.bookLanguageTag}>
                    <Text style={styles.bookLanguageText}>{selectedBook?.Language}</Text>
                  </View>
                  <View style={styles.bookAvailability}>
                    <Text style={[
                      styles.availabilityText,
                      selectedBook?.Quantity > 0 ? styles.available : styles.unavailable
                    ]}>
                      {selectedBook?.Quantity > 0 ? 'Disponible' : 'Indisponible'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Informations</Text>
              
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Icon name="barcode" size={20} color="#87512a" style={styles.infoIcon} />
                  <View style={styles.infoTextWrapper}>
                    <Text style={styles.infoLabel}>ISBN</Text>
                    <Text style={styles.infoValue}>{selectedBook?.ISBN || 'Non spécifié'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="calendar" size={20} color="#87512a" style={styles.infoIcon} />
                  <View style={styles.infoTextWrapper}>
                    <Text style={styles.infoLabel}>Date de publication</Text>
                    <Text style={styles.infoValue}>{selectedBook?.Date || 'Non spécifiée'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="hashtag" size={20} color="#87512a" style={styles.infoIcon} />
                  <View style={styles.infoTextWrapper}>
                    <Text style={styles.infoLabel}>Quantité disponible</Text>
                    <Text style={styles.infoValue}>{selectedBook?.Quantity || 0}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {selectedBook?.Description || 'Aucune description disponible pour ce livre.'}
              </Text>
            </ScrollView>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  selectedBook?.Quantity <= 0 && styles.disabledButton
                ]}
                onPress={() => {
                  Alert.alert(
                    'Confirmation',
                    'Êtes-vous sûr de vouloir emprunter ce livre ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { 
                        text: 'Emprunter', 
                        onPress: () => handleEmprunterBook(selectedBook?.ISBN) 
                      }
                    ]
                  );
                }}
                disabled={selectedBook?.Quantity <= 0}
              >
                <Icon name="bookmark" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {selectedBook?.Quantity > 0 ? 'Emprunter' : 'Indisponible'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.closeButton]}
                onPress={() => setShowBookModal(false)}
              >
                <Icon name="times" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  mainContent: {
    flex: 1,
    padding: 6,
    marginBottom: 60,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#F0E9E3',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#87512A',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#87512a',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
  },
  languageFilterContainer: {
    marginBottom: 15,
    marginTop: 5,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  languagesContainer: {
    flexDirection: 'row',
  },
  languageChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  languageChipActive: {
    backgroundColor: '#87512a',
  },
  languageChipText: {
    color: '#666',
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: '#fff',
  },
  booksListContainer: {
    paddingBottom: 80,
  },
  bookCardGrid: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    margin: 8,
    width: '46%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  bookImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  bookImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  bookInfoContainer: {
    width: '100%',
    paddingTop: 8,
  },
  bookGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookGridAuthor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
  },
  bookLanguageContainer: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  bookLanguage: {
    fontSize: 11,
    color: '#87512a',
    fontWeight: '500',
  },
  availabilityContainer: {
    alignSelf: 'center',
    marginTop: 4,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  available: {
    color: '#2ecc71',
  },
  unavailable: {
    color: '#e74c3c',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookDetailModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: 20,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  bookImageWrapper: {
    width: 110,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bookModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookTitleWrapper: {
    flex: 1,
  },
  bookModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookModalAuthor: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  bookLanguageTag: {
    backgroundColor: '#87512a20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#87512a40',
    marginBottom: 10,
  },
  bookLanguageText: {
    color: '#87512a',
    fontWeight: '500',
    fontSize: 12,
  },
  bookAvailability: {
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 30,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
    padding: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#87512a',
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 1,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  closeButton: {
    backgroundColor: '#95a5a6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UserBooksScreen;
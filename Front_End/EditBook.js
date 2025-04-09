import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = 'http://10.0.2.2:5000/api/admin';

const EditBook = ({ route, navigation }) => {
  const { book } = route.params;
  const [formData, setFormData] = useState({
    ISBN: book.ISBN || '',
    Title: book.Title || '',
    Author: book.Author || '',
    Language: book.Language || 'français',
    Date: book.Date ? book.Date.toString() : '', // Convertir en string si elle existe
    Description: book.Description || '',
    Quantity: book.Quantity ? book.Quantity.toString() : '0'
  });

  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  useEffect(() => {
    const fetchBookImage = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(
          `${API_URL}/books/${book.ISBN}/image`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.image) setImage(response.data.image);
      } catch (error) {
        console.log('Aucune image existante');
      } finally {
        setIsLoadingImage(false);
      }
    };
  
    fetchBookImage();
  }, [book.ISBN]);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée');
        navigation.navigate('Login');
        return;
      }
  
      if (!formData.Title || !formData.Author) {
        Alert.alert('Erreur', 'Le titre et l\'auteur sont obligatoires');
        return;
      }
  
      const response = await axios.put(
        `${API_URL}/books/${book.ISBN}`,
        {
          Title: formData.Title,
          Author: formData.Author,
          Language: formData.Language,
          Date: formData.Date,
          Description: formData.Description,
          Quantity: parseInt(formData.Quantity) || 0
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      Alert.alert('Succès', 'Livre mis à jour avec succès');
      navigation.navigate('Admin', { refresh: true });
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error.message);
      Alert.alert(
        'Erreur', 
        error.response?.data?.message || 'Erreur lors de la mise à jour'
      );
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };
  
  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image');
      return;
    }
  
    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée');
        navigation.navigate('Login');
        return;
      }
  
      if (image.startsWith('data:image')) {
        return;
      }
  
      const fileInfo = await FileSystem.getInfoAsync(image);
      if (!fileInfo.exists) throw new Error('Fichier introuvable');
  
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      const fileType = image.split('.').pop();
      const formData = new FormData();
      formData.append('bookImage', {
        uri: `data:image/${fileType};base64,${base64}`,
        name: `book_image.${fileType}`,
        type: `image/${fileType}`,
      });
  
      const response = await axios.post(
        `${API_URL}/books/${book.ISBN}/image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      Alert.alert('Succès', response.data.message || 'Image mise à jour avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(
        'Erreur', 
        error.response?.data?.message || error.message || 'Échec de l\'upload'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
     

      {isLoadingImage ? (
        <ActivityIndicator size="large" color="#87512a" />
      ) : (
        <View style={styles.imageSection}>
          {image ? (
            <Image 
              source={{ uri: image }} 
              style={styles.image} 
              onError={() => setImage(null)}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Icon name="image" size={50} color="#ccc" />
              <Text style={styles.noImageText}>Aucune image</Text>
            </View>
          )}
          
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={pickImage}
              disabled={isUploading}
            >
              <Icon name="image" size={16} color="#fff" />
              <Text style={styles.imageButtonText}>Choisir une image</Text>
            </TouchableOpacity>
            
            {image && !image.startsWith('data:image') && (
              <TouchableOpacity 
                style={[styles.imageButton, { backgroundColor: '#28a745' }]} 
                onPress={uploadImage}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="upload" size={16} color="#fff" />
                    <Text style={styles.imageButtonText}>Envoyer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>ISBN</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formData.ISBN}
          editable={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          value={formData.Title}
          onChangeText={(text) => setFormData({...formData, Title: text})}
          placeholder="Titre du livre"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Auteur *</Text>
        <TextInput
          style={styles.input}
          value={formData.Author}
          onChangeText={(text) => setFormData({...formData, Author: text})}
          placeholder="Auteur du livre"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Langue</Text>
        <TextInput
          style={styles.input}
          value={formData.Language}
          onChangeText={(text) => setFormData({...formData, Language: text})}
          placeholder="Langue du livre"
        />
      </View>

      

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date</Text>
        <TextInput
  style={styles.input}
  value={formData.Date}
  onChangeText={(text) => setFormData({...formData, Date: text})}
  placeholder="Année de publication (ex: 1960)"
  keyboardType="numeric"
  maxLength={4} // Pour n'autoriser que 4 chiffres pour une année
/>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Quantité</Text>
        <TextInput
          style={styles.input}
          value={formData.Quantity}
          onChangeText={(text) => setFormData({...formData, Quantity: text})}
          placeholder="Quantité disponible"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.Description}
          onChangeText={(text) => setFormData({...formData, Description: text})}
          placeholder="Description du livre"
          multiline
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButtonBottom]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]} 
          onPress={handleUpdate}
        >
          <Icon name="save" size={16} color="#fff" />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#87512a',
    textAlign: 'center',
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  cancelButtonText: {
    color: '#87512a',
    marginLeft: 5,
  },
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  noImageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noImageText: {
    marginTop: 10,
    color: '#999',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  imageButton: {
    backgroundColor: '#87512a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButtonBottom: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#87512a',
  },
  actionButtonText: {
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default EditBook;
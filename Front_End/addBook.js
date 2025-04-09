import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';

const API_URL = 'http://10.0.2.2:5000/api/admin';
const AddBookScreen = ({ navigation }) => {
  const [bookData, setBookData] = useState({
    ISBN: '',
    Title: '',
    Author: '',
    Language: 'anglais',
    // Supprimez Domain: '',
    Date: '',
    Description: '',
    Quantity: ''
  });
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
 
  
  const languageOptions = [
    { label: 'Anglais', value: 'anglais' },
    { label: 'Français', value: 'français' },
    { label: 'Espagnol', value: 'espagnol' },
    { label: 'Allemand', value: 'allemand' },
    { label: 'Italien', value: 'italien' },
    { label: 'Arabe', value: 'arabe' }
  ];
  
  const handleInputChange = (field, value) => {
    setBookData({
      ...bookData,
      [field]: value
    });
  };
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'autorisation d'accéder à la galerie est requise.");
        return;
      }
  
      // Modifier cette partie - Ne pas utiliser MediaType.Images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Utiliser MediaTypeOptions au lieu de MediaType
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      console.log("Image picker result:", result);
      
      if (!result.canceled) {
        console.log("Selected image:", result.assets[0]);
        setImage(result.assets[0].uri);
        console.log("Image URI set to:", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };
  
  const validateForm = () => {
    const { ISBN, Title, Author, Quantity } = bookData; 
    if (!ISBN.trim()) {
      Alert.alert("Erreur", "L'ISBN est obligatoire");
      return false;
    }
    if (!Title.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return false;
    }
    if (!Author.trim()) {
      Alert.alert("Erreur", "L'auteur est obligatoire");
      return false;
    }
    if (!Quantity || isNaN(Quantity) || parseInt(Quantity) <= 0) {
      Alert.alert("Erreur", "La quantité doit être un nombre positif");
      return false;
    }
    
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté");
        return;
      }
  
      // 1. Envoyer les données du livre
      const response = await axios.post(
        `${API_URL}/books`,
        {
          ISBN: bookData.ISBN,
          Title: bookData.Title,
          Author: bookData.Author,
          Language: bookData.Language,
          // Supprimez Domain: bookData.Domain,
          Date: bookData.Date,
          Description: bookData.Description,
          Quantity: parseInt(bookData.Quantity)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // 2. Upload de l'image si elle existe
      if (image) {
        const formData = new FormData();
        formData.append('bookImage', {
          uri: image,
          name: `book_${bookData.ISBN}.jpg`,
          type: 'image/jpeg'
        });
  
        await axios.post(
          `${API_URL}/books/${bookData.ISBN}/image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
  
      Alert.alert("Succès", "Livre ajouté avec succès");
      navigation.goBack();
    } catch (error) {
      console.error("Erreur détaillée:", error.response?.data || error.message);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Échec de l'ajout du livre"
      );
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un livre</Text>
        <View style={styles.placeholder}></View>
      </View>
      
      <ScrollView style={styles.formContainer}>
        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={styles.imagePicker} 
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="camera" size={40} color="#87512a" />
                <Text style={styles.placeholderText}>Ajouter une image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>ISBN*</Text>
          <TextInput
            style={styles.input}
            placeholder="ISBN du livre"
            value={bookData.ISBN}
            onChangeText={(text) => handleInputChange('ISBN', text)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre*</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre du livre"
            value={bookData.Title}
            onChangeText={(text) => handleInputChange('Title', text)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Auteur*</Text>
          <TextInput
            style={styles.input}
            placeholder="Auteur du livre"
            value={bookData.Author}
            onChangeText={(text) => handleInputChange('Author', text)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Langue</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={bookData.Language}
              style={styles.picker}
              onValueChange={(itemValue) => handleInputChange('Language', itemValue)}
            >
              {languageOptions.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de publication</Text>
          <TextInput
            style={styles.input}
            placeholder="Année de publication (ex: 2023)"
            value={bookData.Date} // Changed from Publication_date to Date
            onChangeText={(text) => handleInputChange('Date', text)} // Changed from Publication_date to Date
            keyboardType="numeric"
          />
        </View>
        <View style={styles.formGroup}>
  <Text style={styles.label}>Quantité*</Text>
  <TextInput
    style={styles.input}
    placeholder="Nombre d'exemplaires"
    value={bookData.Quantity}
    onChangeText={(text) => handleInputChange('Quantity', text)}
    keyboardType="numeric"
  />
</View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description du livre"
            value={bookData.Description}
            onChangeText={(text) => handleInputChange('Description', text)}
            multiline={true}
            numberOfLines={4}
          />
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="plus" size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Ajouter le livre</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#87512a',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 36,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePicker: {
    width: 150,
    height: 220,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#87512a',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  submitButton: {
    backgroundColor: '#87512a',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AddBookScreen;
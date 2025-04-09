import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api/user';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation côté client
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Tous les champs sont obligatoires');
      return;
    }
  
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
  
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }
  
      const response = await axios.put(
        `${API_URL}/change-password`,
        { currentPassword, newPassword },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('Réponse:', response.data);
      alert(response.data.message);
      navigation.goBack();
  
    } catch (error) {
      console.error('Erreur complète:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      alert(
        error.response?.data?.message || 
        'Erreur lors du changement de mot de passe'
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Ajoutez ces états
const [errors, setErrors] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateField = (name, value) => {
  let error = '';
  
  if (!value) {
    error = 'Ce champ est requis';
  } else if (name === 'newPassword' && value.length < 6) {
    error = '6 caractères minimum';
  } else if (name === 'confirmPassword' && value !== newPassword) {
    error = 'Ne correspond pas';
  }
  
  setErrors(prev => ({ ...prev, [name]: error }));
};

// Modifiez vos TextInputs :
<TextInput
  style={[
    styles.input, 
    errors.currentPassword && styles.inputError
  ]}
  secureTextEntry
  value={currentPassword}
  onChangeText={(text) => {
    setCurrentPassword(text);
    validateField('currentPassword', text);
  }}
/>
{errors.currentPassword ? (
  <Text style={styles.errorText}>{errors.currentPassword}</Text>
) : null}

  return (
    <View style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Mot de passe actuel</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Changer le mot de passe</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F5F2',
  },
  formGroup: {
    marginBottom: 20,
  },
  // Ajoutez dans votre StyleSheet
errorText: {
  color: 'red',
  marginTop: 5,
  fontSize: 14,
},
inputError: {
  borderColor: 'red',
},
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#87512a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;
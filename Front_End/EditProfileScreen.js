import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api/user';

const EditProfileScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    cin: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(route.params.user);

  useEffect(() => {
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      cin: user.cin || ''
    });
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      
      // Debug
      console.log('Données envoyées:', JSON.stringify(formData));
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token:', token);
  
      const response = await axios.put(`${API_URL}/profile`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Réponse:', response.data);
      navigation.navigate('UserProfile');
  
    } catch (error) {
      console.error('Erreur complète:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      Alert.alert(
        'Erreur',
        error.response?.data?.message || error.message,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={formData.nom}
          onChangeText={(text) => setFormData({...formData, nom: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          value={formData.prenom}
          onChangeText={(text) => setFormData({...formData, prenom: text})}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          value={formData.telephone}
          onChangeText={(text) => setFormData({...formData, telephone: text})}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>CIN</Text>
        <TextInput
          style={styles.input}
          value={formData.cin}
          onChangeText={(text) => setFormData({...formData, cin: text})}
        />
      </View>

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleUpdateProfile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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

export default EditProfileScreen;
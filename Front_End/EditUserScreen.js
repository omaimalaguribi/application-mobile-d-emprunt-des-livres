import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api/admin';

const EditUserScreen = ({ route, navigation }) => {
  const { user } = route.params;
  const [formData, setFormData] = useState({
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    telephone: user.telephone || '',
    cin: user.cin || '',
    role: user.role || 'utilisateur'
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(
        `${API_URL}/users/${user.id}`, 
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      // Solution optimale : passer un callback de mise à jour
      if (route.params?.onUserUpdated) {
        route.params.onUserUpdated({
          id: user.id,
          ...formData
        });
      }
  
      // Retour à l'écran précédent avec les données fraîches
      navigation.goBack();
      
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      let errorMessage = 'Échec de la mise à jour';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Données invalides';
        } else if (error.response.status === 401) {
          errorMessage = 'Non autorisé - Session expirée';
        } else if (error.response.status === 404) {
          errorMessage = 'Utilisateur non trouvé';
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
    >
     
      
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={formData.nom}
            onChangeText={(text) => setFormData({...formData, nom: text})}
            placeholder="Entrez le nom"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={formData.prenom}
            onChangeText={(text) => setFormData({...formData, prenom: text})}
            placeholder="Entrez le prénom"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="email@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={formData.telephone}
            onChangeText={(text) => setFormData({...formData, telephone: text})}
            placeholder="+212 6..."
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CIN</Text>
          <TextInput
            style={styles.input}
            value={formData.cin}
            onChangeText={(text) => setFormData({...formData, cin: text})}
            placeholder="Numéro CIN"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rôle *</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'utilisateur' && styles.roleButtonActive
              ]}
              onPress={() => setFormData({...formData, role: 'utilisateur'})}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.roleText,
                formData.role === 'utilisateur' && styles.roleTextActive
              ]}>
                Utilisateur
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'administrateur' && styles.roleButtonActive
              ]}
              onPress={() => setFormData({...formData, role: 'administrateur'})}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.roleText,
                formData.role === 'administrateur' && styles.roleTextActive
              ]}>
                Administrateur
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton, isSubmitting && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="save" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Mettre à jour</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleButtonActive: {
    backgroundColor: '#87512a',
    borderColor: '#87512a',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#87512a',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

export default EditUserScreen;
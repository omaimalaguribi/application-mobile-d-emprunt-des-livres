import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000'; // Remplacez X par votre IP locale

const RegisterScreen = ({ navigation }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour la gestion des alertes personnalisées
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' ou 'error'
  const [emailError, setEmailError] = useState('');

  // Fonction pour valider le format de l'email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour afficher une alerte personnalisée
  const showCustomAlert = (title, message, type) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    try {
      // Réinitialiser les erreurs d'email
      setEmailError('');
      
      // Validation basique
      if (!nom || !prenom || !email || !telephone || !cin || !password) {
        return showCustomAlert('Champs manquants', 'Tous les champs sont obligatoires', 'error');
      }

      // Validation du format de l'email
      if (!validateEmail(email)) {
        setEmailError('Format d\'email invalide');
        return;
      }

      setIsLoading(true);

      // Appel API pour l'inscription
      const response = await axios.post(`${API_URL}/api/users/register`, {
        nom,
        prenom,
        email,
        telephone,
        cin,
        password,
        role: 'utilisateur' // Ajoute le rôle par défaut
      });

      setIsLoading(false);

      // Stocker le token JWT
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userId', String(response.data.userId));

      // Afficher message de succès
      showCustomAlert(
        'Inscription réussie',
        'Votre compte a été créé avec succès',
        'success'
      );
    } catch (error) {
      setIsLoading(false);
      
      // Gestion des erreurs
      const errorMessage = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Une erreur est survenue lors de l\'inscription';
      
      showCustomAlert('Erreur', errorMessage, 'error');
      console.error('Erreur inscription:', error);
    }
  };

  // Composant d'alerte personnalisée
  const CustomAlert = () => {
    return (
      <Modal
        transparent={true}
        visible={alertVisible}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={[styles.alertHeader, alertType === 'success' ? styles.successHeader : styles.errorHeader]}>
              <Text style={styles.alertTitle}>{alertTitle}</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.alertButton, alertType === 'success' ? styles.successButton : styles.errorButton]} 
              onPress={() => {
                setAlertVisible(false);
                if (alertType === 'success') {
                  navigation.navigate('Login');
                }
              }}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Alerte personnalisée */}
      <CustomAlert />
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      <View style={styles.headerContainer}>
        <Image
          source={require('./photos/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.registerText}>Inscription</Text>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Icon name="user" size={20} color="#87512a" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#A9A9A9"
              value={nom}
              onChangeText={setNom}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="user" size={20} color="#87512a" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor="#A9A9A9"
              value={prenom}
              onChangeText={setPrenom}
            />
          </View>

          <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
            <Icon name="envelope" size={20} color={emailError ? "#ff3b30" : "#87512a"} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
            />
            {email && (
              <Icon 
                name={validateEmail(email) ? "check" : "times"} 
                size={20} 
                color={validateEmail(email) ? "#4CD964" : "#ff3b30"} 
              />
            )}
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#87512a" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              placeholderTextColor="#A9A9A9"
              keyboardType="phone-pad"
              value={telephone}
              onChangeText={setTelephone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="id-card" size={20} color="#87512a" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="CIN"
              placeholderTextColor="#A9A9A9"
              value={cin}
              onChangeText={setCin}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#87512a" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#A9A9A9"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon 
                name={showPassword ? "eye-slash" : "eye"} 
                size={20} 
                color="#87512a" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>S'inscrire</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87512a',
  },
  headerContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  formContainer: {
    flex: 2.2,
    backgroundColor: '#ededed',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  registerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333333',
  },
  registerButton: {
    backgroundColor: '#87512a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    color: '#87512a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour l'overlay de chargement
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  // Styles pour l'alerte personnalisée
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  alertHeader: {
    padding: 15,
    alignItems: 'center',
  },
  successHeader: {
    backgroundColor: '#55d66c',
  },
  errorHeader: {
    backgroundColor: '#f55d55',
  },
  alertTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertBody: {
    padding: 20,
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  alertButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  successButton: {
    backgroundColor: '#f8f8f8',
  },
  errorButton: {
    backgroundColor: '#f8f8f8',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#87512a',
  },
});

export default RegisterScreen;
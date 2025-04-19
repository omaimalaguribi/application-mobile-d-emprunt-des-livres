import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:5000/api'; // Pour l'émulateur Android, utilisez l'IP réelle pour les appareils physiques


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
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




  const handleLogin = async () => {
    setEmailError('');
    
    if (!email || !password) {
      return showCustomAlert('Champs manquants', 'Veuillez remplir tous les champs', 'error');
    }
    
    if (!validateEmail(email)) {
      setEmailError('Format d\'email invalide');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      setIsLoading(false);
      
      // REDIRECTION CORRIGÉE ICI:
      if (user.role === 'administrateur') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Admin' }]
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'UserDashboard' }]
        });
      }
      
    } catch (error) {
      setIsLoading(false);
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      if (error.response) {
        if (error.response.status === 401) {
          message = 'Email ou mot de passe incorrect';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        }
      }
      
      showCustomAlert('Erreur', message, 'error');
    }
  };
  
 

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
            <View style={[styles.alertHeader, 
              alertType === 'success' ? styles.successHeader : 
              alertType === 'info' ? styles.infoHeader : styles.errorHeader]}
            >
              <Text style={styles.alertTitle}>{alertTitle}</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.alertButton, 
                alertType === 'success' ? styles.successButton : 
                alertType === 'info' ? styles.infoButton : styles.errorButton]} 
              onPress={() => {
                setAlertVisible(false);
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
      
      <View style={styles.logoContainer}>
        <Image
          source={require('./photos/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.loginText}>Connexion</Text>
        
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

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            Se connecter
          </Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          
          disabled={isLoading}
        >
          <Icon name="google" size={24} color="#ffffff" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Connexion avec Google</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Vous n'avez pas un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87512a',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: '0%',
  },
  formContainer: {
    flex: 1.8,
    backgroundColor: '#ededed',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#87512a',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#87512a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#c0a59e',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    paddingHorizontal: 10,
    color: '#A9A9A9',
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#a19e9e', 
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#333333',
    fontSize: 16,
    fontWeight:'bold',
  },
  registerLink: {
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
  infoHeader: {
    backgroundColor: '#3498db',
  },
  errorHeader: {
    backgroundColor: '#f55d55',
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
  infoButton: {
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
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default LoginScreen;
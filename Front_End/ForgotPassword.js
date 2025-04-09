import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:5000/api'; // Pour l'émulateur Android, utilisez l'IP réelle pour les appareils physiques

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('request'); // 'request', 'confirmation', 'reset'
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // États pour la gestion des alertes personnalisées
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' ou 'error'

  // Fonction pour valider les emails
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

  // Fonction pour gérer la demande de réinitialisation de mot de passe
  const handleRequestReset = async () => {
    setEmailError('');
    
    if (!email) {
      return showCustomAlert('Champ manquant', 'Veuillez entrer votre adresse email', 'error');
    }
    
    if (!validateEmail(email)) {
      setEmailError('Format d\'email invalide');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/users/forgot-password`, { email });
      
      setIsLoading(false);
      showCustomAlert('Email envoyé', 'Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.', 'success');
      setStep('confirmation');
      
    } catch (error) {
      setIsLoading(false);
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      if (error.response) {
        message = error.response.data.message || message;
      }
      
      showCustomAlert('Erreur', message, 'error');
    }
  };

  // Fonction pour gérer la réinitialisation du mot de passe
// Fonction pour gérer la réinitialisation du mot de passe
const handleResetPassword = async () => {
    setPasswordError('');
    
    if (!token) {
      return showCustomAlert('Champ manquant', 'Veuillez entrer le code de réinitialisation', 'error');
    }
    
    if (!newPassword || !confirmPassword) {
      return showCustomAlert('Champs manquants', 'Veuillez remplir tous les champs', 'error');
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/users/reset-password`, {
        email: email,         // Ajoutez l'email ici
        resetCode: token,     // Renommez token en resetCode
        newPassword
      });
      
      setIsLoading(false);
      showCustomAlert('Succès', 'Votre mot de passe a été réinitialisé avec succès', 'success');
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      if (error.response) {
        message = error.response.data.message || message;
      }
      
      console.error('Erreur détaillée:', error);  // Ajoutez cette ligne pour déboguer
      showCustomAlert('Erreur', message, 'error');
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

  // Affichage en fonction de l'étape
  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <>
            <Text style={styles.instructionText}>
              Veuillez entrer votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
            </Text>
            
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
            
            <TouchableOpacity 
              style={[styles.actionButton, isLoading && styles.disabledButton]} 
              onPress={handleRequestReset}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                Envoyer le lien de réinitialisation
              </Text>
            </TouchableOpacity>
          </>
        );
        
      case 'confirmation':
        return (
          <>
            <Text style={styles.instructionText}>
              Un email de réinitialisation a été envoyé à votre adresse email. Veuillez entrer le code de réinitialisation ci-dessous.
            </Text>
            
            <View style={styles.inputContainer}>
              <Icon name="key" size={20} color="#87512a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Code de réinitialisation"
                placeholderTextColor="#A9A9A9"
                value={token}
                onChangeText={setToken}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#87512a" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordError('');
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  name={showPassword ? "eye-slash" : "eye"} 
                  size={20} 
                  color="#87512a" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
              <Icon name="lock" size={20} color={passwordError ? "#ff3b30" : "#87512a"} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setPasswordError('');
                }}
              />
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.actionButton, isLoading && styles.disabledButton]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                Réinitialiser le mot de passe
              </Text>
            </TouchableOpacity>
          </>
        );
        
      default:
        return null;
    }
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
          source={require('../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.headerText}>Mot de passe oublié</Text>
        
        {renderStep()}
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Icon name="arrow-left" size={20} color="#87512a" style={styles.backIcon} />
          <Text style={styles.backButtonText}>Retour à la connexion</Text>
        </TouchableOpacity>
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
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
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
  actionButton: {
    backgroundColor: '#87512a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#c0a59e',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backIcon: {
    marginRight: 10,
  },
  backButtonText: {
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
});

export default ForgotPasswordScreen;
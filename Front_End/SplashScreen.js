import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text, StatusBar } from 'react-native';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#87512a" barStyle="light-content" />
      
      {/* Section logo */}
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Ouma Books</Text>
        <Text style={styles.tagline}>book</Text>
      </View>
      
      {/* Section illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../assets/background.png')}
          style={styles.backgroundImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87512a',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 10,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 5,
  },
  illustrationContainer: {
    width: '100%',
    height: '40%',
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  }
});

export default SplashScreen;
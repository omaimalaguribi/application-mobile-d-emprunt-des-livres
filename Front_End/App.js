import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  StatusBar,
  SafeAreaView,
  ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Importation des écrans
import SplashScreen from './SplashScreen';
import LoginScreen from './login';
import RegisterScreen from './register';
import AdminScreen from './admin';
import ForgotPasswordScreen from './ForgotPassword';
import AddBookScreen from './addBook';
import EditBook from './EditBook';
import EditUserScreen from './EditUserScreen';
import AdminUsers from './AdminUsers';
import ChangePasswordScreen from './ChangePasswordScreen';
import MyBooksScreen from './MyBooksScreen';
import UserProfileScreen from './UserProfileScreen';
import UserDashboard from './UserDashboard';
import UserBooksScreen from './BooksScreen';
import EditProfileScreen from './EditProfileScreen';
import AdminBorrowings from './AdminEmpruntes';
import NotificationsScreen from './NotificationsScreen';

// Création du stack navigator
const Stack = createStackNavigator();

// Composant pour le menu basique (Modal)
const SimpleDrawer = ({ visible, onClose, navigation }) => {
  const navigateTo = (screenName) => {
    onClose();
    navigation.navigate(screenName);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.drawerContainer}>
          <ScrollView>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Ouma Books</Text>
              <Text style={styles.drawerSubtitle}>Votre bibliothèque</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="times" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuItems}>
              <MenuItem
                icon="home"
                label="Accueil"
                onPress={() => navigateTo('UserDashboard')}
              />
              <MenuItem
                icon="book"
                label="Livres disponibles"
                onPress={() => navigateTo('Books')}
              />
              <MenuItem
                icon="bookmark"
                label="Mes emprunts"
                onPress={() => navigateTo('MyBooks')}
              />
              <MenuItem
                icon="user"
                label="Mon profil"
                onPress={() => navigateTo('UserProfile')}
              />
              <MenuItem
                icon="bell"
                label="Notifications"
                onPress={() => navigateTo('Notifications')}
              />
              <View style={styles.separator} />
              <MenuItem
                icon="sign-out-alt"
                label="Déconnexion"
                onPress={() => {
                  onClose();
                  // Ajoutez votre logique de déconnexion ici
                   navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={onClose} 
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

// Composant pour un élément du menu
const MenuItem = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={22} color="#87512A" style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// Header personnalisé avec bouton menu
const CustomHeader = ({ title, navigation, openDrawer }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <Icon name="bars" size={20} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

// Wrapper pour les écrans utilisateur
const WithDrawer = ({ children, title, navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  return (
    <View style={{ flex: 1 }}>
      <CustomHeader 
        title={title} 
        navigation={navigation} 
        openDrawer={() => setDrawerVisible(true)} 
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
      <SimpleDrawer 
        visible={drawerVisible} 
        onClose={() => setDrawerVisible(false)} 
        navigation={navigation} 
      />
    </View>
  );
};

// App principal
const App = () => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#87512A" barStyle="light-content" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* Écrans d'authentification */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Écrans d'administration */}
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen 
          name="AddBook" 
          component={AddBookScreen}
          options={{
            headerShown: true,
            title: 'Ajouter un livre',
            headerStyle: {
              backgroundColor: '#f9f9f9',
            },
            headerTintColor: '#333',
          }}
        />
        <Stack.Screen 
          name="EditBook" 
          component={EditBook}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="UsersList"
          component={AdminUsers}
          options={{ 
            headerShown: true,
            title: 'Gestion des utilisateurs' 
          }}
        />
        <Stack.Screen
          name="EditUser"
          component={EditUserScreen}
          options={{ 
            headerShown: true,
            title: 'Modifier utilisateur' 
          }}
        />
        <Stack.Screen 
          name="adminemprunte" 
          component={AdminBorrowings}
          options={{ headerShown: true }}
        />
        
        {/* Écrans utilisateur avec drawer */}
        <Stack.Screen
          name="UserDashboard"
          component={(props) => (
            <WithDrawer title="Tableau de Bord" navigation={props.navigation}>
              <UserDashboard {...props} />
            </WithDrawer>
          )}
        />
        <Stack.Screen
          name="Books"
          component={(props) => (
            <WithDrawer title="Livres disponibles" navigation={props.navigation}>
              <UserBooksScreen {...props} />
            </WithDrawer>
          )}
        />
        <Stack.Screen
          name="MyBooks"
          component={(props) => (
            <WithDrawer title="Mes Emprunts" navigation={props.navigation}>
              <MyBooksScreen {...props} />
            </WithDrawer>
          )}
        />
        <Stack.Screen
          name="UserProfile"
          component={(props) => (
            <WithDrawer title="Mon Profil" navigation={props.navigation}>
              <UserProfileScreen {...props} />
            </WithDrawer>
          )}
        />
        <Stack.Screen
          name="Notifications"
          component={(props) => (
            <WithDrawer title="Notifications" navigation={props.navigation}>
              <NotificationsScreen {...props} />
            </WithDrawer>
          )}
        />
        
        {/* Écrans utilisateur sans drawer */}
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{ 
            headerShown: true,
            title: 'Modifier mon profil'
          }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{ 
            headerShown: true,
            title: 'Changer mon mot de passe'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '70%',
    backgroundColor: '#F8F5F2',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    backgroundColor: '#87512A',
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  drawerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  drawerSubtitle: {
    color: '#FFF',
    opacity: 0.8,
    marginTop: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIcon: {
    width: 30,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#87512A',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default App;
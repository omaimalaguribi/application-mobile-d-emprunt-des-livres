// frontend/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen 
          name="AddBook" 
          component={AddBookScreen} 
          options={{ 
            title: 'Ajouter un livre',
            headerStyle: {
              backgroundColor: '#f9f9f9',
            },
            headerTintColor: '#333',
          }}
        />
        <Stack.Screen name="EditBook" component={EditBook} />
        <Stack.Screen 
          name="UsersList" 
          component={AdminUsers} 
          options={{ title: 'Gestion des utilisateurs' }}
        />
        <Stack.Screen 
          name="EditUser" 
          component={EditUserScreen} 
          options={{ title: 'Modifier utilisateur' }}
        />
          <Stack.Screen 
        name="UserDashboard" 
        component={UserDashboard} 
        options={{ title: 'Tableau de Bord' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{ title: 'Mon Profil' }}
      />
      <Stack.Screen 
  name="Books" 
  component={UserBooksScreen} 
  options={{ title: 'Livres disponibles' }}
/>
      <Stack.Screen 
        name="MyBooks" 
        component={MyBooksScreen} 
        options={{ title: 'Mes Emprunts' }}
      />
     <Stack.Screen name="EditProfile" component={EditProfileScreen} />
     <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
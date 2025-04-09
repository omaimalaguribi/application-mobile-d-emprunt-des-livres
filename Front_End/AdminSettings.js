import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
const AdminSettings = ({ logout }) => {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Paramètres</Text>
      <View style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="user" size={20} color="#87512a" />
          <Text style={styles.settingText}>Profil administrateur</Text>
          <Icon name="chevron-right" size={16} color="#999" style={styles.settingArrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="lock" size={20} color="#87512a" />
          <Text style={styles.settingText}>Changer le mot de passe</Text>
          <Icon name="chevron-right" size={16} color="#999" style={styles.settingArrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="bell" size={20} color="#87512a" />
          <Text style={styles.settingText}>Notifications</Text>
          <Icon name="chevron-right" size={16} color="#999" style={styles.settingArrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="cog" size={20} color="#87512a" />
          <Text style={styles.settingText}>Préférences système</Text>
          <Icon name="chevron-right" size={16} color="#999" style={styles.settingArrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="database" size={20} color="#87512a" />
          <Text style={styles.settingText}>Sauvegarde des données</Text>
          <Icon name="chevron-right" size={16} color="#999" style={styles.settingArrow} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="sign-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  settingArrow: {
    marginLeft: 'auto',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AdminSettings;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AdminDashboard = ({ usersCount, booksCount }) => {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Tableau de bord</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="users" size={28} color="#87512a" />
          <Text style={styles.statValue}>{usersCount}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="book" size={28} color="#87512a" />
          <Text style={styles.statValue}>{booksCount}</Text>
          <Text style={styles.statLabel}>Livres</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="bookmark" size={28} color="#87512a" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Réservations</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="exchange" size={28} color="#87512a" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Emprunts actifs</Text>
        </View>
      </View>

      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityEmpty}>Aucune activité récente</Text>
        </View>
      </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    height: 120,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  activitySection: {
    marginTop: 10,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'center',
  },
  activityEmpty: {
    textAlign: 'center',
    color: '#999',
  },
});

export default AdminDashboard;
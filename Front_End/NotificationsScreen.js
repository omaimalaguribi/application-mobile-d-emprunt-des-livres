import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:5000/api/user';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour localement
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer la notification comme lue');
    }
  };

  const handleNotificationPress = (notification) => {
    // Marquer comme lue
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Rediriger vers le détail du livre si disponible
    if (notification.book_isbn) {
      navigation.navigate('BookDetail', { isbn: notification.book_isbn });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Format relatif pour aujourd'hui et hier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() >= today.getTime()) {
      return `Aujourd'hui à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.getTime() >= yesterday.getTime()) {
      return `Hier à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.is_read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {item.book_isbn ? (
          <Icon name="book" size={24} color="#87512a" solid />
        ) : (
          <Icon name="bell" size={24} color="#87512a" solid />
        )}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>{item.message}</Text>
        
        {item.book_title && (
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>
              {item.book_title} {item.book_author ? `- ${item.book_author}` : ''}
            </Text>
          </View>
        )}
        
        <Text style={styles.notificationTime}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const markAllAsRead = async () => {
    try {
      if (notifications.filter(n => !n.is_read).length === 0) {
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour localement
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#87512a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Tout marquer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-slash" size={50} color="#d3c0b2" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubText}>Les nouvelles notifications apparaîtront ici</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#87512a',
  },
  backButton: {
    padding: 6,
  },
  markAllButton: {
    padding: 6,
  },
  markAllText: {
    color: '#87512a',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadNotification: {
    backgroundColor: '#fcf6f0',
    borderLeftWidth: 4,
    borderLeftColor: '#87512a',
  },
  iconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontWeight: '400',
    lineHeight: 22,
  },
  bookInfo: {
    backgroundColor: '#f3eae2',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#87512a',
  },
  bookTitle: {
    fontSize: 14,
    color: '#5D3A1E',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#87512a',
    marginLeft: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#87512a',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#a08f83',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
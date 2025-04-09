import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const CustomAlert = ({ visible, title, message, type, onClose }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#55d66c';
      case 'error':
        return '#f55d55';
      case 'info':
        return '#3498db';
      default:
        return '#87512a';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.alertHeader, { backgroundColor: getBackgroundColor() }]}>
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertMessage}>{message}</Text>
          </View>
          <TouchableOpacity 
            style={styles.alertButton} 
            onPress={onClose}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
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
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#87512a',
  },
});

export default CustomAlert;
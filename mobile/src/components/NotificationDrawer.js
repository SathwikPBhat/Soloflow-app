import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

export default function NotificationDrawer() {
  const { darkMode } = useTheme();
  const { notifications, isDrawerOpen, toggleDrawer, markAllRead } =
    useNotifications();

  return (
    <Modal
      visible={isDrawerOpen}
      transparent
      animationType="slide"
      onRequestClose={toggleDrawer}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={toggleDrawer} />
        <View
          style={[
            styles.drawer,
            { backgroundColor: darkMode ? '#1f2937' : '#ffffff' },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text
              style={[
                styles.drawerTitle,
                { color: darkMode ? '#fff' : '#111827' },
              ]}
            >
              Notifications
            </Text>
            <View style={styles.drawerActions}>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={markAllRead} style={styles.markBtn}>
                  <Text style={styles.markText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleDrawer}>
                <Feather
                  name="x"
                  size={22}
                  color={darkMode ? '#9ca3af' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="bell-off"
                size={40}
                color={darkMode ? '#4b5563' : '#d1d5db'}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: darkMode ? '#6b7280' : '#9ca3af' },
                ]}
              >
                No notifications yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.notifItem,
                    {
                      backgroundColor: item.read
                        ? 'transparent'
                        : darkMode
                        ? '#1e3a5f'
                        : '#eff6ff',
                      borderBottomColor: darkMode ? '#374151' : '#e5e7eb',
                    },
                  ]}
                >
                  <Feather
                    name="bell"
                    size={16}
                    color={item.read ? '#6b7280' : '#3b82f6'}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.notifText,
                      { color: darkMode ? '#e5e7eb' : '#374151' },
                    ]}
                  >
                    {item.message}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  markText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  notifText: {
    flex: 1,
    fontSize: 14,
  },
});
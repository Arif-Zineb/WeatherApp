import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WeatherApp from './components/WeatherApp';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <WeatherApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
});
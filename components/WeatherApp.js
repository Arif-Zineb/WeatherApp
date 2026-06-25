import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export default function WeatherApp() {
  const [city, setCity] = useState('Paris');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    if (!city.trim()) {
      Alert.alert('Info', 'Veuillez entrer le nom d\'une ville.');
      return;
    }

    setLoading(true);
    setError(null);
    setWeatherData(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ville introuvable. Vérifie l\'orthographe.');
        } else {
          throw new Error('Une erreur est survenue. Réessaie plus tard.');
        }
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode) => {
    switch (iconCode) {
      case '01d': return 'sunny';
      case '01n': return 'moon';
      case '02d': return 'partly-sunny';
      case '02n': return 'cloudy-night';
      case '03d': case '03n': return 'cloudy';
      case '04d': case '04n': return 'cloudy';
      case '09d': case '09n': return 'rainy';
      case '10d': case '10n': return 'rainy';
      case '11d': case '11n': return 'thunderstorm';
      case '13d': case '13n': return 'snow';
      case '50d': case '50n': return 'rainy';
      default: return 'cloudy';
    }
  };

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1a3e', '#2d1b69']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une ville..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={city}
              onChangeText={setCity}
              onSubmitEditing={fetchWeather}
            />
            <TouchableOpacity onPress={fetchWeather} style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle" size={50} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {weatherData && (
          <View style={styles.weatherContainer}>
            <Text style={styles.cityName}>
              {weatherData.name}, {weatherData.sys.country}
            </Text>

            <View style={styles.auraContainer}>
              <LinearGradient
                colors={['rgba(255,200,100,0.3)', 'rgba(255,100,100,0.1)']}
                style={styles.aura}
              />
              <View style={styles.tempContainer}>
                <Ionicons
                  name={getWeatherIcon(weatherData.weather[0].icon)}
                  size={80}
                  color="#fff"
                />
                <Text style={styles.temperature}>
                  {Math.round(weatherData.main.temp)}°C
                </Text>
                <Text style={styles.description}>
                  {weatherData.weather[0].description}
                </Text>
                <Text style={styles.feelsLike}>
                  Ressenti : {Math.round(weatherData.main.feels_like)}°C
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <Ionicons name="thermometer" size={24} color="#fff" />
                <Text style={styles.detailValue}>
                  {Math.round(weatherData.main.temp_min)}° / {Math.round(weatherData.main.temp_max)}°
                </Text>
                <Text style={styles.detailLabel}>Min / Max</Text>
              </BlurView>

              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <Ionicons name="water" size={24} color="#fff" />
                <Text style={styles.detailValue}>{weatherData.main.humidity}%</Text>
                <Text style={styles.detailLabel}>Humidité</Text>
              </BlurView>

              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <Ionicons name="wind" size={24} color="#fff" />
                <Text style={styles.detailValue}>{Math.round(weatherData.wind.speed)} km/h</Text>
                <Text style={styles.detailLabel}>Vent</Text>
              </BlurView>
            </View>
          </View>
        )}

        {!weatherData && !loading && !error && (
          <View style={styles.centerContent}>
            <Ionicons name="cloud-outline" size={80} color="rgba(255,255,255,0.3)" />
            <Text style={styles.welcomeText}>Recherche une ville</Text>
            <Text style={styles.welcomeSubtext}>pour voir la météo</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  searchContainer: { marginBottom: 30 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  searchButton: { padding: 8 },
  weatherContainer: { alignItems: 'center' },
  cityName: { fontSize: 28, fontWeight: '300', color: '#fff', marginBottom: 10, letterSpacing: 1 },
  auraContainer: { alignItems: 'center', justifyContent: 'center', width: 250, height: 250, marginVertical: 20 },
  aura: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.6 },
  tempContainer: { alignItems: 'center' },
  temperature: { fontSize: 72, fontWeight: '200', color: '#fff', marginTop: 5 },
  description: { fontSize: 22, fontWeight: '300', color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  feelsLike: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginTop: 5 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 30 },
  detailCard: { flex: 1, alignItems: 'center', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 20, marginHorizontal: 5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 5 },
  detailLabel: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 15 },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  welcomeText: { color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: '300', marginTop: 20 },
  welcomeSubtext: { color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '300' },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');


const scaleSize = (size) => (width / 375) * size; // Base iPhone 8
const scaleFont = (size) => (width / 375) * size;
const isTablet = width > 768;

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export default function WeatherApp() {
 
  const [city, setCity] = useState('Paris');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (weatherData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [weatherData]);

 
  const getTemperatureColors = (temp) => {
    if (temp > 30) return ['#d4a373', '#e76f51', '#f4a261'];
    if (temp > 20) return ['#d4a373', '#e9c46a', '#f4a261'];
    if (temp > 10) return ['#d4a373', '#a8dadc', '#457b9d'];
    if (temp > 0) return ['#d4a373', '#88a8b8', '#6b8c9e'];
    return ['#d4a373', '#8ba9c7', '#5a7d9c'];
  };


  const fetchWeather = async () => {
    if (!city.trim()) {
      Alert.alert('Info', 'Veuillez entrer le nom d\'une ville.');
      return;
    }

    setLoading(true);
    setError(null);
    setWeatherData(null);
    setForecastData([]);

    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        if (weatherResponse.status === 404) {
          throw new Error('Ville introuvable. Vérifie l\'orthographe.');
        } else {
          throw new Error('Une erreur est survenue. Réessaie plus tard.');
        }
      }
      const weatherData = await weatherResponse.json();
      setWeatherData(weatherData);

      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr&cnt=40`;
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error('Erreur lors du chargement des prévisions.');
      const forecastData = await forecastResponse.json();
      setForecastData(forecastData.list || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return 'cloudy';
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


  const getDailyForecast = (list) => {
    if (!list || list.length === 0) return [];

    const daysMap = {};
    list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toLocaleDateString('fr-CA');
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: date,
          temps: [],
          icons: [],
        };
      }
      daysMap[dateKey].temps.push(item.main.temp);
      daysMap[dateKey].icons.push(item.weather[0].icon);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString('fr-CA');
      if (daysMap[key]) {
        const dayData = daysMap[key];
        const minTemp = Math.min(...dayData.temps);
        const maxTemp = Math.max(...dayData.temps);
        const midIndex = Math.floor(dayData.icons.length / 2);
        const icon = dayData.icons[midIndex] || dayData.icons[0] || '01d';
        sevenDays.push({ date: d, minTemp, maxTemp, icon });
      } else {
        const keys = Object.keys(daysMap);
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1];
          const lastData = daysMap[lastKey];
          const minTemp = Math.min(...lastData.temps);
          const maxTemp = Math.max(...lastData.temps);
          const midIndex = Math.floor(lastData.icons.length / 2);
          const icon = lastData.icons[midIndex] || lastData.icons[0] || '01d';
          sevenDays.push({ date: d, minTemp, maxTemp, icon });
        } else {
          sevenDays.push({ date: d, minTemp: 0, maxTemp: 0, icon: '01d' });
        }
      }
    }
    return sevenDays;
  };

  const dailyForecast = getDailyForecast(forecastData);
  const tempColors = weatherData ? getTemperatureColors(weatherData.main.temp) : ['#d4a373', '#b88655'];


  return (
    <LinearGradient
      colors={['#0a0a0f', '#1a1a1f', '#0a0a12']}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
      
        <View style={styles.searchContainer}>
          <BlurView intensity={40} style={styles.searchBar} tint="dark">
            <Ionicons name="search-outline" size={scaleSize(20)} color="#d4a373" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une ville..."
              placeholderTextColor="rgba(212, 163, 115, 0.4)"
              value={city}
              onChangeText={setCity}
              onSubmitEditing={fetchWeather}
            />
            <TouchableOpacity onPress={fetchWeather} style={styles.searchButton}>
              <LinearGradient
                colors={['#d4a373', '#b88655']}
                style={styles.searchButtonGradient}
              >
                <Ionicons name="arrow-forward" size={scaleSize(20)} color="#0a0a0f" />
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>

        
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#d4a373" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

    
        {error && (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle" size={scaleSize(50)} color="#d4a373" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        
        {weatherData && (
          <Animated.View
            style={[
              styles.weatherContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={scaleSize(16)} color="#d4a373" />
              <Text style={styles.cityName}>
                {weatherData.name}, {weatherData.sys.country}
              </Text>
            </View>

          
            <View style={styles.auraContainer}>
              <LinearGradient
                colors={[
                  `rgba(${tempColors[0].replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.15)`,
                  'rgba(212, 163, 115, 0.02)',
                ]}
                style={styles.aura}
              />
              <View style={styles.tempContainer}>
                <Ionicons
                  name={getWeatherIcon(weatherData.weather[0].icon)}
                  size={scaleSize(60)}
                  color="#d4a373"
                />
                <Text style={styles.temperature}>
                  {Math.round(weatherData.main.temp)}°
                </Text>
                <Text style={styles.description}>
                  {weatherData.weather[0].description}
                </Text>
                <Text style={styles.feelsLike}>
                  Ressenti {Math.round(weatherData.main.feels_like)}°C
                </Text>
              </View>
            </View>

            
            <View style={styles.detailsRow}>
              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <View style={styles.detailIconContainer}>
                  <Ionicons name="thermometer-outline" size={scaleSize(20)} color="#d4a373" />
                </View>
                <Text style={styles.detailValue}>
                  {Math.round(weatherData.main.temp_min)}° / {Math.round(weatherData.main.temp_max)}°
                </Text>
                <Text style={styles.detailLabel}>Min / Max</Text>
              </BlurView>

              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <View style={styles.detailIconContainer}>
                  <Ionicons name="water-outline" size={scaleSize(20)} color="#d4a373" />
                </View>
                <Text style={styles.detailValue}>{weatherData.main.humidity}%</Text>
                <Text style={styles.detailLabel}>Humidité</Text>
              </BlurView>

              <BlurView intensity={30} style={styles.detailCard} tint="dark">
                <View style={styles.detailIconContainer}>
                  <Ionicons name="wind-outline" size={scaleSize(20)} color="#d4a373" />
                </View>
                <Text style={styles.detailValue}>{Math.round(weatherData.wind.speed)} km/h</Text>
                <Text style={styles.detailLabel}>Vent</Text>
              </BlurView>
            </View>

       
            {forecastData.length > 0 && (
              <View style={styles.hourlyContainer}>
                <Text style={styles.hourlyTitle}>Prévisions horaires</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={forecastData}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => {
                    const date = new Date(item.dt * 1000);
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    const time = `${hours}:${minutes}`;
                    const iconCode = item.weather[0].icon;

                    return (
                      <BlurView intensity={30} style={styles.hourlyCard} tint="dark">
                        <Text style={styles.hourlyTime}>{time}</Text>
                        <Ionicons
                          name={getWeatherIcon(iconCode)}
                          size={scaleSize(24)}
                          color="#d4a373"
                        />
                        <Text style={styles.hourlyTemp}>
                          {Math.round(item.main.temp)}°
                        </Text>
                      </BlurView>
                    );
                  }}
                />
              </View>
            )}

           
            {dailyForecast.length > 0 && (
              <View style={styles.dailyContainer}>
                <Text style={styles.dailyTitle}>Semaine</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={dailyForecast}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => {
                    const dayName = item.date.toLocaleDateString('fr-FR', { weekday: 'short' });
                    const displayDay = dayName || 'Jour';
                    return (
                      <BlurView intensity={30} style={styles.dailyCard} tint="dark">
                        <Text style={styles.dailyDay}>{displayDay}</Text>
                        <Ionicons
                          name={getWeatherIcon(item.icon)}
                          size={scaleSize(28)}
                          color="#d4a373"
                        />
                        <Text style={styles.dailyTemp}>
                          {Math.round(item.maxTemp)}° / {Math.round(item.minTemp)}°
                        </Text>
                      </BlurView>
                    );
                  }}
                />
              </View>
            )}
          </Animated.View>
        )}

        
        {!weatherData && !loading && !error && (
          <View style={styles.centerContent}>
            <Ionicons name="cloud-outline" size={scaleSize(80)} color="rgba(212, 163, 115, 0.2)" />
            <Text style={styles.welcomeText}>Recherche une ville</Text>
            <Text style={styles.welcomeSubtext}>pour la météo</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  gradient: { flex: 1 },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: scaleSize(24),
    paddingTop: isTablet ? scaleSize(80) : scaleSize(60),
    paddingBottom: scaleSize(30),
  },

 
  searchContainer: { marginBottom: scaleSize(30) },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleSize(16),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.15)',
  },
  searchInput: {
    flex: 1,
    color: '#f5f0eb',
    fontSize: scaleFont(15),
    fontWeight: '300',
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(12),
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  searchButton: { padding: scaleSize(4) },
  searchButtonGradient: {
    padding: scaleSize(10),
    borderRadius: scaleSize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

 
  weatherContainer: { alignItems: 'center', width: '100%' },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(8),
  },
  cityName: {
    fontSize: scaleFont(isTablet ? 22 : 18),
    fontWeight: '300',
    color: '#c4b5a0',
    letterSpacing: 2,
    marginLeft: scaleSize(6),
    textTransform: 'uppercase',
  },

  auraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(isTablet ? 320 : 280),
    height: scaleSize(isTablet ? 320 : 280),
    marginVertical: scaleSize(12),
  },
  aura: {
    position: 'absolute',
    width: scaleSize(isTablet ? 260 : 220),
    height: scaleSize(isTablet ? 260 : 220),
    borderRadius: scaleSize(isTablet ? 130 : 110),
    opacity: 0.5,
  },
  tempContainer: { alignItems: 'center' },
  temperature: {
    fontSize: scaleFont(isTablet ? 96 : 76),
    fontWeight: '200',
    color: '#f5f0eb',
    letterSpacing: -4,
    marginTop: scaleSize(4),
  },
  description: {
    fontSize: scaleFont(isTablet ? 22 : 18),
    fontWeight: '300',
    color: 'rgba(245, 240, 235, 0.6)',
    marginTop: scaleSize(4),
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
  feelsLike: {
    fontSize: scaleFont(14),
    fontWeight: '300',
    color: 'rgba(212, 163, 115, 0.5)',
    marginTop: scaleSize(4),
    letterSpacing: 0.5,
  },


  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scaleSize(24),
  },
  detailCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(8),
    borderRadius: scaleSize(16),
    marginHorizontal: scaleSize(4),
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.08)',
    overflow: 'hidden',
  },
  detailIconContainer: {
    marginBottom: scaleSize(6),
  },
  detailValue: {
    fontSize: scaleFont(isTablet ? 18 : 16),
    fontWeight: '500',
    color: '#f5f0eb',
    marginTop: scaleSize(4),
  },
  detailLabel: {
    fontSize: scaleFont(11),
    fontWeight: '300',
    color: 'rgba(196, 181, 160, 0.5)',
    marginTop: scaleSize(2),
    letterSpacing: 0.5,
  },

  
  hourlyContainer: { marginTop: scaleSize(28), width: '100%' },
  hourlyTitle: {
    fontSize: scaleFont(isTablet ? 18 : 16),
    fontWeight: '400',
    color: '#c4b5a0',
    marginBottom: scaleSize(14),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hourlyCard: {
    alignItems: 'center',
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(18),
    borderRadius: scaleSize(14),
    marginRight: scaleSize(12),
    minWidth: scaleSize(70),
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.08)',
    overflow: 'hidden',
  },
  hourlyTime: {
    fontSize: scaleFont(12),
    color: 'rgba(196, 181, 160, 0.6)',
    fontWeight: '400',
    marginBottom: scaleSize(6),
  },
  hourlyTemp: {
    fontSize: scaleFont(isTablet ? 18 : 16),
    fontWeight: '500',
    color: '#f5f0eb',
    marginTop: scaleSize(6),
  },

 
  dailyContainer: { marginTop: scaleSize(24), width: '100%', marginBottom: scaleSize(16) },
  dailyTitle: {
    fontSize: scaleFont(isTablet ? 18 : 16),
    fontWeight: '400',
    color: '#c4b5a0',
    marginBottom: scaleSize(14),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dailyCard: {
    alignItems: 'center',
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(18),
    borderRadius: scaleSize(14),
    marginRight: scaleSize(12),
    minWidth: scaleSize(80),
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.08)',
    overflow: 'hidden',
  },
  dailyDay: {
    fontSize: scaleFont(13),
    color: 'rgba(196, 181, 160, 0.7)',
    fontWeight: '500',
    marginBottom: scaleSize(6),
    textTransform: 'capitalize',
  },
  dailyTemp: {
    fontSize: scaleFont(isTablet ? 17 : 15),
    fontWeight: '500',
    color: '#f5f0eb',
    marginTop: scaleSize(6),
  },

  
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(60),
  },
  loadingText: {
    color: 'rgba(212, 163, 115, 0.6)',
    fontSize: scaleFont(14),
    marginTop: scaleSize(12),
  },
  errorText: {
    color: 'rgba(212, 163, 115, 0.7)',
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginTop: scaleSize(12),
    paddingHorizontal: scaleSize(20),
  },
  welcomeText: {
    color: 'rgba(245, 240, 235, 0.3)',
    fontSize: scaleFont(isTablet ? 22 : 18),
    fontWeight: '300',
    marginTop: scaleSize(16),
    letterSpacing: 2,
  },
  welcomeSubtext: {
    color: 'rgba(245, 240, 235, 0.15)',
    fontSize: scaleFont(14),
    fontWeight: '300',
    letterSpacing: 1,
  },
});
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import BibleStudyScreen from './src/screens/BibleStudyScreen';
import { PrayerScreen } from './src/screens/PrayerScreen';
import { MeditationScreen } from './src/screens/MeditationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Bible Companion',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="BibleStudy" 
          component={BibleStudyScreen}
          options={{
            title: 'Bible Study',
          }}
        />
        <Stack.Screen 
          name="Prayer" 
          component={PrayerScreen}
          options={{
            title: 'Prayer',
          }}
        />
        <Stack.Screen 
          name="Meditation" 
          component={MeditationScreen}
          options={{
            title: 'Meditation',
          }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

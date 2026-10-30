import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StoreProvider } from './store';
import { HomeScreen, FavoritesScreen, MyFoodScreen, DetailScreen, FormScreen } from './screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icon = (e) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#e8590c' }}>
      <Tab.Screen name="Главная" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Избранное" component={FavoritesScreen} options={{ tabBarIcon: icon('❤️') }} />
      <Tab.Screen name="Моя еда" component={MyFoodScreen} options={{ tabBarIcon: icon('👩‍🍳') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="Form" component={FormScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </StoreProvider>
  );
}

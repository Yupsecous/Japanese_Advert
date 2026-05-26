import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from './src/store';
import { useLocaleStore } from './src/i18n';
import { AuthScreen } from './src/screens/AuthScreen';
import { BriefScreen } from './src/screens/BriefScreen';
import { CopyScreen } from './src/screens/CopyScreen';
import { ImageScreen } from './src/screens/ImageScreen';
import { ScriptScreen } from './src/screens/ScriptScreen';
import { AudioScreen } from './src/screens/AudioScreen';
import { DesignScreen } from './src/screens/DesignScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const authed = useAppStore((s) => s.authed);
  const hydrating = useAppStore((s) => s.hydrating);
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateLocale();
  }, [hydrate, hydrateLocale]);

  if (hydrating) {
    return (
      <SafeAreaProvider>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand} />
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {authed ? (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          >
            <Stack.Screen name="Brief" component={BriefScreen} />
            <Stack.Screen name="Copy" component={CopyScreen} />
            <Stack.Screen name="Image" component={ImageScreen} />
            <Stack.Screen name="Script" component={ScriptScreen} />
            <Stack.Screen name="Audio" component={AudioScreen} />
            <Stack.Screen name="Design" component={DesignScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <AuthScreen />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

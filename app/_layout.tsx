import { ThemeContextProvider } from '@/context/theme-context';
import "@/global.css";
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ThemeContextProvider>
  );
}
import React from "react";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import CustomizationScreen from "./src/screens/CustomizationScreen";
import RootNavigation from "./src/navigation/RootNavigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigation/>
    </SafeAreaProvider>
  );
}

import React from "react";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import CustomizationScreen from "./src/screens/CustomizationScreen";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CustomizationScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

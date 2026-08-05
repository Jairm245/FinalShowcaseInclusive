import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "../components/Header";
import BasicChatbot from "../chatbots/BasicChatbot";

export const CHATBOTS = {
  BasicChatbot: {
    id: "BasicChatbot",
    name: "React Native Chatbot",
    imageUrl: "https://loremflickr.com/140/140",
    component: BasicChatbot,
    screen: "Conversation",
  },
  heartChatbot: {
    id: "heartChatbot",
    name: "Snap Stamps Chatbot",
    imageUrl: "https://loremflickr.com/140/140",
    component: BasicChatbot,
    screen: "GroupheartsScreen",
  },
};

export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const chats = Object.values(CHATBOTS);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          marginBottom: tabBarHeight,
        },
      ]}
    >
      <Header title="Chat" />

      {chats.map((chat) => (
        <TouchableOpacity
          key={chat.id}
          style={styles.userButton}
          onPress={() =>
            navigation.navigate(chat.screen, {
              chatbotName: chat.name,
              chatId: chat.id,
            })
          }
        >
          <Ionicons name="person-circle" size={48} color="#D8D8D8" />

          <Text style={styles.userName}>{chat.name}</Text>

          <Ionicons name="camera-outline" size={24} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  userButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },

  userName: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "600",
  },
});

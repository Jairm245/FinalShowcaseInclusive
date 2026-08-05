import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";

export default function ConversationScreen({ route }) {
  const { chatbotName } = route?.params || {};
  const { user } = useAuthentication();

  const [message, setMessage] = useState("");
  const [customHeartUrl, setCustomHeartUrl] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      name: chatbotName || "Bot",
      text: "Hi Sarah",
      color: "#00A7B5",
    },
    {
      id: "2",
      sender: "me",
      name: "ME",
      text: "hi bob",
      color: "#FF2D55",
    },
  ]);

  const listRef = useRef(null);

  useEffect(() => {
    fetchCustomHeart();
  }, [user]);

  const fetchCustomHeart = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("custom_heart_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.custom_heart_url) {
        setCustomHeartUrl(data.custom_heart_url);
      } else if (user?.user_metadata?.custom_heart_url) {
        setCustomHeartUrl(user.user_metadata.custom_heart_url);
      }
    } catch (error) {
      console.error("Error fetching custom heart:", error.message);
    }
  };

  async function sendHeart() {
    if (!user?.id) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "me",
        name: "ME",
        text: "",
        color: "#FF2D55",
        isHeart: true,
        image: customHeartUrl,
      },
    ]);
  }

  function sendMessage() {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "me",
        name: "ME",
        text: message.trim(),
        color: "#FF2D55",
      },
    ]);

    setMessage("");
  }

  function renderMessage({ item }) {
    return (
      <View style={styles.messageWrapper}>
        <Text style={[styles.sender, { color: item.color }]}>
          {item.name}
        </Text>

        <View style={[styles.messageRow, { borderLeftColor: item.color }]}>
          {/* Render Text Message */}
          {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}

          {/* Render Heart/Image Message */}
          {item.isHeart || item.image ? (
            item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.heartChatMessage}
              />
            ) : (
              <Text style={styles.defaultHeartMessage}>💛</Text>
            )
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {/* INPUT AREA */}
        <View style={styles.inputBar}>
          {/* Camera */}
          <TouchableOpacity>
            <Ionicons name="camera" size={27} color="#000" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Chat"
            style={styles.input}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          {/* Dynamic Send/Mic Button */}
          {message.length > 0 ? (
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="arrow-up" size={22} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Ionicons name="mic" size={24} color="#000" />
            </TouchableOpacity>
          )}

          {/* Profile Custom Heart Button */}
          <TouchableOpacity onPress={sendHeart} style={styles.heartButton}>
            {customHeartUrl ? (
              <Image
                source={{ uri: customHeartUrl }}
                style={styles.heartImage}
              />
            ) : (
              <Text style={styles.emoji}>💛</Text>
            )}
          </TouchableOpacity>

          {/* Plus */}
          <TouchableOpacity>
            <Ionicons name="add-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messages: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 10,
  },
  messageWrapper: {
    marginVertical: 7,
  },
  sender: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  messageRow: {
    borderLeftWidth: 3,
    paddingLeft: 8,
  },
  messageText: {
    fontSize: 18,
    color: "#222",
  },
  heartChatMessage: {
    width: 70,
    height: 70,
    marginTop: 5,
    resizeMode: "contain",
  },
  defaultHeartMessage: {
    fontSize: 40,
    marginTop: 5,
  },
  heartButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  heartImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  inputBar: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#F1F1F5",
    borderRadius: 20,
    paddingHorizontal: 18,
    fontSize: 17,
  },
  emoji: {
    fontSize: 25,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
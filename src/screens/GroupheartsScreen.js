import React, { useState, useEffect, useRef } from "react";
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
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Hooks & Components
import { useAuthentication } from "../../utils/hooks/useAuthentication";
import { supabase } from "../../utils/hooks/supabase";

export default function GroupchatScreen({ route }) {
  // Extract params or fall back to default room defaults
  const { groupId, chatbotName } = route.params || {};
  const targetGroupId = groupId || chatbotName || "SnapStampsGroup"; // Fallback group ID if none provided

  const { user } = useAuthentication();
  const [customHeartUrl, setCustomHeartUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Modal State for viewing heart images
  const [selectedHeartUrl, setSelectedHeartUrl] = useState(null);

  // Determine user's fallback username
  const defaultUsername =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "ME";

  const [activeUsername, setActiveUsername] = useState(defaultUsername);
  const listRef = useRef(null);

  async function sendHeart() {
    if (!user?.id) return;
    const { error } = await supabase.from("group_messages").insert([
      {
        group_id: targetGroupId,
        sender_id: user?.id,
        sender_name: activeUsername,
        text: "",
        color: "#FF2D55",
        is_heart: true,
        image_url: customHeartUrl || null,
      },
    ]);

    if (error) {
      console.error("Error sending heart to Supabase:", error.message);
    }
  }

  function renderMessage({ item }) {
    const isMe = item.sender_id === user?.id;
    const senderName = isMe ? "ME" : item.sender_name || item.name || "Friend";
    const heartUrl = item.image_url || item.image;
    const isHeartMsg = item.is_heart || item.isHeart || !!heartUrl;

    return (
      <View style={styles.messageWrapper}>
        <Text style={[styles.sender, { color: isMe ? "#FF2D55" : item.color || "#00A7B5" }]}>
          {senderName}
        </Text>

        <View style={[styles.messageRow, { borderLeftColor: isMe ? "#FF2D55" : item.color || "#00A7B5" }]}>
          {/* Render Text Message */}
          {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}

          {/* Render Heart/Image Message */}
          {isHeartMsg ? (
            <TouchableOpacity
              onPress={() => setSelectedHeartUrl(heartUrl || "default_emoji")}
              activeOpacity={0.8}
            >
              {heartUrl ? (
                <Image
                  source={{ uri: heartUrl }}
                  style={styles.heartChatMessage}
                />
              ) : (
                <Text style={styles.defaultHeartMessage}>💛</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

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

  useEffect(() => {
    if (user?.id) {
      fetchCustomHeart();
    }
  }, [user?.id]);

  useEffect(() => {
    // 1. Fetch initial message history from Supabase
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", targetGroupId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching initial messages:", error.message);
      } else if (data) {
        setMessages(data);
      }
    }

    fetchMessages();

    // 2. Subscribe to REALTIME insert changes for this specific group room
    const channel = supabase
      .channel(`group-chat:${targetGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${targetGroupId}`,
        },
        (payload) => {
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === payload.new.id)) {
              return prevMessages;
            }
            return [...prevMessages, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetGroupId]);

  async function sendMessage() {
    if (!message.trim()) return;

    const textToSend = message.trim();
    setMessage("");

    const { error } = await supabase.from("group_messages").insert([
      {
        group_id: targetGroupId,
        sender_id: user?.id,
        sender_name: activeUsername,
        text: textToSend,
        color: "#FF2D55",
      },
    ]);

    if (error) {
      console.error("Error sending message to Supabase:", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Heart Preview Modal */}
      <Modal
        visible={!!selectedHeartUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedHeartUrl(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedHeartUrl(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedHeartUrl(null)}
            >
              <Ionicons name="close-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedHeartUrl === "default_emoji" ? (
              <Text style={styles.largeHeartEmoji}>💛</Text>
            ) : (
              <Image
                source={{ uri: selectedHeartUrl }}
                style={styles.largeHeartImage}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Chat Messages List */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity>
            <Ionicons name="camera" size={27} color="#000" />
          </TouchableOpacity>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Chat"
            style={styles.input}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          {message.length > 0 ? (
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="arrow-up" size={22} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Ionicons name="mic" size={24} color="#000" />
            </TouchableOpacity>
          )}

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
  heartImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  heartChatMessage: {
    width: 70,
    height: 70,
    marginTop: 5,
    resizeMode: "contain",
  },
  heartButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  defaultHeartMessage: {
    fontSize: 30,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  closeModalButton: {
    position: "absolute",
    top: -50,
    right: -10,
    zIndex: 10,
  },
  largeHeartImage: {
    width: 260,
    height: 260,
    resizeMode: "contain",
  },
  largeHeartEmoji: {
    fontSize: 180,
  },
});
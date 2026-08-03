import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";
import AddFriendBitmoji from "../components/AddFriendBitmoji";

const SectionListBasics = () => {
  const navigation = useNavigation();
  const { user } = useAuthentication();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedFriends();
  }, [user]);

  const fetchSuggestedFriends = async () => {
    try {
      setLoading(true);

      // Fetch all public profiles except the currently logged-in user
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user?.id || "")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error.message);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quick Add</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Optional Bitmoji Banner / Header Component */}
        <View style={styles.bitmojiHeaderContainer}>
          <AddFriendBitmoji />
        </View>

        <Text style={styles.sectionHeader}>Suggested Friends</Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        ) : profiles.length === 0 ? (
          <Text style={styles.emptyText}>No suggestions right now</Text>
        ) : (
          profiles.map((item) => {
            const initial = (item.display_name || item.username || "U")
              .charAt(0)
              .toUpperCase();

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.userCard}
                onPress={() =>
                  navigation.navigate("ProfileScreen", { userId: item.id })
                }
              >
                {/* User Avatar Circle */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>

                {/* Name & Handle */}
                <View style={styles.userInfo}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {item.display_name || "Snap User"}
                  </Text>
                  <Text style={styles.username} numberOfLines={1}>
                    @{item.username || "username"}
                  </Text>
                </View>

                {/* Custom Heart Preview */}
                <View style={styles.heartContainer}>
                  {item.custom_heart_url ? (
                    <Image
                      source={{ uri: item.custom_heart_url }}
                      style={styles.customHeart}
                    />
                  ) : (
                    <Text style={styles.defaultHeartEmoji}>💛</Text>
                  )}
                </View>

                {/* Add Friend Action Button */}
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    // Placeholder for friend request logic
                    alert(`Added ${item.display_name || item.username}!`);
                  }}
                >
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 10,
    color: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  bitmojiHeaderContainer: {
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 15,
    marginTop: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFC00",
    borderWidth: 2,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  username: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  heartContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeart: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  defaultHeartEmoji: {
    fontSize: 26,
  },
  addBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  footer: {
    height: 40,
  },
});

export default SectionListBasics;

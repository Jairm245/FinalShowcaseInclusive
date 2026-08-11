import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const SPOTLIGHT_POSTS = [
  {
    id: "1",
    // Updated to .jpeg matching your asset file
    imageSource: require("../../assets/ChrisSpotlight.jpeg"),
    username: "chris_builds",
    description: "Spotlight test with custom dynamic heart like feature! 🚀",
    soundTitle: "Original Sound - chris_builds",
    likes: 124500,
    comments: "1,204",
    shares: "8.4K",
  },
];

export default function SpotlightScreen() {
  const { user } = useAuthentication();
  const [customHeartUrl, setCustomHeartUrl] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(124500);

  useEffect(() => {
    fetchCustomHeart();
  }, [user]);

  const fetchCustomHeart = async () => {
    if (!user) return;

    if (user?.user_metadata?.custom_heart_url) {
      setCustomHeartUrl(user.user_metadata.custom_heart_url);
    } else {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("custom_heart_url")
          .eq("id", user.id)
          .single();

        if (data?.custom_heart_url) {
          setCustomHeartUrl(data.custom_heart_url);
        }
      } catch (err) {
        console.error("Error fetching custom heart:", err);
      }
    }
  };

  const handleLikeToggle = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const renderSpotlightItem = ({ item }) => {
    return (
      <View style={styles.spotlightContainer}>
        <StatusBar barStyle="light-content" />

        {/* Background Blur Fill */}
        <Image
          style={StyleSheet.absoluteFillObject}
          source={item.imageSource}
          resizeMode="cover"
          blurRadius={25}
        />

        {/* Dark overlay behind main image for better UI readability */}
        <View style={styles.darkOverlay} />

        {/* Foreground Full Image Container (Preserves aspect ratio completely) */}
        <View style={styles.imageWrapper}>
          <Image
            style={styles.foregroundImage}
            source={item.imageSource}
            resizeMode="contain"
          />
        </View>

        {/* Top Header Bar */}
        <SafeAreaView style={styles.headerBar}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spotlight</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Right Action Sidebar */}
        <View style={styles.rightSidebar}>
          {/* Dynamic Heart Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
            {!isLiked ? (
              <Ionicons name="heart-outline" size={34} color="#FFFFFF" />
            ) : customHeartUrl ? (
              <Image source={{ uri: customHeartUrl }} style={styles.customHeartIcon} />
            ) : (
              <Ionicons name="heart" size={34} color="#FF2D55" />
            )}
            <Text style={styles.actionText}>{likeCount.toLocaleString()}</Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-ellipses" size={30} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social" size={30} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>

          {/* Remix */}
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="repeat" size={30} color="#FFFFFF" />
            <Text style={styles.actionText}>Remix</Text>
          </TouchableOpacity>

          {/* Options */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Overlay */}
        <View style={styles.bottomOverlay}>
          <View style={styles.userRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder} />
              <View style={styles.addBadge}>
                <Ionicons name="add" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.usernameText}>@{item.username}</Text>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.audioText} numberOfLines={1}>
              {item.soundTitle}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={SPOTLIGHT_POSTS}
      keyExtractor={(item) => item.id}
      renderItem={renderSpotlightItem}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
    />
  );
}

const styles = StyleSheet.create({
  spotlightContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000000",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  foregroundImage: {
    width: "100%",
    height: "100%",
  },
  headerBar: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerIconBtn: {
    padding: 6,
  },
  rightSidebar: {
    position: "absolute",
    right: 12,
    bottom: 90,
    alignItems: "center",
    zIndex: 10,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 18,
  },
  customHeartIcon: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 80,
    zIndex: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFC00",
  },
  addBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 10,
  },
  subscribeBtn: {
    backgroundColor: "#FFFC00",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  subscribeText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "bold",
  },
  descriptionText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  audioText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
});
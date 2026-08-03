import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";

import leaningAvatar from "../../assets/Leaning_against_wall_greeting.png";

const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error.message);
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
  }
};

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ProfileCard({
  icon,
  title,
  description,
  showArrow = true,
  onPress,
}) {
  // Check if icon is a remote URL string
  const isImageIcon =
    typeof icon === "string" &&
    (icon.trim().startsWith("http://") || icon.trim().startsWith("https://"));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.profileCard,
        pressed && onPress ? styles.cardPressed : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardIcon}>
        {isImageIcon ? (
          <Image
            source={{ uri: icon.trim() }}
            style={styles.cardIconImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.cardIconText}>{icon}</Text>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>

        {description ? (
          <Text style={styles.cardDescription}>{description}</Text>
        ) : null}
      </View>

      {showArrow ? <Text style={styles.arrow}>›</Text> : null}
    </Pressable>
  );
}

function InfoPill({ icon, text, showArrow = false, onPress }) {
  const content = (
    <>
      {icon ? <Text style={styles.infoPillIcon}>{icon}</Text> : null}
      <Text style={styles.infoPillText}>{text}</Text>
      {showArrow ? <Text style={styles.infoPillArrow}>›</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.infoPill,
          styles.clickableInfoPill,
          pressed && styles.infoPillPressed,
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.infoPill}>{content}</View>;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthentication();

  const [pronouns, setPronouns] = useState([]);
  const [selectedPronouns, setSelectedPronouns] = useState(
    user?.user_metadata?.pronouns || ""
  );

  const [pronounModalVisible, setPronounModalVisible] = useState(false);
  const [loadingPronouns, setLoadingPronouns] = useState(false);
  const [savingPronouns, setSavingPronouns] = useState(false);

  const email = user?.user_metadata?.email || user?.email || "";

  const username =
    user?.user_metadata?.username ||
    (email.includes("@") ? email.split("@")[0] : email) ||
    "username";

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    "Ryan Aguilar";

  const profileInitial =
    username.length > 0 ? username.charAt(0).toUpperCase() : "U";

  const profileColor = route.params?.backgroundColor || "#9AA0A6";

  const getPronouns = async () => {
    try {
      setLoadingPronouns(true);

      const { data, error } = await supabase
        .from("Pronouns")
        .select("id, pronouns, created_at")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching pronouns:", error.message);
        return;
      }

      setPronouns(data || []);
    } catch (error) {
      console.error("Unexpected error fetching pronouns:", error.message);
    } finally {
      setLoadingPronouns(false);
    }
  };

  const savePronouns = async (pronounValue) => {
    try {
      setSavingPronouns(true);

      const { data, error } = await supabase.auth.updateUser({
        data: { pronouns: pronounValue },
      });

      if (error) throw error;

      setSelectedPronouns(pronounValue);
      setPronounModalVisible(false);
    } catch (error) {
      console.error("Error saving pronouns:", error.message);
      Alert.alert(
        "Unable to save pronouns",
        "Please check your connection and try again."
      );
    } finally {
      setSavingPronouns(false);
    }
  };

  useEffect(() => {
    getPronouns();
  }, []);

  useEffect(() => {
    setSelectedPronouns(user?.user_metadata?.pronouns || "");
  }, [user?.user_metadata?.pronouns]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#8E9399" />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Area */}
        <View style={[styles.profileHeader, { backgroundColor: profileColor }]}>
          <View style={styles.navigationHeader}>
            <Pressable
              style={styles.circleHeaderButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.circleHeaderButton}
                onPress={() => navigation.navigate("BackgroundBuild")}
              >
                <Text style={styles.headerButtonIcon}>↑</Text>
              </Pressable>

              <Pressable
                style={styles.circleHeaderButton}
                onPress={() => navigation.navigate("Settings")}
              >
                <Text style={styles.headerButtonIcon}>⚙</Text>
              </Pressable>
            </View>
          </View>

          {/* Central Bitmoji Space - Loaded from imported image asset */}
          <View style={styles.avatarSpaceContainer}>
            <Image
              source={leaningAvatar} // ✅ Fix 2: Directly pass the imported image variable
              style={styles.avatarBitmoji}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Overlay Row (Snapcode, Name/Handle, Heart Action) */}
          <View style={styles.headerBottomRow}>
            {/* Snapcode / Badge */}
            <View style={styles.snapcodeContainer}>
              <View style={styles.snapcodeBorder}>
                <View style={styles.snapcodeInnerIcon}>
                  <Text style={styles.snapcodeInitial}>{profileInitial}</Text>
                </View>
              </View>
            </View>

            {/* Name and Handle */}
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.usernameHandle}>{username}</Text>
            </View>

            {/* Customize Heart Button */}
            <Pressable
              style={styles.heartButton}
              onPress={() => navigation.navigate("CustomizationScreen")}
            >
              <Text style={styles.heartIcon}>💛</Text>
            </Pressable>
          </View>
        </View>

        {/* Main Body */}
        <View style={styles.body}>
          {/* Main Action Buttons */}
          <View style={styles.profileButtonRow}>
            <Pressable style={styles.mainProfileButton}>
              <Text style={styles.mainProfileButtonText}>My Account</Text>
            </Pressable>

            <Pressable style={styles.mainProfileButton}>
              <Text style={styles.mainProfileButtonText}>Public Profile</Text>
            </Pressable>
          </View>

          {/* Horizontal Info Pills Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.infoRow}
          >
            <InfoPill
              icon=""
              text={selectedPronouns || "+ Add pronouns"}
              showArrow={true}
              onPress={() => setPronounModalVisible(true)}
            />
            <InfoPill icon="🎂" text="Mar 20" />
            <InfoPill icon="👻" text="1,936" />
            <InfoPill icon="♓" text="Pisces" showArrow={true} />
          </ScrollView>

          {/* Feature Cards */}
          <ProfileCard
            icon="https://link.snapchat.com/plus/plus.png"
            title="Snapchat+"
            description="Exclusive Early Access to lens, Bitmoji, etc..."
            onPress={() => navigation.navigate("BackgroundBuild")}
          />

          <ProfileCard
            icon="https://link.snapchat.com/plus/plus.png"
            title="Manage Heart Accessiblity"
            description="Manage "
            onPress={() => navigation.navigate("BackgroundBuild")}
          />

          <ProfileCard
            icon="+"
            title="Profile Features"
            description="Customize and explore your profile."
            onPress={() => navigation.navigate("BackgroundBuild")}
          />

          <ProfileCard
            icon="♥"
            title="Customize hearts"
            description="Express yourself"
            onPress={() => navigation.navigate("CustomizationScreen")}
          />

          <SectionTitle>Friends</SectionTitle>

          <ProfileCard
            icon="+"
            title="Add Friends"
            description="Find and connect with new friends."
          />

          <ProfileCard
            icon="≡"
            title="My Friends"
            description="View your current friends."
          />

          <SectionTitle>Communities</SectionTitle>

          <ProfileCard
            icon="C"
            title="Add School"
            description="Meet new friends in your community."
          />

          <SectionTitle>Map</SectionTitle>

          <View style={styles.mapCard}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>MAP PREVIEW</Text>
            </View>

            <View style={styles.mapInformation}>
              <View style={styles.mapIcon}>
                <Text style={styles.mapIconText}>○</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Not Sharing Location</Text>
                <Text style={styles.cardDescription}>Ghost Mode</Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </View>
          </View>

          <SectionTitle>Countdowns</SectionTitle>

          <ProfileCard
            icon="□"
            title="Create a new Countdown!"
            description="Invite friends or use it privately."
          />

          <SectionTitle>Account</SectionTitle>

          <ProfileCard
            icon="⚙"
            title="Settings"
            description="Manage your profile and account."
            onPress={() => navigation.navigate("Settings")}
          />

          <Pressable style={styles.logOutButton} onPress={handleSignOut}>
            <Text style={styles.logOutButtonText}>Log Out</Text>
          </Pressable>

          <View style={styles.footer}>
            <View style={styles.footerGhost}>
              <Text style={styles.footerGhostText}>U</Text>
            </View>
            <Text style={styles.footerText}>Member profile</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pronoun Selection Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={pronounModalVisible}
        onRequestClose={() => setPronounModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPronounModalVisible(false)}
          />

          <View style={styles.pronounSheet}>
            <View style={styles.pronounSheetHandle} />

            <View style={styles.pronounSheetHeader}>
              <View style={styles.pronounHeaderText}>
                <Text style={styles.pronounSheetTitle}>Select your pronouns</Text>
                <Text style={styles.pronounSheetDescription}>
                  Your selection will appear as the first profile tag.
                </Text>
              </View>

              <Pressable
                style={styles.closePronounButton}
                onPress={() => setPronounModalVisible(false)}
              >
                <Text style={styles.closePronounButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.pronounOptionsScroll}
              contentContainerStyle={styles.pronounOptionsContent}
              showsVerticalScrollIndicator={false}
            >
              {loadingPronouns ? (
                <Text style={styles.statusText}>Loading pronouns...</Text>
              ) : pronouns.length === 0 ? (
                <View style={styles.emptyPronounsContainer}>
                  <Text style={styles.statusText}>
                    No pronouns are currently available.
                  </Text>
                  <Pressable style={styles.retryButton} onPress={getPronouns}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </Pressable>
                </View>
              ) : (
                pronouns.map((item) => {
                  const option = item.pronouns;
                  const isSelected = selectedPronouns === option;

                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.pronounOption,
                        isSelected && styles.selectedPronounOption,
                        pressed && styles.pronounOptionPressed,
                      ]}
                      onPress={() => savePronouns(option)}
                      disabled={savingPronouns}
                    >
                      <Text
                        style={[
                          styles.pronounOptionText,
                          isSelected && styles.selectedPronounOptionText,
                        ]}
                      >
                        {option}
                      </Text>

                      {isSelected ? (
                        <Text style={styles.pronounCheckmark}>✓</Text>
                      ) : null}
                    </Pressable>
                  );
                })
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.removePronounsButton,
                  pressed && styles.pronounOptionPressed,
                ]}
                onPress={() => savePronouns("")}
                disabled={savingPronouns || !selectedPronouns}
              >
                <Text
                  style={[
                    styles.removePronounsButtonText,
                    !selectedPronouns && styles.disabledRemovePronounsText,
                  ]}
                >
                  Remove pronouns
                </Text>
              </Pressable>

              {savingPronouns ? (
                <Text style={styles.savingPronounsText}>Saving...</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollContent: {
    paddingBottom: 50,
  },

  /* Header Container */
  profileHeader: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 15,
    minHeight: 380,
    justifyContent: "space-between",
  },
  navigationHeader: {
    width: "100%",
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
  },
  circleHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  backIcon: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "300",
    lineHeight: 36,
  },
  headerButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },

  /* Avatar Area */
  avatarSpaceContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    height: 220,
  },
  avatarBitmoji: {
    width: "100%",
    height: "100%",
  },

  /* Bottom Row inside Header */
  headerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  snapcodeContainer: {
    width: 72,
    height: 72,
  },
  snapcodeBorder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#FFFC00",
    borderWidth: 2,
    borderColor: "#000000",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  snapcodeInnerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFC00",
    alignItems: "center",
    justifyContent: "center",
  },
  snapcodeInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
  },
  nameContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  displayName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  usernameHandle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  heartButton: {
    padding: 4,
  },
  heartIcon: {
    fontSize: 48,
  },

  /* Body Content */
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#F2F2F7",
  },
  profileButtonRow: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 16,
  },
  mainProfileButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  mainProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Horizontal Info Pills */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  infoPillIcon: {
    fontSize: 15,
    marginRight: 5,
  },
  infoPillText: {
    color: "#1C1C1E",
    fontSize: 14,
    fontWeight: "600",
  },
  infoPillArrow: {
    color: "#8E8E93",
    fontSize: 16,
    marginLeft: 4,
    fontWeight: "600",
  },
  clickableInfoPill: {
    borderColor: "#D1D1D6",
  },
  infoPillPressed: {
    opacity: 0.65,
  },

  /* Standard Sections */
  sectionTitle: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 10,
  },
  profileCard: {
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  cardIconImage: {
    width: "100%",
    height: "100%",
  },
  cardIconText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "600",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  cardDescription: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 2,
  },
  arrow: {
    color: "#C7C7CC",
    fontSize: 32,
    fontWeight: "300",
    marginLeft: 8,
  },

  /* Map Card */
  mapCard: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  mapPlaceholder: {
    height: 160,
    backgroundColor: "#28313C",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderText: {
    color: "#798594",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  mapInformation: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  mapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#8E8E93",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  mapIconText: {
    color: "#8E8E93",
    fontSize: 24,
  },

  /* Logout Button & Footer */
  logOutButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#FFE5E7",
    borderWidth: 1,
    borderColor: "#FFB3B8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  logOutButtonText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 15,
  },
  footerGhost: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#AEAEB2",
    alignItems: "center",
    justifyContent: "center",
  },
  footerGhostText: {
    color: "#8E8E93",
    fontSize: 18,
    fontWeight: "800",
  },
  footerText: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 10,
  },

  /* Modal Sheet */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pronounSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  pronounSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C7C7CC",
    alignSelf: "center",
    marginBottom: 16,
  },
  pronounSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  pronounHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  pronounSheetTitle: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "800",
  },
  pronounSheetDescription: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 4,
  },
  closePronounButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  closePronounButtonText: {
    color: "#000000",
    fontSize: 22,
    lineHeight: 24,
  },
  pronounOptionsScroll: {
    flexGrow: 0,
  },
  pronounOptionsContent: {
    paddingBottom: 12,
  },
  pronounOption: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F2F2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedPronounOption: {
    borderColor: "#007AFF",
    backgroundColor: "#E5F1FF",
  },
  pronounOptionPressed: {
    opacity: 0.7,
  },
  pronounOptionText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedPronounOptionText: {
    color: "#007AFF",
  },
  pronounCheckmark: {
    color: "#007AFF",
    fontSize: 20,
    fontWeight: "800",
  },
  removePronounsButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFB3B8",
    backgroundColor: "#FFE5E7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  removePronounsButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledRemovePronounsText: {
    color: "#FF999E",
  },
  savingPronounsText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
  statusText: {
    color: "#8E8E93",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyPronounsContainer: {
    alignItems: "center",
    paddingBottom: 12,
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
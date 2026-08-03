import {
  Alert,
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
        <Text style={styles.cardIconText}>{icon}</Text>
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

function InfoPill({ icon, text, onPress }) {
  const content = (
    <>
      <Text style={styles.infoPillIcon}>{icon}</Text>
      <Text style={styles.infoPillText}>{text}</Text>
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

  const [pronounModalVisible, setPronounModalVisible] =
    useState(false);

  const [loadingPronouns, setLoadingPronouns] =
    useState(false);

  const [savingPronouns, setSavingPronouns] =
    useState(false);

  const email =
    user?.user_metadata?.email ||
    user?.email ||
    "";

  const username =
    user?.user_metadata?.username ||
    (email.includes("@") ? email.split("@")[0] : email) ||
    "Username";

  const profileInitial =
    username.length > 0
      ? username.charAt(0).toUpperCase()
      : "U";

  const profileColor =
    route.params?.backgroundColor || "#32C759";

  const getPronouns = async () => {
    try {
      setLoadingPronouns(true);

      const { data, error } = await supabase
        .from("Pronouns")
        .select("id, pronouns, created_at")
        .order("id", { ascending: true });

      if (error) {
        console.error(
          "Error fetching pronouns:",
          error.message
        );

        return;
      }

      console.log("Pronouns returned:", data);

      setPronouns(data || []);
    } catch (error) {
      console.error(
        "Unexpected error fetching pronouns:",
        error.message
      );
    } finally {
      setLoadingPronouns(false);
    }
  };

  const savePronouns = async (pronounValue) => {
    try {
      setSavingPronouns(true);

      const { data, error } =
        await supabase.auth.updateUser({
          data: {
            pronouns: pronounValue,
          },
        });

      if (error) {
        throw error;
      }

      console.log(
        "Updated user pronouns:",
        data.user?.user_metadata?.pronouns
      );

      setSelectedPronouns(pronounValue);
      setPronounModalVisible(false);
    } catch (error) {
      console.error(
        "Error saving pronouns:",
        error.message
      );

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
    setSelectedPronouns(
      user?.user_metadata?.pronouns || ""
    );
  }, [user?.user_metadata?.pronouns]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#101010"
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.profileHeader,
            { backgroundColor: profileColor },
          ]}
        >
          <View style={styles.navigationHeader}>
            <Pressable
              style={styles.circleHeaderButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <Text style={styles.headerUsername}>
              {username}
            </Text>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.circleHeaderButton}
                onPress={() =>
                  navigation.navigate("BackgroundBuild")
                }
              >
                <Text style={styles.headerButtonIcon}>
                  ◐
                </Text>
              </Pressable>

              <Pressable
                style={styles.circleHeaderButton}
                onPress={() =>
                  navigation.navigate("Settings")
                }
              >
                <Text style={styles.headerButtonIcon}>
                  ⚙
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profileInitial}
            </Text>
          </View>

          <Text style={styles.displayName}>
            {username}
          </Text>

          <Text style={styles.profileEmail}>
            {email || "No email available"}
          </Text>

          <View style={styles.profileButtonRow}>
            <Pressable style={styles.mainProfileButton}>
              <Text style={styles.mainProfileButtonText}>
                My Account
              </Text>
            </Pressable>

            <Pressable
              style={styles.mainProfileButton}
              onPress={() =>
                navigation.navigate("BackgroundBuild")
              }
            >
              <Text style={styles.mainProfileButtonText}>
                Change Background
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoRow}>
            <InfoPill
              icon="@"
              text={selectedPronouns || "Add pronouns"}
              onPress={() =>
                setPronounModalVisible(true)
              }
            />

            <InfoPill icon="•" text="Mar 10" />
            <InfoPill icon="★" text="1,188" />
            <InfoPill icon="♓" text="Pisces" />
          </View>

          <ProfileCard
            icon="+"
            title="Profile Features"
            description="Customize and explore your profile."
            onPress={() =>
              navigation.navigate("BackgroundBuild")
            }
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
              <Text style={styles.mapPlaceholderText}>
                MAP PREVIEW
              </Text>
            </View>

            <View style={styles.mapInformation}>
              <View style={styles.mapIcon}>
                <Text style={styles.mapIconText}>
                  ○
                </Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  Not Sharing Location
                </Text>

                <Text style={styles.cardDescription}>
                  Ghost Mode
                </Text>
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

          <SectionTitle>
            My Favorites & Reposts
          </SectionTitle>

          <View style={styles.largePlaceholderCard}>
            <View style={styles.smallPostPlaceholder}>
              <Text style={styles.placeholderText}>
                POST
              </Text>
            </View>
          </View>

          <SectionTitle>My Selfie</SectionTitle>

          <View style={styles.selfieCard}>
            <View style={styles.selfiePlaceholder}>
              <View style={styles.placeholderPerson}>
                <Text style={styles.placeholderPersonText}>
                  1
                </Text>
              </View>

              <View style={styles.placeholderPerson}>
                <Text style={styles.placeholderPersonText}>
                  2
                </Text>
              </View>

              <View style={styles.placeholderPerson}>
                <Text style={styles.placeholderPersonText}>
                  3
                </Text>
              </View>
            </View>

            <View style={styles.selfieInformation}>
              <View style={styles.selfieIcon}>
                <Text style={styles.selfieIconText}>
                  ☺
                </Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  Create My Selfie
                </Text>

                <Text style={styles.cardDescription}>
                  Create a personalized profile selfie.
                </Text>
              </View>
            </View>
          </View>

          <SectionTitle>Account</SectionTitle>

          <ProfileCard
            icon="⚙"
            title="Settings"
            description="Manage your profile and account."
            onPress={() =>
              navigation.navigate("Settings")
            }
          />

          <Pressable
            style={styles.logOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logOutButtonText}>
              Log Out
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <View style={styles.footerGhost}>
              <Text style={styles.footerGhostText}>
                U
              </Text>
            </View>

            <Text style={styles.footerText}>
              Member profile
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={pronounModalVisible}
        onRequestClose={() =>
          setPronounModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              setPronounModalVisible(false)
            }
          />

          <View style={styles.pronounSheet}>
            <View style={styles.pronounSheetHandle} />

            <View style={styles.pronounSheetHeader}>
              <View style={styles.pronounHeaderText}>
                <Text style={styles.pronounSheetTitle}>
                  Select your pronouns
                </Text>

                <Text
                  style={styles.pronounSheetDescription}
                >
                  Your selection will appear as the first
                  profile tag.
                </Text>
              </View>

              <Pressable
                style={styles.closePronounButton}
                onPress={() =>
                  setPronounModalVisible(false)
                }
              >
                <Text
                  style={styles.closePronounButtonText}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.pronounOptionsScroll}
              contentContainerStyle={
                styles.pronounOptionsContent
              }
              showsVerticalScrollIndicator={false}
            >
              {loadingPronouns ? (
                <Text style={styles.statusText}>
                  Loading pronouns...
                </Text>
              ) : pronouns.length === 0 ? (
                <View style={styles.emptyPronounsContainer}>
                  <Text style={styles.statusText}>
                    No pronouns are currently available.
                  </Text>

                  <Pressable
                    style={styles.retryButton}
                    onPress={getPronouns}
                  >
                    <Text style={styles.retryButtonText}>
                      Try Again
                    </Text>
                  </Pressable>
                </View>
              ) : (
                pronouns.map((item) => {
                  const option = item.pronouns;

                  const isSelected =
                    selectedPronouns === option;

                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.pronounOption,
                        isSelected &&
                          styles.selectedPronounOption,
                        pressed &&
                          styles.pronounOptionPressed,
                      ]}
                      onPress={() =>
                        savePronouns(option)
                      }
                      disabled={savingPronouns}
                    >
                      <Text
                        style={[
                          styles.pronounOptionText,
                          isSelected &&
                            styles.selectedPronounOptionText,
                        ]}
                      >
                        {option}
                      </Text>

                      {isSelected ? (
                        <Text
                          style={styles.pronounCheckmark}
                        >
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.removePronounsButton,
                  pressed &&
                    styles.pronounOptionPressed,
                ]}
                onPress={() => savePronouns("")}
                disabled={
                  savingPronouns || !selectedPronouns
                }
              >
                <Text
                  style={[
                    styles.removePronounsButtonText,
                    !selectedPronouns &&
                      styles.disabledRemovePronounsText,
                  ]}
                >
                  Remove pronouns
                </Text>
              </Pressable>

              {savingPronouns ? (
                <Text style={styles.savingPronounsText}>
                  Saving...
                </Text>
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
    backgroundColor: "#101010",
  },

  screen: {
    flex: 1,
    backgroundColor: "#101010",
  },

  scrollContent: {
    paddingBottom: 50,
  },

  profileHeader: {
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 25,
    alignItems: "center",
  },

  navigationHeader: {
    width: "100%",
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerUsername: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 10,
  },

  headerActions: {
    flexDirection: "row",
  },

  circleHeaderButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  backIcon: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "300",
    lineHeight: 42,
  },

  headerButtonIcon: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "600",
  },

  avatarPlaceholder: {
    width: 145,
    height: 145,
    borderRadius: 73,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 68,
    fontWeight: "800",
  },

  displayName: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
  },

  profileEmail: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 16,
    marginTop: 3,
  },

  profileButtonRow: {
    width: "100%",
    flexDirection: "row",
    marginTop: 22,
  },

  mainProfileButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    paddingHorizontal: 10,
  },

  mainProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  body: {
    paddingHorizontal: 17,
    paddingTop: 19,
    backgroundColor: "#101010",
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },

  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B3B3B",
    backgroundColor: "#1D1D1D",
    paddingVertical: 8,
    paddingHorizontal: 13,
    marginRight: 8,
    marginBottom: 8,
  },

  infoPillIcon: {
    color: "#A985FF",
    fontSize: 18,
    marginRight: 7,
  },

  infoPillText: {
    color: "#BEBEBE",
    fontSize: 15,
  },

  clickableInfoPill: {
    borderColor: "#6D55A8",
  },

  infoPillPressed: {
    opacity: 0.65,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 14,
  },

  profileCard: {
    minHeight: 102,
    borderRadius: 18,
    backgroundColor: "#1D1D1D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },

  cardPressed: {
    opacity: 0.7,
  },

  cardIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  cardIconText: {
    color: "#AFAFAF",
    fontSize: 31,
    fontWeight: "500",
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: "#F1F1F1",
    fontSize: 20,
    fontWeight: "500",
  },

  cardDescription: {
    color: "#9A9A9A",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 3,
  },

  arrow: {
    color: "#757575",
    fontSize: 46,
    fontWeight: "300",
    marginLeft: 10,
  },

  mapCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#1D1D1D",
  },

  mapPlaceholder: {
    height: 190,
    backgroundColor: "#28313C",
    alignItems: "center",
    justifyContent: "center",
  },

  mapPlaceholderText: {
    color: "#798594",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },

  mapInformation: {
    minHeight: 95,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  mapIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#8E8E8E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  mapIconText: {
    color: "#AFAFAF",
    fontSize: 35,
  },

  largePlaceholderCard: {
    height: 185,
    borderRadius: 18,
    backgroundColor: "#1D1D1D",
    padding: 18,
  },

  smallPostPlaceholder: {
    width: 100,
    height: 145,
    borderRadius: 14,
    backgroundColor: "#DADADA",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    color: "#747474",
    fontSize: 15,
    fontWeight: "800",
  },

  selfieCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#1D1D1D",
  },

  selfiePlaceholder: {
    height: 180,
    backgroundColor: "#EAEAEA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 10,
  },

  placeholderPerson: {
    width: 85,
    height: 125,
    borderRadius: 22,
    backgroundColor: "#BEBEBE",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-5deg" }],
  },

  placeholderPersonText: {
    color: "#777777",
    fontSize: 38,
    fontWeight: "800",
  },

  selfieInformation: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  selfieIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#949494",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  selfieIconText: {
    color: "#AFAFAF",
    fontSize: 34,
  },

  logOutButton: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: "#291719",
    borderWidth: 1,
    borderColor: "#6B272D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  logOutButtonText: {
    color: "#FF5D67",
    fontSize: 18,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 15,
  },

  footerGhost: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#CFCFCF",
    alignItems: "center",
    justifyContent: "center",
  },

  footerGhostText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  footerText: {
    color: "#A8A8A8",
    fontSize: 16,
    marginTop: 15,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },

  pronounSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#181818",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  pronounSheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#555555",
    alignSelf: "center",
    marginBottom: 18,
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
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },

  pronounSheetDescription: {
    color: "#A7A7A7",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 5,
  },

  closePronounButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },

  closePronounButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 30,
  },

  pronounOptionsScroll: {
    flexGrow: 0,
  },

  pronounOptionsContent: {
    paddingBottom: 12,
  },

  pronounOption: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#373737",
    backgroundColor: "#242424",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  selectedPronounOption: {
    borderColor: "#A985FF",
    backgroundColor: "#302744",
  },

  pronounOptionPressed: {
    opacity: 0.7,
  },

  pronounOptionText: {
    color: "#E6E6E6",
    fontSize: 17,
    fontWeight: "600",
  },

  selectedPronounOptionText: {
    color: "#FFFFFF",
  },

  pronounCheckmark: {
    color: "#B998FF",
    fontSize: 22,
    fontWeight: "800",
  },

  removePronounsButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#5B3034",
    backgroundColor: "#291719",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  removePronounsButtonText: {
    color: "#FF747D",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledRemovePronounsText: {
    color: "#725154",
  },

  savingPronounsText: {
    color: "#A985FF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 15,
  },

  statusText: {
    color: "#A7A7A7",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 24,
  },

  emptyPronounsContainer: {
    alignItems: "center",
    paddingBottom: 12,
  },

  retryButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#302744",
    borderWidth: 1,
    borderColor: "#A985FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
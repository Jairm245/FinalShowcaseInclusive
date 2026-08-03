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
  const [astrology, setAstrology] = useState("Pisces");
  const userSign = findAstrologySign();

  (useEffect(() => {
    setAstrology(userSign.sign);
  }),
    []);

  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={{ uri: "https://i.imgur.com/FxsJ3xy.jpg" }}
        style={{ width: 150, height: 150, borderRadius: 150 / 2 }}
      />
      <Text
        style={{
          justifyContents: "center",
          textAlign: "center",
        }}
      >
        {user &&
          user.user_metadata &&
          user.user_metadata.email.slice(
            0,
            user.user_metadata.email.indexOf("@"), // gets part before @ of email address, should use profile username instead
          )}
      </Text>
      <Button
        onPress={() => {
          navigation.navigate("Astrology");
        }}
        title={astrology}
        color="#841584"
        accessibilityLabel="Learn more about this purple button"
      />
      <Button onPress={handleSignOut} title="Log Out" />
      <Pressable>
        <Button
          onPress={() => {
            navigation.navigate("Settings", {});
          }}
          title="Settings"
        />
      </Pressable>
    </View>
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
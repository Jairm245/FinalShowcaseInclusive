import { Alert, ActivityIndicator, Image, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";
import leaningAvatar from "../../assets/Leaning_against_wall_greeting.png";
import stampBackground01 from "../../assets/backgrounds/STAMP_BG-01.png";
import stampBackground02 from "../../assets/backgrounds/STAMP_BG-02.png";
import stampBackground03 from "../../assets/backgrounds/STAMP_BG-03.png";
import stampBackground04 from "../../assets/backgrounds/STAMP_BGS-04.png";
import stampBackground05 from "../../assets/backgrounds/STAMP_BGS-05.png";
import stampBackground06 from "../../assets/backgrounds/STAMP_BGS-06.png";

const BITMOJI_BACKGROUNDS = [
  { id: "stamp-01", label: "Background 1", source: stampBackground01 },
  { id: "stamp-02", label: "Background 2", source: stampBackground02 },
  { id: "stamp-03", label: "Background 3", source: stampBackground03 },
  { id: "stamp-04", label: "Background 4", source: stampBackground04 },
  { id: "stamp-05", label: "Background 5", source: stampBackground05 },
  { id: "stamp-06", label: "Background 6", source: stampBackground06 },
];

// Default fallback list of interests
const DEFAULT_INTERESTS = ["Gaming","Music","Photography","Anime","Sports","Cooking","Travel","Fashion","Art","Fitness","Technology","Movies",];

// Hardcoded default friends list fallback
const HARDCODED_FRIENDS = [
  { id: "c51059d5-ecf0-4c87-bb61-06eb8c794e16", username: "ryanevo310" },
  { id: "404f276a-01ec-446d-915c-f808718d5465", username: "ricardo" },
  { id: "1e562829-785d-40a6-9c99-647f3a5baf67", username: "Jairsnap" },
];

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

function ProfileCard({icon,title,description,showArrow = true,onPress,}) {
  const isImageIcon = typeof icon === "string" && (icon.trim().startsWith("http://") || icon.trim().startsWith("https://"));

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

  const targetUserId = route.params?.userId || user?.id;
  const isOwnProfile = !route.params?.userId || route.params?.userId === user?.id;

  // Public Profile State from database
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Pronoun & Identity Modal States
  const [pronouns, setPronouns] = useState([]);
  const [selectedPronouns, setSelectedPronouns] = useState(
    user?.user_metadata?.pronouns || ""
  );
  const [selectedGenderIdentity, setSelectedGenderIdentity] = useState(
    user?.user_metadata?.gender_identity || ""
  );
  const [customIdentityInput, setCustomIdentityInput] = useState(
    user?.user_metadata?.gender_identity || ""
  );
  const [showCustomIdentityInput, setShowCustomIdentityInput] = useState(false);

  const [pronounModalVisible, setPronounModalVisible] = useState(false);
  const [loadingPronouns, setLoadingPronouns] = useState(false);
  const [savingPronouns, setSavingPronouns] = useState(false);

  // --- Interests Modal States ---
  const [interestsList, setInterestsList] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState( user?.user_metadata?.interests || []);
  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  // --- Heart Accessibility Modal States ---
  const [heartModalVisible, setHeartModalVisible] = useState(false);
  const [heartVisibility, setHeartVisibility] = useState("everyone");
  const [friendsList, setFriendsList] = useState(HARDCODED_FRIENDS);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [loadingHeartData, setLoadingHeartData] = useState(false);
  const [savingHeartData, setSavingHeartData] = useState(false);

  // --- Bitmoji Background Selection State ---
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [savingBackground, setSavingBackground] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    user?.user_metadata?.bitmoji_background || "stamp-01"
  );

  const email = user?.user_metadata?.email || user?.email || "";
  const username = profileData?.username || user?.user_metadata?.username || (email.includes("@") ? email.split("@")[0] : email) || "username";
  const displayName = profileData?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.display_name || "Ryan Aguilar";
  const profileInitial = username.length > 0 ? username.charAt(0).toUpperCase() : "U";
  const profileColor = route.params?.backgroundColor || "#9AA0A6";
  const savedBackgroundId = profileData?.bitmoji_background || user?.user_metadata?.bitmoji_background || selectedBackgroundId || "stamp-01";
  const selectedBackground = BITMOJI_BACKGROUNDS.find((background) => background.id === savedBackgroundId) || BITMOJI_BACKGROUNDS[0];
  const customHeartUrl = profileData?.custom_heart_url || user?.user_metadata?.custom_heart_url || null;
  
  // Fetch Public Profile from database
  const fetchProfile = async () => {
    if (!targetUserId) return;
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle();

      if (error) {
        console.error("Error fetching public profile:", error.message);
      } else if (data) {
        setProfileData(data);
        if (data.pronouns) {
          setSelectedPronouns(data.pronouns);
        }
        if (data.gender_identity) {
          setSelectedGenderIdentity(data.gender_identity);
          setCustomIdentityInput(data.gender_identity);
        }
        if (data.interests) {
          setSelectedInterests(data.interests);
        }
        if (data.bitmoji_background) {
          setSelectedBackgroundId(data.bitmoji_background);
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [targetUserId])
  );

  // --- Pronouns & Identity Fetch & Save ---
  const getPronouns = async () => {
    try {
      setLoadingPronouns(true);
      const { data, error } = await supabase.from("Pronouns").select("id, pronouns, created_at").order("id", { ascending: true });

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

  const savePronounsAndIdentity = async (pronounValue, genderValue) => {
    try {
      setSavingPronouns(true);

      const targetPronoun = pronounValue !== undefined ? pronounValue : selectedPronouns;
      const targetGender = genderValue !== undefined ? genderValue : selectedGenderIdentity;

      const { error: authError } = await supabase.auth.updateUser({
        data: { pronouns: targetPronoun, gender_identity: targetGender },
      });
      if (authError) throw authError;

      if (user?.id) {
        try {
          await supabase.from("profiles").upsert({ id: user.id, pronouns: targetPronoun, gender_identity: targetGender, updated_at: new Date(),});
        } catch (dbErr) {
          console.warn("Profiles DB sync warning:", dbErr.message);
        }
      }

      setSelectedPronouns(targetPronoun);
      setSelectedGenderIdentity(targetGender);
      setPronounModalVisible(false);
    } catch (error) {
      console.error("Error saving pronouns & identity:", error.message);
      Alert.alert( "Unable to save changes", "Please check your connection and try again."
      );
    } finally {
      setSavingPronouns(false);
    }
  };

  // --- Interests Fetch & Save ---
  const getInterests = async () => {
    try {
      setLoadingInterests(true);

      const { data, error } = await supabase.from("Interests").select("id, interest, name").order("id", { ascending: true });

      if (error || !data || data.length === 0) {
        setInterestsList(DEFAULT_INTERESTS.map((name, index) => ({ id: index, name })));
      } else {
        setInterestsList(data.map((item) => (
          { 
            id: item.id, name: item.interest || item.name,            
          }))
        );
      }
    } catch (error) {
      console.error("Unexpected error fetching interests:", error.message);
      setInterestsList(DEFAULT_INTERESTS.map((name, index) => ({ id: index, name })));
    } finally {
      setLoadingInterests(false);
    }
  };

  const toggleInterest = (interestName) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interestName));
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
  };

  const saveInterests = async () => {
    try {
      setSavingInterests(true);

      const { error: authError } = await supabase.auth.updateUser({
        data: { interests: selectedInterests },
      });
      if (authError) throw authError;

      if (user?.id) {
        try {
          await supabase.from("profiles").upsert({ id: user.id, interests: selectedInterests, updated_at: new Date(),});
        } catch (dbErr) {
          console.warn("Profiles DB interest sync warning:", dbErr.message);
        }
      }

      setInterestModalVisible(false);
    } catch (error) {
      console.error("Error saving interests:", error.message);
      Alert.alert( "Unable to save interests", "Please check your connection and try again.");
    } finally {
      setSavingInterests(false);
    }
  };

  // --- Heart Accessibility Settings Fetch & Save ---
  const fetchHeartSettings = async () => {
    try {
      setLoadingHeartData(true);

      if (user?.user_metadata?.heart_visibility) {
        setHeartVisibility(user.user_metadata.heart_visibility);
        setSelectedFriendIds(user.user_metadata.heart_allowed_friend_ids || []);
      }

      if (user?.id) {
        const { data: profile } = await supabase.from("profiles").select("heart_visibility, heart_allowed_friend_ids").eq("id", user.id).maybeSingle();

        if (profile) {
          if (profile.heart_visibility) setHeartVisibility(profile.heart_visibility);
          if (profile.heart_allowed_friend_ids)
            setSelectedFriendIds(profile.heart_allowed_friend_ids);
        }
      }

      const { data, error } = await supabase.from("profiles").select("id, username").neq("id", user?.id || "");

      if (!error && data && data.length > 0) {
        setFriendsList(data);
      } else {
        setFriendsList(HARDCODED_FRIENDS);
      }
    } catch (err) {
      console.error("Fetch heart settings error:", err);
      setFriendsList(HARDCODED_FRIENDS);
    } finally {
      setLoadingHeartData(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    const currentSelected = selectedFriendIds || [];
    if (currentSelected.includes(friendId)) {
      setSelectedFriendIds(currentSelected.filter((id) => id !== friendId));
    } else {
      setSelectedFriendIds([...currentSelected, friendId]);
    }
  };

  const saveHeartAccessibilitySettings = async () => {
    try {
      setSavingHeartData(true);
      const targetFriends = heartVisibility === "selected" ? selectedFriendIds : [];

      await supabase.auth.updateUser({
        data: { heart_visibility: heartVisibility, heart_allowed_friend_ids: targetFriends,},
      });

      if (user?.id) {
        try {
          await supabase.from("profiles").update({
              heart_visibility: heartVisibility,
              heart_allowed_friend_ids: targetFriends,
            })
            .eq("id", user.id);
        } catch (dbErr) {
          console.warn("Profiles DB sync warning:", dbErr.message);
        }
      }

      Alert.alert("Success", "Heart privacy settings updated!");
      setHeartModalVisible(false);
    } catch (error) {
      console.error("Error saving heart accessibility settings:", error?.message || error);
      Alert.alert("Unable to save settings", "Please try again.");
    } finally {
      setSavingHeartData(false);
    }
  };

  const saveBitmojiBackground = async (backgroundId) => {
    if (!isOwnProfile || !user?.id) return;

    try {
      setSavingBackground(true);
      setSelectedBackgroundId(backgroundId);

      const { error: authError } = await supabase.auth.updateUser({
        data: { bitmoji_background: backgroundId },
      });

      if (authError) throw authError;

      // This also saves to the profiles table when the
      // bitmoji_background column exists in Supabase.
      const { error: profileError } = await supabase.from("profiles").update({
          bitmoji_background: backgroundId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.warn( "Background saved to auth metadata, but profiles table sync failed:", profileError.message );
      } else {
        setProfileData((current) => ({
          ...(current || {}),
          bitmoji_background: backgroundId,
        }));
      }

      setBackgroundModalVisible(false);
    } catch (error) {
      console.error("Error saving Bitmoji background:", error?.message || error);
      Alert.alert(
        "Unable to save background",
        "Please check your connection and try again."
      );
    } finally {
      setSavingBackground(false);
    }
  };

  useEffect(() => {
    getPronouns();
    getInterests();
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.pronouns && !profileData?.pronouns) {
      setSelectedPronouns(user.user_metadata.pronouns);
    }
    if (user?.user_metadata?.gender_identity && !profileData?.gender_identity) {
      setSelectedGenderIdentity(user.user_metadata.gender_identity);
      setCustomIdentityInput(user.user_metadata.gender_identity);
    }
    if (user?.user_metadata?.interests && (!profileData?.interests || profileData?.interests.length === 0)) {
      setSelectedInterests(user.user_metadata.interests);
    }
    if (user?.user_metadata?.bitmoji_background && !profileData?.bitmoji_background) {
      setSelectedBackgroundId(user.user_metadata.bitmoji_background);
    }
  }, [user?.user_metadata, profileData?.bitmoji_background]);

  useEffect(() => {
    if (heartModalVisible) {
      fetchHeartSettings();
    }
  }, [heartModalVisible]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#8E9399" />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Area */}
        <ImageBackground
          source={selectedBackground.source}
          style={[styles.profileHeader, { backgroundColor: profileColor }]}
          imageStyle={styles.profileHeaderBackgroundImage}
          resizeMode="cover"
        >
          <View style={styles.profileHeaderShade} />

          <View style={styles.navigationHeader}>
            <Pressable
              style={styles.circleHeaderButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            {isOwnProfile && (
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.circleHeaderButton}
                  onPress={() => setBackgroundModalVisible(true)}
                >
                  <Text style={styles.headerButtonIcon}>▧</Text>
                </Pressable>

                <Pressable
                  style={styles.circleHeaderButton}
                  onPress={() => navigation.navigate("Settings")}
                >
                  <Text style={styles.headerButtonIcon}>⚙</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Central Area: Bitmoji Character + Extra Large Custom Heart Stand Side-by-Side */}
          <View style={styles.avatarSpaceContainer}>
            <Image
              source={leaningAvatar}
              style={styles.avatarBitmoji}
              resizeMode="contain"
            />

            <Pressable
              style={styles.largeHeartContainer}
              onPress={() => {
                if (isOwnProfile) {
                  navigation.navigate("CustomizationScreen");
                }
              }}
            >
              {customHeartUrl ? (
                <Image
                  source={{ uri: customHeartUrl }}
                  style={styles.customHeartImageLarge}
                />
              ) : (
                <Text style={styles.heartIconLarge}>💛</Text>
              )}
            </Pressable>
          </View>

          {/* Bottom Overlay Row (Snapcode, Name/Handle, Original Heart) */}
          <View style={styles.headerBottomRow}>
            <View style={styles.snapcodeContainer}>
              <View style={styles.snapcodeBorder}>
                <View style={styles.snapcodeInnerIcon}>
                  <Text style={styles.snapcodeInitial}>{profileInitial}</Text>
                </View>
              </View>
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.usernameHandle}>{username}</Text>
            </View>

            <Pressable
              style={styles.heartButton}
              onPress={() => {
                if (isOwnProfile) {
                  navigation.navigate("CustomizationScreen");
                }
              }}
            >
              {customHeartUrl ? (
                <Image
                  source={{ uri: customHeartUrl }}
                  style={styles.customHeartImage}
                />
              ) : (
                <Text style={styles.heartIcon}>💛</Text>
              )}
            </Pressable>
          </View>
        </ImageBackground>

        {/* Main Body */}
        <View style={styles.body}>
          <View style={styles.profileButtonRow}>
            <Pressable style={styles.mainProfileButton}>
              <Text style={styles.mainProfileButtonText}>My Account</Text>
            </Pressable>

            <Pressable style={styles.mainProfileButton}>
              <Text style={styles.mainProfileButtonText}>Public Profile</Text>
            </Pressable>
          </View>

          {/* FIRST SECTION (NON-SCROLLING): Auto-wrapping Interests & Tags */}
          <View style={styles.infoWrapContainer}>
          <InfoPill
            icon=""
            text={
              // Combine pronouns and gender identity dynamically if either (or both) exist
              [selectedPronouns, selectedGenderIdentity].filter(Boolean).length > 0
                ? [selectedPronouns, selectedGenderIdentity].filter(Boolean).join(" • ")
                : isOwnProfile
                ? "+ Add pronouns / identity"
                : "No pronouns"
            }
            showArrow={isOwnProfile}
            onPress={isOwnProfile ? () => setPronounModalVisible(true) : null}
          />

            {(selectedInterests || []).map((interest, index) => (
              <InfoPill
                key={index}
                icon="✨"
                text={interest}
                onPress={isOwnProfile ? () => setInterestModalVisible(true) : null}
              />
            ))}

            <InfoPill
              icon="🔎"
              text="Add Interests"
              showArrow={isOwnProfile}
              onPress={isOwnProfile ? () => setInterestModalVisible(true) : null}
            />

            <InfoPill icon="🎂" text="Mar 20" />
            <InfoPill icon="👻" text="1,936" />
            <InfoPill icon="♓" text="Pisces" showArrow={true} />
          </View>

          {/* SECOND SECTION: Add Topic Chat */}
          <View style={styles.secondInfoRow}>
            <InfoPill icon="🔥" text="Add Topic Chat" />
          </View>

          {/* Feature Cards */}
          <ProfileCard
            icon="https://link.snapchat.com/plus/plus.png"
            title="Snapchat+"
            description="Exclusive Early Access to lens, Bitmoji, etc..."
          />

          <ProfileCard
            icon="+"
            title="Manage Heart Accessibility"
            description="Control who can see your heart customization."
            onPress={() => setHeartModalVisible(true)}
          />

          {isOwnProfile && (
            <ProfileCard
              icon="♥"
              title="Customize hearts"
              description="Express yourself"
              onPress={() => navigation.navigate("CustomizationScreen")}
            />
          )}

            <ProfileCard
            icon="+"
            title="Profile Features"
            description="Customize and explore your profile."
            //onPress={() => navigation.navigate("BackgroundBuild")}
            />


          <SectionTitle>Friends</SectionTitle>

          <ProfileCard
            icon="+"
            title="Add Friends"
            description="Find and connect with new friends."
            onPress={() => navigation.navigate("AddFriend")}
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

          {isOwnProfile && (
            <>
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
            </>
          )}

          <View style={styles.footer}>
            <View style={styles.footerGhost}>
              <Text style={styles.footerGhostText}>U</Text>
            </View>
            <Text style={styles.footerText}>Member profile</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- Bitmoji Background Selection Modal --- */}
      <Modal
        animationType="slide"
        transparent
        visible={backgroundModalVisible}
        onRequestClose={() => setBackgroundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setBackgroundModalVisible(false)}
          />

          <View style={styles.backgroundSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.pronounSheetHeader}>
              <View style={styles.pronounHeaderText}>
                <Text style={styles.pronounSheetTitle}>Choose a background</Text>
                <Text style={styles.pronounSheetDescription}>
                  Select the background displayed behind your Bitmoji.
                </Text>
              </View>

              <Pressable
                style={styles.closePronounButton}
                onPress={() => setBackgroundModalVisible(false)}
              >
                <Text style={styles.closePronounButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.backgroundGrid}
            >
              {BITMOJI_BACKGROUNDS.map((background) => {
                const isSelected = selectedBackgroundId === background.id;

                return (
                  <Pressable
                    key={background.id}
                    style={[
                      styles.backgroundOption,
                      isSelected && styles.selectedBackgroundOption,
                    ]}
                    onPress={() => saveBitmojiBackground(background.id)}
                    disabled={savingBackground}
                  >
                    <Image
                      source={background.source}
                      style={styles.backgroundThumbnail}
                      resizeMode="cover"
                    />

                    <View style={styles.backgroundOptionFooter}>
                      <Text
                        style={[
                          styles.backgroundOptionText,
                          isSelected && styles.selectedBackgroundOptionText,
                        ]}
                      >
                        {background.label}
                      </Text>
                      {isSelected ? (
                        <Text style={styles.backgroundCheckmark}>✓</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {savingBackground ? (
              <View style={styles.backgroundSavingRow}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.backgroundSavingText}>Saving background...</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* --- Interests Selection Modal --- */}
      <Modal
        animationType="slide"
        transparent
        visible={interestModalVisible}
        onRequestClose={() => setInterestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setInterestModalVisible(false)}
          />

          <View style={styles.interestSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.pronounSheetHeader}>
              <View style={styles.pronounHeaderText}>
                <Text style={styles.pronounSheetTitle}>Select your interests</Text>
                <Text style={styles.pronounSheetDescription}>
                  Choose topics you like to share on your profile.
                </Text>
              </View>

              <Pressable
                style={styles.closePronounButton}
                onPress={() => setInterestModalVisible(false)}
              >
                <Text style={styles.closePronounButtonText}>×</Text>
              </Pressable>
            </View>

            {loadingInterests ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginVertical: 30 }}
              />
            ) : (
              <ScrollView
                style={styles.pronounOptionsScroll}
                contentContainerStyle={styles.interestGrid}
                showsVerticalScrollIndicator={false}
              >
                {interestsList.map((item) => {
                  const isSelected = selectedInterests.includes(item.name);
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.interestChip,
                        isSelected && styles.selectedInterestChip,
                      ]}
                      onPress={() => toggleInterest(item.name)}
                    >
                      <Text
                        style={[
                          styles.interestChipText,
                          isSelected && styles.selectedInterestChipText,
                        ]}
                      >
                        {item.name} {isSelected ? "✓" : "+"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setInterestModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveButton}
                onPress={saveInterests}
                disabled={savingInterests}
              >
                <Text style={styles.modalSaveText}>
                  {savingInterests ? "Saving..." : "Save Interests"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Heart Accessibility Modal --- */}
      <Modal
        animationType="slide"
        transparent
        visible={heartModalVisible}
        onRequestClose={() => setHeartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setHeartModalVisible(false)}
          />

          <View style={styles.heartSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.heartSheetTitle}>Who can see my hearts?</Text>
            <Text style={styles.heartSheetDescription}>
              Select who is allowed to view your customized heart badges.
            </Text>

            {loadingHeartData ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginVertical: 30 }}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                <Pressable
                  style={[
                    styles.accessOptionCard,
                    heartVisibility === "everyone" && styles.selectedAccessOption,
                  ]}
                  onPress={() => setHeartVisibility("everyone")}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accessOptionTitle}>Everyone</Text>
                    <Text style={styles.accessOptionDescription}>
                      Anyone viewing your profile can see your hearts.
                    </Text>
                  </View>
                  <Text style={styles.radioText}>
                    {heartVisibility === "everyone" ? "🔘" : "⚪"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.accessOptionCard,
                    heartVisibility === "friends" && styles.selectedAccessOption,
                  ]}
                  onPress={() => setHeartVisibility("friends")}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accessOptionTitle}>My Friends</Text>
                    <Text style={styles.accessOptionDescription}>
                      Only your added friends can see your hearts.
                    </Text>
                  </View>
                  <Text style={styles.radioText}>
                    {heartVisibility === "friends" ? "🔘" : "⚪"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.accessOptionCard,
                    heartVisibility === "selected" && styles.selectedAccessOption,
                  ]}
                  onPress={() => setHeartVisibility("selected")}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accessOptionTitle}>
                      Selected Friends Only
                    </Text>
                    <Text style={styles.accessOptionDescription}>
                      Pick specific friends who are allowed access.
                    </Text>
                  </View>
                  <Text style={styles.radioText}>
                    {heartVisibility === "selected" ? "🔘" : "⚪"}
                  </Text>
                </Pressable>

                {heartVisibility === "selected" && (
                  <View style={styles.friendPickerSection}>
                    <Text style={styles.friendPickerHeader}>
                      Select Allowed Friends
                    </Text>

                    {(friendsList || []).map((friend) => {
                      const isChecked = (selectedFriendIds || []).includes(
                        friend.id
                      );
                      return (
                        <Pressable
                          key={friend.id}
                          style={styles.friendSelectionRow}
                          onPress={() => toggleFriendSelection(friend.id)}
                        >
                          <Text style={styles.friendSelectionName}>
                            @{friend.username}
                          </Text>

                          <View
                            style={[
                              styles.checkboxBase,
                              isChecked && styles.checkboxChecked,
                            ]}
                          >
                            {isChecked && (
                              <Text style={styles.checkboxCheckmark}>✓</Text>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setHeartModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveButton}
                onPress={saveHeartAccessibilitySettings}
                disabled={savingHeartData}
              >
                <Text style={styles.modalSaveText}>
                  {savingHeartData ? "Saving..." : "Done"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Pronoun & Identity Selection Modal --- */}
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
            <View style={styles.sheetHandle} />

            <View style={styles.pronounSheetHeader}>
              <View style={styles.pronounHeaderText}>
                <Text style={styles.pronounSheetTitle}>Pronouns & Identity</Text>
                <Text style={styles.pronounSheetDescription}>
                  Select your pronouns or type how you identify.
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
              {/* Pronouns Section */}
              <Text style={styles.modalSectionHeader}>Pronouns</Text>
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
                      onPress={() => savePronounsAndIdentity(option, selectedGenderIdentity)}
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

              {/* Custom Gender / Identify As Section */}
              <Text style={[styles.modalSectionHeader, { marginTop: 18 }]}>
                Identify As
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.pronounOption,
                  (showCustomIdentityInput || selectedGenderIdentity) &&
                    styles.selectedPronounOption,
                  pressed && styles.pronounOptionPressed,
                ]}
                onPress={() => setShowCustomIdentityInput(!showCustomIdentityInput)}
              >
                <Text
                  style={[
                    styles.pronounOptionText,
                    (showCustomIdentityInput || selectedGenderIdentity) &&
                      styles.selectedPronounOptionText,
                  ]}
                >
                  Custom (Type your own)
                </Text>

                {selectedGenderIdentity ? (
                  <Text style={styles.pronounCheckmark}>✓</Text>
                ) : null}
              </Pressable>

              {/* Text Input Box for Custom Identity */}
              {(showCustomIdentityInput || selectedGenderIdentity) && (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customTextInput}
                    placeholder="Enter how you identify (e.g. Non-binary)"
                    placeholderTextColor="#8E8E93"
                    value={customIdentityInput}
                    onChangeText={setCustomIdentityInput}
                  />

                  <Pressable
                    style={styles.saveCustomIdentityButton}
                    onPress={() =>
                      savePronounsAndIdentity(selectedPronouns, customIdentityInput.trim())
                    }
                  >
                    <Text style={styles.saveCustomIdentityText}>Apply Identity</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.removePronounsButton,
                  pressed && styles.pronounOptionPressed,
                ]}
                onPress={() => {
                  setCustomIdentityInput("");
                  setShowCustomIdentityInput(false);
                  savePronounsAndIdentity("", "");
                }}
                disabled={savingPronouns || (!selectedPronouns && !selectedGenderIdentity)}
              >
                <Text
                  style={[
                    styles.removePronounsButtonText,
                    !selectedPronouns && !selectedGenderIdentity && styles.disabledRemovePronounsText,
                  ]}
                >
                  Clear pronouns & identity
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
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingBottom: 15,
    minHeight: 380,
    justifyContent: "space-between",
  },
  profileHeaderBackgroundImage: {
    opacity: 1,
  },
  profileHeaderShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
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

  /* Avatar & Standing Large Custom Heart Area */
  avatarSpaceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    height: 270,
  },
  avatarBitmoji: {
    width: 250,
    height: "100%",
  },
  largeHeartContainer: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -100,
  },
  customHeartImageLarge: {
    width: 140,
    height: 190,
    resizeMode: "contain",
  },
  heartIconLarge: {
    fontSize: 110,
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
    justifyContent: "center",
    alignItems: "center",
  },
  heartIcon: {
    fontSize: 48,
  },
  customHeartImage: {
    width: 52,
    height: 52,
    resizeMode: "contain",
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

  /* Non-scrolling Auto-wrapping Info Tags Container */
  infoWrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 6,
  },
  secondInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 8,
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

  /* Common Modal Elements */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C7C7CC",
    alignSelf: "center",
    marginBottom: 16,
  },

  /* Bitmoji Background Picker */
  backgroundSheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  backgroundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  backgroundOption: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    backgroundColor: "#F2F2F7",
    overflow: "hidden",
    marginBottom: 14,
  },
  selectedBackgroundOption: {
    borderColor: "#007AFF",
  },
  backgroundThumbnail: {
    width: "100%",
    height: 130,
  },
  backgroundOptionFooter: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  backgroundOptionText: {
    color: "#1C1C1E",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedBackgroundOptionText: {
    color: "#007AFF",
    fontWeight: "700",
  },
  backgroundCheckmark: {
    color: "#007AFF",
    fontSize: 18,
    fontWeight: "800",
  },
  backgroundSavingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  backgroundSavingText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  /* Interests Sheet Styles */
  interestSheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
  },
  interestChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
    backgroundColor: "#F2F2F7",
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 10,
  },
  selectedInterestChip: {
    borderColor: "#007AFF",
    backgroundColor: "#E5F1FF",
  },
  interestChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  selectedInterestChipText: {
    color: "#007AFF",
    fontWeight: "700",
  },

  /* Heart Accessibility Sheet Styles */
  heartSheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heartSheetTitle: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "800",
  },
  heartSheetDescription: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  accessOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selectedAccessOption: {
    borderColor: "#007AFF",
    backgroundColor: "#E5F1FF",
  },
  accessOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  accessOptionDescription: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  radioText: {
    fontSize: 18,
    marginLeft: 8,
  },
  friendPickerSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#E5E5EA",
  },
  friendPickerHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 10,
  },
  friendSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#F2F2F7",
  },
  friendSelectionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkboxCheckmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalButtonRow: {
    flexDirection: "row",
    marginTop: 15,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8E8E93",
  },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Pronoun Modal Sheet Styles */
  pronounSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
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
  modalSectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  customInputContainer: {
    marginTop: 10,
    marginBottom: 12,
  },
  customTextInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#000000",
  },
  saveCustomIdentityButton: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveCustomIdentityText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
    marginTop: 10,
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
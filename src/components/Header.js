import { Text, View, StyleSheet, Button, Image } from "react-native";
import { colors } from "../../assets/themes/colors";
import { fontHeader } from "../../assets/themes/font";
import { Followers, More, Search } from "../../assets/snapchat/HeaderIcons";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import AddFriendScreen from "../screens/AddFriendScreen";

import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import SearchScreen from "../screens/SearchScreen";
import { useState, useEffect } from "react";
import { useAuthentication } from "../../utils/hooks/useAuthentication";
import { supabase } from "../../utils/hooks/supabase";

import SelectionMenu from "./SelectionMenu";
const Stack = createStackNavigator();

export default function Header({ title }) {
  const navigation = useNavigation();

  const [profilePicUrl, setProfilePicUrl] = useState(
    "data:image/jpeg;base64,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",
  );

  const { user } = useAuthentication();

  useEffect(() => {
    async function fetchProfilePic() {
      if (user === null) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile pic fetch failure");
      } else if (data.avatar_url) {
        setProfilePicUrl(data.avatar_url);
      }
    }

    fetchProfilePic();
  }, [user]);

  const [showMenu, setShowMenu] = useState(false);
  // console.log(showMenu);

  // const handleClick = () => {
  //   setShowMenu(true)
  //   console.log("handleClick")
  // }

  return (
    <View style={styles.container}>
      <View style={styles.headerLeft}>
        <Pressable
          style={[styles.profile, styles.buttons]}
          onPress={() => {
            navigation.navigate("Profile");
          }}
        >
          <Image style={styles.profileImage} source={{ uri: profilePicUrl }} />
        </Pressable>
        <Pressable
          style={[styles.search, styles.buttons]}
          onPress={() => {
            navigation.navigate("Search");
          }}
        >
          <Search />
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.headerRight}>
        <Pressable
          style={[styles.followers, styles.buttons]}
          onPress={() => {
            navigation.navigate("AddFriend");
          }}
        >
          <Followers />
        </Pressable>

        <Pressable title="Open Bottom Sheet" onPress={() => setShowMenu(true)}>
          <View style={[styles.more, styles.buttons]}>
            <More />
          </View>
        </Pressable>
        {/* {showMenu && <SelectionMenu/>} */}
        <SelectionMenu showMenu={showMenu} setShowMenu={setShowMenu} />
      </View>
    </View>
  );
}

let screenOptions = {
  tabBarShowLabel: false,
  headerLeft: () => (
    <Button
      onPress={() => {
        signOut(auth)
          .then(() => {
            // Sign-out successful.
            user = null;
          })
          .catch((error) => {
            // An error happened.
            // should we do something with that error??
          });
      }}
      title="Log Out"
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: colors.primary,
    fontSize: fontHeader.fontSize,
    fontFamily: fontHeader.fontFamily,
    fontWeight: fontHeader.fontWeight,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  buttons: {
    borderRadius: 100,
    height: 44,
    width: 44,
    backgroundColor: colors.interactionGraySubtle,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

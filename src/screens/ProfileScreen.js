import {Image,Text,View,Button,StyleSheet,} from "react-native";
import { supabase } from "../../utils/hooks/supabase";
import { useNavigation } from "@react-navigation/native";
import { useAuthentication } from "../../utils/hooks/useAuthentication";

const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error.message);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthentication();

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://i.imgur.com/FxsJ3xy.jpg",
        }}
        style={styles.avatar}
      />

      <Text style={styles.username}>
        {user?.user_metadata?.email?.slice(
          0,
          user.user_metadata.email.indexOf("@"),
        )}
      </Text>

      {/* Opens the BackgroundBuild screen */}
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => {
            navigation.navigate("BackgroundBuild");
          }}
          title="Change Background"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={() => {
            navigation.navigate("Settings");
          }}
          title="Settings"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSignOut}
          title="Log Out"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },

  username: {
    textAlign: "center",
    marginBottom: 10,
  },

  buttonContainer: {
    width: 220,
    marginVertical: 5,
  },
});
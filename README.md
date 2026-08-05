# Snap Stamp

We recently paired with rainbow labs to find out what the youth of ages 12-18 are struggling with and that is finding a safe space where they can express themselves and fight isolation. This feature was made to help people being able to express themselves and inspire others to do the same by following in their foot steps

1. A Snapchat-styled **login/sign-up screen** (Supabase Auth, email + password)
2. A **full-screen camera** that opens right after login (Expo Camera —
   capture photo, flip camera, toggle flash, preview + retake)
3. being able to add hearts to represent how people identify themselves as.
4. changing the background of the chat
5. Customizing a stamp to express oneself
6. Having a Snap Stamp next to the Bitmoji
7. Adding pronouns
8. Accessibility of who gets to see ones Stamp
9. sponsored Stamps
10. border around the profile picture
11. add stickers to stamp
12. Added Interest
13. Adding Pronouns


## Tech stack

- Expo **SDK 54** (pinned — required for this to work in current Expo Go)
- React Native 0.81 / React 19
- Written in Javascript but is scaffolded to be refactor in TypeScript
- Supabase (`@supabase/supabase-js`) for auth + database
- `expo-camera` for the camera
- `@react-navigation/native` + `native-stack` are pre-installed (not wired up
  yet) — you'll want these once you add more screens (chat, stories, profile)

## 1. Set up Supabase

1. Create a free project at https://supabase.com
2. In your project, go to **Settings → API** and copy the **Project URL**
   and the **anon/public key**
3. Create an `.env.local` on the root. Paste in the following keys with YOUR values.

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```

4. In Supabase, go to **Authentication → Providers** and make sure
   **Email** is `not` enabled. Under **Authentication →
   Settings** you may want to turn **off** "Confirm email" so users can
   sign up and log straight in without checking an inbox.

## 2. Install & run

```bash
npm install
npm install expo
npx expo install react-native-view-shot
npx expo start
@supabase/supabase-js
npm install @supabase/supabase-js
```

Scan the QR code with the **Expo Go** app (SDK 54 build) on your phone.
Camera access requires a physical device or a simulator with camera
support — it will not work in the web preview. Please allow Expo Go to access your camera

## 3. Project structure

```
App.jsx                    -- auth listener: shows LoginScreen or CameraScreen
src/lib/supabase.js         -- Supabase client (put your keys here)
src/screens/LoginScreen.jsx  -- Snapchat-styled auth screen
src/screens/CameraScreen.jsx -- full-screen camera + capture/preview
src/screens/ProfileScreen.js -- ProfileScreen
src/screens/CustomizationScreen.js -- customize Stamp
src/screens/GroupheartsScreen.js -- Shows Stamps being sent
src/screens/AddFriendScreen.js -- Shows friends hearts in real time

```

import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import Svg, { Path, ClipPath, Defs, Image as SvgImage } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ViewShot from "react-native-view-shot";
import { supabase } from "../../utils/hooks/supabase"; //  Supabase client

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

// --- Draggable & Scalable Layer Component ---
function InteractiveLayer({ children, onSelect, isSelected }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Pan Gesture (Drag around)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (onSelect) {
        runOnJS(onSelect)(); // Fixes crash when tapping/dragging layer
      }
    })
    .onChange((e) => {
      translateX.value += e.changeX;
      translateY.value += e.changeY;
    });

  // Pinch Gesture (Zoom/Resize)
  const pinchGesture = Gesture.Pinch().onChange((e) => {
    scale.value *= e.scaleChange;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
      <Animated.View
        style={[
          styles.layer,
          animatedStyle,
          isSelected && styles.selectedLayerBorder,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// --- Main Creator Screen ---
export default function CustomizationScreen() {
  const viewShotRef = useRef(null);

  // Background Customizations
  const [heartColor, setHeartColor] = useState("#FF2D55");
  const [selectedPattern, setSelectedImage] = useState(null);

  // Layers State (Text & Stickers)
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [textInput, setTextInput] = useState("");

  // Presets
  const colors = ["#FF2D55", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#5856D6"];
  const patterns = [
    { id: "none", uri: null, label: "Solid" },
    { id: "glitter", uri: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400", label: "Glitter" },
    { id: "galaxy", uri: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400", label: "Galaxy" },
  ];
  const stickers = [
    "https://upload.wikimedia.org/wikipedia/commons/c/cd/Gilbert_Baker_Progress_Pride_flag-cropped.png",
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Queerhet_flag.png",
    "https://upload.wikimedia.org/wikipedia/commons/8/81/Bisexual_LGBTQ%2B_Pride_Flag.png",
    "https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Mexico%2C_1968.png"
    
  ];

  // --- Layer Management ---
  const addTextLayer = () => {
    if (!textInput.trim()) return;
    const newLayer = {
      id: Date.now().toString(),
      type: "text",
      content: textInput,
      color: "#FFFFFF",
    };
    setLayers([...layers, newLayer]);
    setTextInput("");
  };

  const addStickerLayer = (uri) => {
    const newLayer = {
      id: Date.now().toString(),
      type: "sticker",
      uri: uri,
    };
    setLayers([...layers, newLayer]);
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setLayers(layers.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  // --- Export & Upload to Supabase ---
  const saveAndUploadHeart = async () => {
    try {
      // Unselect layers so selection borders aren't captured
      setSelectedLayerId(null);

      // 1. Capture canvas as PNG
      const uri = await viewShotRef.current.capture();

      // 2. Format file buffer
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // 3. Upload to Supabase storage bucket
      const fileName = `custom-hearts/${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from("pictureStorage")
        .upload(fileName, arrayBuffer, { contentType: "image/png" });

      if (error) {
        Alert.alert("Upload Error", error.message);
      } else {
        Alert.alert("Success!", "Your custom heart has been saved!");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not export image.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Heart Creator Studio</Text>

      {/* --- CANVAS WORKSPACE --- */}
      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
        <View style={styles.canvas}>
          {/* Base Heart Layer */}
          <Svg width={200} height={200} viewBox="0 0 24 24">
            <Defs>
              <ClipPath id="heartClip">
                <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </ClipPath>
            </Defs>

            {selectedPattern ? (
              <SvgImage
                href={{ uri: selectedPattern }}
                width="24"
                height="24"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#heartClip)"
              />
            ) : (
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={heartColor}
              />
            )}
          </Svg>

          {/* Interactive Overlay Layers */}
          {layers.map((layer) => (
            <InteractiveLayer
              key={layer.id}
              isSelected={selectedLayerId === layer.id}
              onSelect={() => setSelectedLayerId(layer.id)}
            >
              {layer.type === "text" ? (
                <Text style={[styles.layerText, { color: layer.color }]}>
                  {layer.content}
                </Text>
              ) : (
                <Image source={{ uri: layer.uri }} style={styles.stickerImage} />
              )}
            </InteractiveLayer>
          ))}
        </View>
      </ViewShot>

      {/* --- CANVA TOOLBAR CONTROLS --- */}
      <View style={styles.toolbar}>
        {/* Layer Controls */}
        {selectedLayerId && (
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteSelectedLayer}>
            <Text style={styles.deleteBtnText}>🗑 Delete Selected Item</Text>
          </TouchableOpacity>
        )}

        {/* Text Adding Tool */}
        <Text style={styles.sectionTitle}>Add Custom Text</Text>
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type word/pronouns..."
            placeholderTextColor="#888"
            value={textInput}
            onChangeText={setTextInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addTextLayer}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Sticker Tool */}
        <Text style={styles.sectionTitle}>Add Stickers</Text>
        <View style={styles.row}>
          {stickers.map((uri, idx) => (
            <TouchableOpacity key={idx} onPress={() => addStickerLayer(uri)}>
              <Image source={{ uri }} style={styles.stickerThumb} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Base Heart Color / Pattern */}
        <Text style={styles.sectionTitle}>Heart Base Pattern</Text>
        <View style={styles.row}>
          {patterns.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.patternBox,
                selectedPattern === p.uri && styles.selectedBorder,
              ]}
              onPress={() => setSelectedImage(p.uri)}
            >
              <Text style={styles.patternLabel}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!selectedPattern && (
          <View style={styles.row}>
            {colors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  heartColor === c && styles.selectedBorder,
                ]}
                onPress={() => setHeartColor(c)}
              />
            ))}
          </View>
        )}

        {/* Save/Export */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveAndUploadHeart}>
          <Text style={styles.saveBtnText}>Save & Upload to Supabase</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 15,
    color: "#111",
  },
  canvas: {
    width: 280,
    height: 280,
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
    padding: 4,
  },
  selectedLayerBorder: {
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
  },
  layerText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  stickerImage: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },
  toolbar: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  textInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  addBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 10,
  },
  addBtnText: { color: "#FFF", fontWeight: "bold" },
  stickerThumb: { width: 44, height: 44, borderRadius: 8 },
  patternBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#EFEFEF",
    borderRadius: 8,
  },
  patternLabel: { fontSize: 13, fontWeight: "600" },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  selectedBorder: { borderWidth: 3, borderColor: "#007AFF" },
  deleteBtn: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteBtnText: { color: "#FFF", fontWeight: "bold" },
  saveBtn: {
    backgroundColor: "#FF3386",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
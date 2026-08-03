import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Svg, { Path, ClipPath, Defs, Image as SvgImage, Text as SvgText, G } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ViewShot from "react-native-view-shot";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  runOnJS,
} from "react-native-reanimated";
import { supabase } from "../../utils/hooks/supabase";

const NETWORK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
};

// Create an Animated version of SVG G (Group) component
const AnimatedG = Animated.createAnimatedComponent(G);

// Path definition shared across fill, border, and clip paths
const HEART_PATH_D =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

// --- Interactive Layer within SVG Bounds ---
function InteractiveStickerLayer({ layer, isSelected, onSelect }) {
  const translateX = useSharedValue(layer.x || 0);
  const translateY = useSharedValue(layer.y || 0);
  const scale = useSharedValue(layer.scale || 1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (onSelect) runOnJS(onSelect)();
    })
    .onChange((e) => {
      // Map screen drag coordinates to SVG viewBox scale space (24 / 250 scale ratio)
      const nextX = translateX.value + e.changeX * (24 / 250);
      const nextY = translateY.value + e.changeY * (24 / 250);

      // Clamp coordinates to keep sticker origins within heart range
      translateX.value = Math.max(-6, Math.min(6, nextX));
      translateY.value = Math.max(-6, Math.min(6, nextY));
    });

  const pinchGesture = Gesture.Pinch().onChange((e) => {
    scale.value = Math.max(0.5, Math.min(3, scale.value * e.scaleChange));
  });

  // Bind shared values to SVG transforms on the UI thread safely
  const animatedGroupProps = useAnimatedProps(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const clipId = `heartClipLayer-${layer.id}`;

  return (
    <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <Svg width={250} height={250} viewBox="0 0 24 24" style={StyleSheet.absoluteFill}>
          {/* Defs nested locally so this independent SVG context can access the clip path */}
          <Defs>
            <ClipPath id={clipId}>
              <Path d={HEART_PATH_D} />
            </ClipPath>
          </Defs>

          <G clipPath={`url(#${clipId})`}>
            <AnimatedG animatedProps={animatedGroupProps}>
              {layer.type === "sticker" ? (
                <SvgImage
                  href={layer.source}
                  x="8"
                  y="8"
                  width="8"
                  height="8"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <SvgText
                  x="12"
                  y="12"
                  fill={layer.color || "#FFFFFF"}
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {layer.content}
                </SvgText>
              )}
            </AnimatedG>
          </G>
        </Svg>
      </View>
    </GestureDetector>
  );
}

// --- Main Creator Screen ---
export default function CustomizationScreen({ navigation }) {
  const viewShotRef = useRef(null);

  // Customization States
  const [fillColor, setFillColor] = useState("#FFF000");
  const [strokeColor, setStrokeColor] = useState("#8E44AD");
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Dynamic Stickers State from Supabase
  const [stickers, setStickers] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(true);

  // Canvas Layers
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [textInput, setTextInput] = useState("");

  // Presets
  const frameColors = ["#8E44AD", "#FF2D55", "#FF9500", "#4CD964", "#007AFF", "#000000"];
  const heartFillColors = ["#FFF000", "#FF2D55", "#FF9500", "#4CD964", "#5AC8FA", "#FFFFFF"];

  const patterns = [
    { id: "none", uri: null, label: "Solid" },
    { id: "glitter", uri: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400", label: "Glitter" },
    { id: "galaxy", uri: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400", label: "Galaxy" },
  ];

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async () => {
    try {
      setLoadingStickers(true);
      const { data, error } = await supabase
        .from("stickers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching stickers:", error.message);
      } else if (data && data.length > 0) {
        setStickers(data);
      } else {
        setStickers([
          {
            id: "mexico-flag",
            image_url:
              "https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Mexico%2C_1968.png",
          },
        ]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingStickers(false);
    }
  };

  const addTextLayer = () => {
    if (!textInput.trim()) return;
    const newLayer = {
      id: Date.now().toString(),
      type: "text",
      content: textInput,
      color: "#FFFFFF",
      x: 0,
      y: 0,
      scale: 1,
    };
    setLayers([...layers, newLayer]);
    setTextInput("");
  };

  const addStickerLayer = (imageUrl) => {
    if (!imageUrl) return;
    const newLayer = {
      id: Date.now().toString(),
      type: "sticker",
      source: { uri: imageUrl, headers: NETWORK_HEADERS },
      x: 0,
      y: 0,
      scale: 1,
    };
    setLayers([...layers, newLayer]);
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setLayers(layers.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const saveAndUploadHeart = async () => {
    try {
      setSelectedLayerId(null);
      const uri = await viewShotRef.current.capture();
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const fileName = `custom-hearts/${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from("pictureStorage")
        .upload(fileName, arrayBuffer, { contentType: "image/png" });

      if (error) {
        Alert.alert("Upload Error", error.message);
      } else {
        Alert.alert("Saved!", "Your heart has been saved.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not save image.");
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP CANVAS AREA */}
      <View style={styles.topCanvasContainer}>
        <SafeAreaView style={styles.floatingTopBar}>
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveCapsuleBtn}
            onPress={saveAndUploadHeart}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* ViewShot Canvas Area */}
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.canvasArea}>
            <Svg width={250} height={250} viewBox="0 0 24 24">
              <Defs>
                <ClipPath id="heartClipMain">
                  <Path d={HEART_PATH_D} />
                </ClipPath>
              </Defs>

              {/* Heart Fill Background */}
              {selectedPattern ? (
                <SvgImage
                  href={{ uri: selectedPattern }}
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#heartClipMain)"
                />
              ) : (
                <Path d={HEART_PATH_D} fill={fillColor} />
              )}

              {/* Outline Border */}
              <Path
                d={HEART_PATH_D}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </Svg>

            {/* Draggable Layers Masked INSIDE Heart Bounds */}
            {layers.map((layer) => (
              <InteractiveStickerLayer
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                onSelect={() => setSelectedLayerId(layer.id)}
              />
            ))}
          </View>
        </ViewShot>

        <View style={styles.floatingControls}>
          <TouchableOpacity style={styles.circleIconBtn}>
            <Text style={styles.undoText}>↶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleIconBtn}>
            <Text style={styles.undoText}>↷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM DRAWER */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedLayerId && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={deleteSelectedLayer}
            >
              <Text style={styles.deleteBtnText}>🗑 Delete Selected Item</Text>
            </TouchableOpacity>
          )}

          {/* Section 1: Frame */}
          <Text style={styles.sectionHeader}>Frame</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
            {frameColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.optionCard,
                  { backgroundColor: color },
                  strokeColor === color && styles.selectedOptionCard,
                ]}
                onPress={() => setStrokeColor(color)}
              />
            ))}
          </ScrollView>

          {/* Section 2: Heart Fill */}
          <Text style={styles.sectionHeader}>Background</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
            {heartFillColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.optionCard,
                  { backgroundColor: color },
                  fillColor === color && !selectedPattern && styles.selectedOptionCard,
                ]}
                onPress={() => {
                  setSelectedPattern(null);
                  setFillColor(color);
                }}
              />
            ))}
            {patterns.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.optionCard,
                  styles.patternCard,
                  selectedPattern === p.uri && styles.selectedOptionCard,
                ]}
                onPress={() => setSelectedPattern(p.uri)}
              >
                <Text style={styles.patternLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Section 3: Add Text */}
          <Text style={styles.sectionHeader}>Add Text</Text>
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type word or pronouns..."
              placeholderTextColor="#999"
              value={textInput}
              onChangeText={setTextInput}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTextLayer}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Section 4: Dynamic Stickers */}
          <Text style={styles.sectionHeader}>Stickers</Text>
          {loadingStickers ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
              {stickers.map((item) => (
                <TouchableOpacity
                  key={item.id || item.image_url}
                  style={styles.stickerCard}
                  onPress={() => addStickerLayer(item.image_url)}
                >
                  <Image
                    source={{ uri: item.image_url, headers: NETWORK_HEADERS }}
                    style={styles.stickerThumb}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C2C2E",
  },
  topCanvasContainer: {
    flex: 1.1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  floatingTopBar: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  saveCapsuleBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 15,
  },
  canvasArea: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  floatingControls: {
    position: "absolute",
    bottom: 20,
    left: 20,
    flexDirection: "row",
    gap: 10,
  },
  undoText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomSheet: {
    flex: 0.9,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginTop: 15,
    marginBottom: 10,
  },
  horizontalRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  optionCard: {
    width: 70,
    height: 90,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  patternCard: {
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedOptionCard: {
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  textInputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 12,
  },
  addBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  stickerCard: {
    width: 70,
    height: 70,
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stickerThumb: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  deleteBtn: {
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  deleteBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
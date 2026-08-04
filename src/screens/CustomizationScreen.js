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
import Svg, { Path, ClipPath, Defs, Image as SvgImage } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ViewShot from "react-native-view-shot";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { supabase } from "../../utils/hooks/supabase";
import { useAuthentication } from "../../utils/hooks/useAuthentication";

const NETWORK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
};

const HEART_PATH_D =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const CATEGORIES = [
  { id: "nationality", label: "Nationality" },
  { id: "lgbtqia", label: "LGBTQIA+" },
  { id: "sports", label: "Sports" },
  {id:"animals", label:"Animals"},
];

// --- Individual Sticker Layer with Compact Touch Target ---
function InteractiveStickerLayer({ layer, isSelected, onSelect }) {
  const translateX = useSharedValue(layer.x || 0);
  const translateY = useSharedValue(layer.y || 0);
  const scale = useSharedValue(layer.scale || 1);
  const savedScale = useSharedValue(layer.scale || 1);

  // Sync scale if changed via button controls
  useEffect(() => {
    if (layer.scale !== undefined) {
      scale.value = layer.scale;
      savedScale.value = layer.scale;
    }
  }, [layer.scale]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (onSelect) runOnJS(onSelect)();
    })
    .onChange((e) => {
      translateX.value += e.changeX;
      translateY.value += e.changeY;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.4, Math.min(3.5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
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
          styles.stickerContainer,
          isSelected && styles.selectedStickerBorder,
          animatedStyle,
        ]}
      >
        {layer.type === "sticker" ? (
          <Image
            source={layer.source}
            style={styles.stickerImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.layerText}>{layer.content}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// --- Main Customization Screen ---
export default function CustomizationScreen({ navigation }) {
  const { user } = useAuthentication();
  const viewShotRef = useRef(null);

  // Customization States
  const [fillColor, setFillColor] = useState("#FFF000");
  const [strokeColor, setStrokeColor] = useState("#8E44AD");
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Dynamic Stickers State
  const [stickers, setStickers] = useState([]);
  const [activeCategory, setActiveCategory] = useState("nationality");
  const [loadingStickers, setLoadingStickers] = useState(true);

  // Canvas Layers
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [textInput, setTextInput] = useState("");

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
            image_url: "https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Mexico%2C_1968.png",
            category: "nationality",
            interest: "Mexico",
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

  const addStickerLayer = (stickerItem) => {
    if (!stickerItem?.image_url) return;
    const newLayer = {
      id: Date.now().toString(),
      type: "sticker",
      source: { uri: stickerItem.image_url, headers: NETWORK_HEADERS },
      interest: stickerItem.interest || stickerItem.title || "General",
      x: 0,
      y: 0,
      scale: 1,
    };
    setLayers([...layers, newLayer]);
  };

  const updateSelectedScale = (factor) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === selectedLayerId) {
          const currentScale = layer.scale || 1;
          const newScale = Math.max(0.4, Math.min(3.5, currentScale * factor));
          return { ...layer, scale: newScale };
        }
        return layer;
      })
    );
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    setLayers(layers.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const saveAndUploadHeart = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "You must be logged in to save your heart.");
        return;
      }

      setSelectedLayerId(null);

      // Capture canvas view as PNG
      const uri = await viewShotRef.current.capture();
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Upload PNG to Supabase bucket
      const fileName = `custom-hearts/${user.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("heartStorage")
        .upload(fileName, arrayBuffer, { contentType: "image/png" });

      if (uploadError) {
        Alert.alert("Upload Error", uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("heartStorage")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update public profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          custom_heart_url: publicUrl,
          updated_at: new Date(),
        });

      await supabase.auth.updateUser({
        data: { custom_heart_url: publicUrl },
      });

      if (profileError) {
        Alert.alert("Error updating profile", profileError.message);
      } else {
        Alert.alert("Saved!", "Your heart is now updated on your profile.", [
          { text: "OK", onPress: () => navigation?.goBack() },
        ]);
      }
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Could not save image.");
    }
  };

  // Robust category filtering (strips spaces and normalizes case/plus signs)
  const filteredStickers = stickers.filter((item) => {
    if (!item.category) return activeCategory === "nationality";
    const cleanDbCat = item.category.trim().toLowerCase().replace("+", "");
    const cleanActiveCat = activeCategory.trim().toLowerCase().replace("+", "");
    return cleanDbCat === cleanActiveCat;
  });

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

              <Path
                d={HEART_PATH_D}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </Svg>

            {/* Draggable Layer Container */}
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
      </View>

      {/* BOTTOM DRAWER */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Controls for Selected Layer */}
          {selectedLayerId && (
            <View style={styles.selectedControlsRow}>
              <TouchableOpacity
                style={styles.scaleBtn}
                onPress={() => updateSelectedScale(0.85)}
              >
                <Text style={styles.scaleBtnText}>🔍 - Scale Down</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scaleBtn}
                onPress={() => updateSelectedScale(1.15)}
              >
                <Text style={styles.scaleBtnText}>🔍 + Scale Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={deleteSelectedLayer}
              >
                <Text style={styles.deleteBtnText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
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
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabsRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  activeCategory === cat.id && styles.activeCategoryTab,
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === cat.id && styles.activeCategoryTabText,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loadingStickers ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 15 }} />
          ) : filteredStickers.length === 0 ? (
            <Text style={styles.emptyText}>No stickers in this category yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalRow}>
              {filteredStickers.map((item) => (
                <TouchableOpacity
                  key={item.id || item.image_url}
                  style={styles.stickerCard}
                  onPress={() => addStickerLayer(item)}
                >
                  <Image
                    source={{ uri: item.image_url, headers: NETWORK_HEADERS }}
                    style={styles.stickerThumb}
                  />
                  {item.interest ? (
                    <Text style={styles.stickerTagText} numberOfLines={1}>
                      {item.interest}
                    </Text>
                  ) : null}
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
  stickerContainer: {
    position: "absolute",
    width: 60,
    height: 60,
    top: 95,
    left: 95,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  selectedStickerBorder: {
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  stickerImage: {
    width: "100%",
    height: "100%",
  },
  layerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
  selectedControlsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  scaleBtn: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  scaleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  deleteBtn: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
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
  categoryTabsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: "#007AFF",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeCategoryTabText: {
    color: "#FFFFFF",
  },
  stickerCard: {
    width: 75,
    height: 80,
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    padding: 4,
  },
  stickerThumb: {
    width: 45,
    height: 45,
    resizeMode: "contain",
  },
  stickerTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#8E8E93",
    marginVertical: 10,
  },
});
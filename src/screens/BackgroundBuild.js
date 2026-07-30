import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
} from "react-native";

import { useRef, useState } from "react";

function DraggableSticker({ emoji, startX, startY }) {
  const position = useRef(
    new Animated.ValueXY({
      x: startX,
      y: startY,
    }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      // Allows the sticker to respond when touched.
      onStartShouldSetPanResponder: () => true,

      // Saves the sticker's current position before dragging.
      onPanResponderGrant: () => {
        position.extractOffset();
      },

      // Moves the sticker with the user's finger.
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: position.x,
            dy: position.y,
          },
        ],
        {
          useNativeDriver: false,
        },
      ),

      // Saves the sticker's new position.
      onPanResponderRelease: () => {
        position.flattenOffset();
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.sticker,
        {
          transform: position.getTranslateTransform(),
        },
      ]}
    >
      <Text style={styles.stickerEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function BackgroundBuild() {
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [stickers, setStickers] = useState([]);

  const stickerOptions = ["⭐", "❤️", "🌈", "🔥", "🦋", "🌸"];

  const addSticker = (emoji) => {
    const stickerNumber = stickers.length;

    const newSticker = {
      id: Date.now(),
      emoji: emoji,

      // Slightly changes the starting position of each sticker.
      startX: 40 + (stickerNumber % 4) * 45,
      startY: 100 + (stickerNumber % 5) * 40,
    };

    setStickers((currentStickers) => [
      ...currentStickers,
      newSticker,
    ]);

    setShowStickerMenu(false);
  };

  return (
    <View style={styles.container}>
      {/* Stickers placed on the background */}
      {stickers.map((sticker) => (
        <DraggableSticker
          key={sticker.id}
          emoji={sticker.emoji}
          startX={sticker.startX}
          startY={sticker.startY}
        />
      ))}

      {/* Sticker selection menu */}
      {showStickerMenu && (
        <View style={styles.stickerMenu}>
          {stickerOptions.map((emoji) => (
            <Pressable
              key={emoji}
              style={styles.stickerOption}
              onPress={() => addSticker(emoji)}
            >
              <Text style={styles.stickerOptionText}>
                {emoji}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Add sticker button */}
      <Pressable
        style={styles.addButton}
        onPress={() => {
          setShowStickerMenu((currentValue) => !currentValue);
        }}
      >
        <Text style={styles.addButtonText}>
          {showStickerMenu ? "Close" : "Add Sticker"}
        </Text>
      </Pressable>

      {/* Removes every sticker */}
      {stickers.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={() => setStickers([])}
        >
          <Text style={styles.clearButtonText}>
            Clear Stickers
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ADD8E6",
    position: "relative",
  },

  sticker: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },

  stickerEmoji: {
    fontSize: 55,
  },

  stickerMenu: {
    position: "absolute",
    bottom: 145,
    alignSelf: "center",
    width: 260,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  stickerOption: {
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
  },

  stickerOptionText: {
    fontSize: 38,
  },

  addButton: {
    position: "absolute",
    bottom: 75,
    alignSelf: "center",
    backgroundColor: "#841584",
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  clearButton: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
  },

  clearButtonText: {
    color: "#B00020",
    fontSize: 16,
    fontWeight: "600",
  },
});
import { StyleSheet } from "react-native";

// Shared by every settings section so the cards line up.
export const settingsStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Inset to where the label starts, past the icon.
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginHorizontal: 16,
  },
});

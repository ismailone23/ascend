import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

export default function Details() {
  const params = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: params.name as string }}
      />
      <ScrollView>
        <Text>Details</Text>
      </ScrollView>
    </>
  );
}

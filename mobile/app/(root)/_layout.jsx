import { useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";

const Tab = createBottomTabNavigator();

// Import screens
import HomeScreen from "./index";
import GroupScreen from "./group";

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null; // this is for a better ux

  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e0e0e0",
          // borderTopWidth: 1,
          paddingBottom: 8,
          // paddingTop: 8,
          height: 60,
        },
        tabBarLabel: ({ focused, color }) => {
          const labels = {
            index: "Home",
            group: "Groups",
          };
          return <Text style={{ color, fontSize: 12, marginTop: 4 }}>{labels[route.name]}</Text>;
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            index: "home",
            group: "people",
          };
          return <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="index" component={HomeScreen} />
      <Tab.Screen name="group" component={GroupScreen} />
    </Tab.Navigator>
  );
}
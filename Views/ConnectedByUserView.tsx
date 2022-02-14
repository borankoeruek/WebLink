import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { View, Linking, Platform, Keyboard } from "react-native";
import { Button, Text } from "react-native-elements";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import FirebaseDataProvider from "../helpers/FirebaseDataProvider";
import UpdatingConnectionClass from "../helpers/firebaseDocClasses/UpdatingConnectionClass";
interface Props {
  currentDeviceId: string;
  customStyles: any;
  updateAppState: (oby: {}) => void;
}

const ConnectedByUserView: React.FunctionComponent<Props> = (props: Props) => {
  const styles = props.customStyles;
  const firebase: FirebaseDataProvider = new FirebaseDataProvider();
  const [url, setUrl] = React.useState<string>("");
  let unsubscribeToRTLIfUrlChanges: () => void;

  React.useEffect(() => {
    listenForUrlChanges();
  }, []);

  const cancelConnectionToClientUser = (): void => {
    console.log("Cancel connection!");
    unsubscribeToRTLIfUrlChanges();

    const connectionObj = new UpdatingConnectionClass({
      URL: "",
      accepted: false,
      connectedDevice: "",
    });

    firebase.firebaseApp
      .firestore()
      .collection("Devices")
      .doc(props.currentDeviceId)
      .update({
        "connection.URL": connectionObj.connection.URL,
        "connection.accepted": connectionObj.connection.accepted,
        "connection.connectedDevice": connectionObj.connection.connectedDevice,
      });

    props.updateAppState({
      isConnectedByClient: false,
      hostDeviceId: "",
    });
  };

  const openURL = (URL: string): void => {
    if (URL.slice(0, "https://".length) !== "https://" || URL === null) {
      console.log("URL doesnt start with https://");
      return;
    }

    Linking.openURL(URL);
  };

  // TODO: listenIfClientUserChangesConnectionAnswer

  const listenForUrlChanges = (): void => {
    unsubscribeToRTLIfUrlChanges = firebase.firebaseApp
      .firestore()
      .collection("Devices")
      .doc(props.currentDeviceId)
      .onSnapshot((doc) => {
        if (doc.data()?.connection.URL === "") return;

        const providedUrl: string = doc.data()?.connection.URL;

        if (providedUrl === url || !doc.exists) {
          console.log(
            "url doesnt changed or doc doesnt exists anymore",
            doc.data()
          );

          return;
        }

        setUrl(providedUrl);

        if (Platform.OS === "web") return;

        openURL(providedUrl);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 40, marginBottom: 20, color: "green" }}>
        {"Connected by a User"}
      </Text>
      <Text style={{ fontSize: 40, marginBottom: 20 }}>
        {"Waiting for URL changes..."}
      </Text>
      {Platform.OS === "web" ? (
        <Button
          disabled={url === "" || url === null}
          style={{ marginBottom: 20 }}
          title={"Open Url"}
          onPress={() => openURL(url)}
        />
      ) : null}

      <Button
        title={"Cancel Connection"}
        onPress={cancelConnectionToClientUser}
      />
      <StatusBar style="auto" />
    </View>
  );
};

export default ConnectedByUserView;

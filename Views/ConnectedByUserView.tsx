import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { View, Linking, Platform } from "react-native";
import { Button, Text } from "react-native-elements";
import FirebaseDataProvider from "../helpers/FirebaseDataProvider";
import UpdatingConnectionClass from "../helpers/firebaseDocClasses/UpdatingConnectionClass";
interface Props {
  currentDeviceId: string;
  customStyles: any;
  updateAppState: ({}) => void;
}

const ConnectedByUserView: React.FunctionComponent<Props> = (props: Props) => {
  const styles = props.customStyles;
  const firebase: FirebaseDataProvider = new FirebaseDataProvider();
  const [url, setUrl] = React.useState<string>("");
  let unsubscribeToRTLIfUrlChanges: () => void;

  React.useEffect(() => {
    listenForUrlChanges();
  }, []);

  const cancelConnectionToClientUser = async (): Promise<void> => {
    console.log("Cancel connection!");
    unsubscribeToRTLIfUrlChanges();

    await firebase.updateDeviceDoc(
      props.currentDeviceId,
      new UpdatingConnectionClass({
        "connection.URL": "",
        "connection.accepted": false,
        "connection.connectedDevice": "",
      })
    );

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

  // TODO: listenIfClientUserCancelsConnection

  const listenForUrlChanges = async (): Promise<void> => {
    unsubscribeToRTLIfUrlChanges = await firebase.getDeviceDocRealtimeUpdates(
      props.currentDeviceId,
      (doc: any) => {
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
      }
    );
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

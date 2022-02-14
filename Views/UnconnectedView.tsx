import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Keyboard, View, TouchableWithoutFeedback, Alert } from "react-native";
import { Button, Text, Input, Overlay } from "react-native-elements";
import FirebaseDataProvider from "../helpers/FirebaseDataProvider";
import { Platform } from "react-native";

interface Props {
  currentDeviceId: string;
  customStyles: any;
  updateAppState: (oby: {}) => void;
}

const UnconnectedView: React.FunctionComponent<Props> = (props: Props) => {
  const styles = props.customStyles;
  const firebase: FirebaseDataProvider = new FirebaseDataProvider();
  const [connectToUserDeviceID, setConnectToUserDeviceID] = React.useState("");
  const [shouldShowWebOverlay, setShouldShowWebOverlay] = React.useState(false);
  let hostDeviceId: string;
  let unsubscribeRTListenerIfUserSendsConnectionRequest: () => void;

  React.useEffect(() => {
    listenForNewClientConnectionRequests();
  }, []);

  const connectToUser = async (): Promise<void> => {
    const id: string = connectToUserDeviceID;

    if (props.currentDeviceId == id) {
      console.log("Can't connect to your self!");

      return;
    }

    const docRef = firebase.firebaseApp
      .firestore()
      .collection("Devices")
      .doc(id);

    const req = await docRef.get();

    if (!req.exists) {
      console.log("Document doesnt exists! Wrong ID");

      return;
    }

    if (req.data()?.connection.connectedDevice !== "") {
      console.log("Connection is already connected with an other device!");

      return;
    }

    docRef.update({
      "connection.connectedDevice":
        firebase.firebaseApp.auth().currentUser?.uid,
    });

    props.updateAppState({ isConnectedToHost: true, hostDeviceId: id });
  };

  const listenForNewClientConnectionRequests = (): void => {
    unsubscribeRTListenerIfUserSendsConnectionRequest = firebase.firebaseApp
      .firestore()
      .collection("Devices")
      .doc(props.currentDeviceId)
      .onSnapshot((doc) => {
        if (!doc.exists) {
          console.log(
            "Its undefined! (doc not found). This should never happen",
            doc
          );

          return;
        }

        if (hostDeviceId === doc.data()?.connection.connectedDevice) return;

        hostDeviceId = doc.data()?.connection.connectedDevice;

        if (doc.data()?.connection.connectedDevice === "") return;

        askUserIfConnectionShouldBeAccepted();
      });
  };

  const askUserIfConnectionShouldBeAccepted = (): void => {
    // TODO: If accepted =>  unsubscribe realtimelistener unsubscribeRTListenerIfUserSendsConnectionRequest()
    console.log("Asking user if he wants to accept this connection..");

    if (Platform.OS === "web") {
      setShouldShowWebOverlay(true);
      return;
    }

    Alert.alert("New Nonnection Request.", "Do you want to accept?", [
      {
        text: "Decline",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "Accept",
        onPress: () => {
          unsubscribeRTListenerIfUserSendsConnectionRequest();
          answerToUserConnectionRequest(hostDeviceId, true);
        },
      },
    ]);
  };

  const answerToUserConnectionRequest = (
    hostDeviceId: string,
    shouldAccept: boolean
  ): void => {
    if (shouldAccept) {
      firebase.firebaseApp
        .firestore()
        .collection("Devices")
        .doc(props.currentDeviceId)
        .update({
          "connection.accepted": shouldAccept,
          "connection.connctedDevice": "",
        });

      props.updateAppState({
        isConnectedByClient: shouldAccept,
        hostDeviceId: hostDeviceId,
      });

      return;
    }

    firebase.firebaseApp
      .firestore()
      .collection("Devices")
      .doc(props.currentDeviceId)
      .update({
        "connection.connectedDevice": "",
      });
  };

  const showWebOverlay = (): JSX.Element => {
    const toggleWebOverlay = (): void => {
      setShouldShowWebOverlay(!shouldShowWebOverlay);
    };

    return (
      <Overlay
        style={{ padding: 10 }}
        isVisible={shouldShowWebOverlay}
        onBackdropPress={toggleWebOverlay}
      >
        <Text style={{ fontSize: 20, marginBottom: 20 }}>
          New Nonnection Request
        </Text>
        {/* <Text style={{ fontSize: 20, marginBottom: 20 }}>
          Do you want to accept?
        </Text> */}
        <Button
          style={{ marginBottom: 20 }}
          title="Decline"
          onPress={() => {
            //unsubscribeRTListenerIfUserSendsConnectionRequest();
            toggleWebOverlay();
            answerToUserConnectionRequest(hostDeviceId, false);
          }}
        />
        <Button
          title="Accept"
          onPress={() => {
            //unsubscribeRTListenerIfUserSendsConnectionRequest();
            toggleWebOverlay();
            answerToUserConnectionRequest(hostDeviceId, true);
          }}
        />
      </Overlay>
    );
  };

  const showModifiedDeviceId = (id: string): string => {
    let modifiedDeviceId = `${id.slice(0, 3)} ${id.slice(3, 6)}`;

    return modifiedDeviceId;
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => (Platform.OS === "web" ? null : Keyboard.dismiss())}
    >
      <View style={styles.container}>
        {shouldShowWebOverlay ? showWebOverlay() : null}
        <Text style={{ fontSize: 40, marginBottom: 20 }}>{"Your ID"}</Text>
        <Text style={{ fontSize: 40, marginBottom: 20 }}>
          {showModifiedDeviceId(props.currentDeviceId)}
        </Text>
        <Input
          onChangeText={setConnectToUserDeviceID}
          style={styles.input}
          inputContainerStyle={styles.inputContainer}
          maxLength={6}
          keyboardType="numeric"
          placeholder={"Device ID"}
          autoCompleteType={"off"}
        />

        <Button title={"Connect to device"} onPress={() => connectToUser()} />
        <StatusBar style="auto" />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default UnconnectedView;

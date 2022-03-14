import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Keyboard, View, TouchableWithoutFeedback, Alert } from "react-native";
import { Button, Text, Input, Overlay } from "react-native-elements";
import FirebaseDataProvider from "../helpers/FirebaseDataProvider";
import { Platform } from "react-native";
import UpdatingConnectionClass from "../helpers/firebaseDocClasses/UpdatingConnectionClass";

interface Props {
  currentDeviceId: string;
  customStyles: any;
  updateAppState: ({}) => void;
}

const UnconnectedView: React.FunctionComponent<Props> = (props: Props) => {
  const styles = props.customStyles;
  const firebase: FirebaseDataProvider = new FirebaseDataProvider();
  const [connectToUserDeviceID, setConnectToUserDeviceID] = React.useState("");
  const [shouldShowWebOverlay, setShouldShowWebOverlay] = React.useState(false);
  let hostDeviceId: string;
  let unsubscribeConnectionRequestListener: () => void;

  React.useEffect(() => {
    listenForNewClientConnectionRequests();
  }, []);

  const connectToUser = async (): Promise<void> => {
    const id: string = connectToUserDeviceID;

    if (props.currentDeviceId == id) {
      console.log("Can't connect to your self!");

      return;
    }

    const response = await firebase.getDeviceDoc(id);

    if (!response.exists) {
      console.log("Document doesnt exists! Wrong ID");

      return;
    }

    if (response.data()?.connection.connectedDevice !== "") {
      console.log("Connection is already connected with an other device!");

      return;
    }

    firebase.updateDeviceDoc(
      id,
      new UpdatingConnectionClass({
        "connection.connectedDevice":
          firebase.firebaseApp.auth().currentUser?.uid,
      })
    );

    props.updateAppState({ isConnectedToHost: true, hostDeviceId: id });
  };

  const listenForNewClientConnectionRequests = async (): Promise<void> => {
    unsubscribeConnectionRequestListener =
      await firebase.getDeviceDocRealtimeUpdates(
        props.currentDeviceId,
        (doc: any) => {
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
        }
      );
  };

  const askUserIfConnectionShouldBeAccepted = (): void => {
    // TODO: If accepted =>  unsubscribe realtimelistener unsubscribeConnectionRequestListener()
    console.log("Asking user if he wants to accept this connection..");

    if (Platform.OS === "web") {
      setShouldShowWebOverlay(true);
      return;
    }

    Alert.alert("New Connection Request.", "Do you want to accept?", [
      {
        text: "Decline",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "Accept",
        onPress: () => {
          unsubscribeConnectionRequestListener();
          answerToUserConnectionRequest(hostDeviceId, true);
        },
      },
    ]);
  };

  const answerToUserConnectionRequest = async (
    hostDeviceId: string,
    shouldAccept: boolean
  ): Promise<void> => {
    if (shouldAccept) {
      await firebase.updateDeviceDoc(
        props.currentDeviceId,
        new UpdatingConnectionClass({
          "connection.accepted": shouldAccept,
          "connection.connectedDevice": "",
        })
      );

      props.updateAppState({
        isConnectedByClient: shouldAccept,
        hostDeviceId: hostDeviceId,
      });

      return;
    }

    await firebase.updateDeviceDoc(
      props.currentDeviceId,
      new UpdatingConnectionClass({
        "connection.connectedDevice": "",
      })
    );
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
          New Connection Request
        </Text>

        <Button
          style={{ marginBottom: 20 }}
          title="Decline"
          onPress={() => {
            //unsubscribeConnectionRequestListener();
            toggleWebOverlay();
            answerToUserConnectionRequest(hostDeviceId, false);
          }}
        />
        <Button
          title="Accept"
          onPress={() => {
            //unsubscribeConnectionRequestListener();
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

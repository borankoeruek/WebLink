import { StatusBar } from "expo-status-bar";
import * as React from "react";

import {
  Keyboard,
  View,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Button, Text, Input } from "react-native-elements";
import FirebaseDataProvider from "../helpers/FirebaseDataProvider";
import UpdatingConnectionClass from "../helpers/firebaseDocClasses/UpdatingConnectionClass";
import ConnectionClass from "../helpers/firebaseDocClasses/ConnectionClass";

interface Props {
  hostDeviceId: string;
  customStyles: any;
  updateAppState: (oby: {}) => void;
}

const ConnectedToUserView: React.FunctionComponent<Props> = (props: Props) => {
  const styles = props.customStyles;
  const firebase: FirebaseDataProvider = new FirebaseDataProvider();
  const [connectToDeviceAccepted, setConnectToDeviceAccepted] =
    React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    listenIfHostingUserChangesConnectionAnswer();
  }, []);

  const cancelConnectionToHostUser = (): void => {
    firebase
      .updateDeviceDoc(
        props.hostDeviceId,
        new UpdatingConnectionClass({
          "connection.URL": "",
          "connection.accepted": false,

          "connection.connectedDevice": "",
        })
      )
      .then(() => {
        props.updateAppState({
          isConnectedToHost: false,
          hostDeviceId: "",
        });
      })
      .catch((error) => {
        console.log(
          "Something went wrong while trying to cancel connection",
          error
        );
      });
  };

  const listenIfHostingUserChangesConnectionAnswer = (): void => {
    firebase.getDeviceDocRealtimeUpdates(props.hostDeviceId, (doc: any) => {
      if (
        !doc.exists ||
        doc.data()?.connection.connectedDevice !==
          firebase.firebaseApp.auth().currentUser?.uid
      ) {
        // connection request got declined or doc doesnt even exists anymore
        props.updateAppState({
          isConnectedToHost: false,
          hostDeviceId: "",
        });
      }

      if (doc.data()?.connection.accepted) {
        setConnectToDeviceAccepted(true);
      }
    });
  };

  const openUrlOnHostingDevice = () => {
    firebase.updateDeviceDoc(
      props.hostDeviceId,
      new UpdatingConnectionClass({
        "connection.URL": url,
      })
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
        <Text
          style={{
            fontSize: 40,
            marginBottom: 20,
            color: connectToDeviceAccepted ? "green" : "",
          }}
        >
          {connectToDeviceAccepted ? "Connected to" : "Waiting for accept.."}
        </Text>
        <Text style={{ fontSize: 40, marginBottom: 20 }}>
          {showModifiedDeviceId(props.hostDeviceId)}
        </Text>
        <Input
          disabled={!connectToDeviceAccepted}
          style={styles.input}
          inputContainerStyle={styles.inputContainer}
          keyboardType="numeric"
          placeholder={"URL"}
          autoCompleteType={"off"}
          onChangeText={setUrl}
        />

        <Button
          style={{ marginBottom: 20 }}
          title={"Open URL on device"}
          disabled={!connectToDeviceAccepted}
          onPress={openUrlOnHostingDevice}
        />
        <Button
          title={"Cancel connection"}
          disabled={!connectToDeviceAccepted}
          onPress={() => cancelConnectionToHostUser()}
        />
        <StatusBar style="auto" />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ConnectedToUserView;

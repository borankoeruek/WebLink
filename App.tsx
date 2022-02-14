import React, { Component } from "react";
import ConnectedToUserView from "./Views/ConnectedToUserView";
import UnconnectedView from "./Views/UnconnectedView";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import FirebaseDataProvider from "./helpers/FirebaseDataProvider";
import ConnectionClass from "./helpers/firebaseDocClasses/ConnectionClass";
import { serverTimestamp } from "firebase/firestore";
import ConnectedByUserView from "./Views/ConnectedByUserView";

interface IProps {}

interface IState {
  currentDeviceId: string;
  isConnectedToHost: boolean;
  isConnectedByClient: boolean;
  hostDeviceId: string;
  isEverythingLoaded: boolean;
}

class App extends Component<IProps, IState> {
  styles: any;
  firebase: FirebaseDataProvider;

  constructor(props: IProps) {
    super(props);
    this.state = {
      currentDeviceId: "",
      isConnectedToHost: false,
      isConnectedByClient: false,
      hostDeviceId: "",
      isEverythingLoaded: false,
    };

    this.styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      },
      inputContainer: {
        maxWidth: "80%",
        alignSelf: "center",
      },
      input: { textAlign: "center" },
      button: {
        backgroundColor: "#00aeef",
      },
    });

    this.firebase = new FirebaseDataProvider();
  }

  makeUserHostingAvailableFlow = (): void => {
    this.firebase.firebaseApp
      .auth()
      .signInAnonymously()
      .then((user: any) => {
        // signed in
        // create random number and create doc so other users can connect to this device

        console.log(user.user?.uid);
        createConnectionDoc(user.user?.uid);
      })
      .catch((error: any) => {
        // error
        console.log("Error while trying to sign in..", error);
      });

    const createConnectionDoc = (uid: string) => {
      const ID: string = Math.floor(Math.random() * 900000 + 100000).toString();

      // TODO: Check if this ID is already used. If not continue. Else create new ID

      const connection = new ConnectionClass(
        { URL: "", accepted: false, connectedDevice: "" },
        serverTimestamp(),
        uid
      );

      this.firebase.firebaseApp
        .firestore()
        .collection("Devices")
        .doc(ID)
        .set(Object.assign({}, connection))
        .then(() => {
          this.setState({
            currentDeviceId: ID,
            isEverythingLoaded: true,
          });
        });
    };
  };

  componentDidMount = () => {
    this.makeUserHostingAvailableFlow();
  };

  updateAppState = (obj: {}) => {
    this.setState(obj);
  };

  render = (): JSX.Element => {
    if (!this.state.isEverythingLoaded) {
      return <></>;
    }

    const loadView = () => {
      if (this.state.isConnectedToHost) {
        return (
          <ConnectedToUserView
            customStyles={this.styles}
            hostDeviceId={this.state.hostDeviceId}
            updateAppState={this.updateAppState}
          ></ConnectedToUserView>
        );
      }

      if (this.state.isConnectedByClient) {
        return (
          <ConnectedByUserView
            customStyles={this.styles}
            currentDeviceId={this.state.currentDeviceId}
            updateAppState={this.updateAppState}
          ></ConnectedByUserView>
        );
      }

      return (
        <UnconnectedView
          customStyles={this.styles}
          currentDeviceId={this.state.currentDeviceId}
          updateAppState={this.updateAppState}
        ></UnconnectedView>
      );
    };

    return <SafeAreaProvider>{loadView()}</SafeAreaProvider>;
  };
}

export default App;

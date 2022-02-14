// v9 compat packages are API compatible with v8 code
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

class FirebaseDataProvider {
  constructor() {
    if (!firebase.apps.length) {
      this.firebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyBrA4DibB_vgxYlGefl04g4Bh6Ao-pSTEM",
        authDomain: "tvlink-2k.firebaseapp.com",
        projectId: "tvlink-2k",
        storageBucket: "tvlink-2k.appspot.com",
        messagingSenderId: "280207818657",
        appId: "1:280207818657:web:ce32a61dc9c941145155e0",
        measurementId: "G-DB3M2ZFVYQ",
      });
    } else {
      this.firebaseApp = firebase.app();
    }
  }
}

export default FirebaseDataProvider;

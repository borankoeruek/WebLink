import { FieldValue } from "firebase/firestore";

interface connectionInterface {
  URL: string;
  accepted: boolean;
  connectedDevice: string;
}

class ConnectionClass {
  connection: connectionInterface;
  created: FieldValue;
  userId: string;

  constructor(
    connection: connectionInterface,
    created: FieldValue,
    userId: string
  ) {
    this.connection = connection;
    this.created = created;
    this.userId = userId;
  }
}

export default ConnectionClass;

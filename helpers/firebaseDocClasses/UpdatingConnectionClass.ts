interface connectionInterface {
  "connection.URL"?: string;
  "connection.accepted"?: boolean;
  "connection.connectedDevice"?: string;
}

class UpdatingConnectionClass {
  connection: connectionInterface;

  constructor(connection: connectionInterface) {
    this.connection = connection;
  }
}

export default UpdatingConnectionClass;

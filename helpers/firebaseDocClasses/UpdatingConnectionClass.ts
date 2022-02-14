interface connectionInterface {
  URL: string;
  accepted: boolean;
  connectedDevice: string;
}

class UpdatingConnectionClass {
  connection: connectionInterface;

  constructor(connection: connectionInterface) {
    this.connection = connection;
  }
}

export default UpdatingConnectionClass;

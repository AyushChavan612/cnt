const dgram = require("dgram");
const server = dgram.createSocket("udp4");

const PORT = 4000;
const HOST = "localhost";

// When server starts
server.on("listening", () => {
  const address = server.address();
  console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

// When server receives a message
server.on("message", (msg, rinfo) => {
  const message = msg.toString();
  console.log(`Received: ${message} from ${rinfo.address}:${rinfo.port}`);

  if (message.startsWith("MSG:")) {
    // Case 1: Normal message
    const response = `Server received your message: "${message.substring(4)}"`;
    server.send(response, rinfo.port, rinfo.address);
  } else if (message.startsWith("TRIG:")) {
    // Case 2: Trigonometry calculation
    const parts = message.split(":");
    const op = parts[1];
    const valueInDegrees = parseFloat(parts[2]);

    // Convert degrees to radians for Math functions
    const valueInRadians = valueInDegrees * (Math.PI / 180);

    let result;
    switch (op) {
      case "sin":
        result = Math.sin(valueInRadians);
        break;
      case "cos":
        result = Math.cos(valueInRadians);
        break;
      case "tan":
        result = Math.tan(valueInRadians);
        break;
      default:
        result = "Invalid operation";
        break;
    }

    const response = `Result of ${op}(${valueInDegrees}°) = ${result}`;
    server.send(response, rinfo.port, rinfo.address);
  }
});

// Bind server to port/host
server.bind(PORT, HOST);

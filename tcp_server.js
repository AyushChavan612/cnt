const net = require("net");
const fs = require("fs");
const path = require("path");

// Folder where uploaded files will be stored
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ---------------------
// Create TCP Server
// ---------------------
const server = net.createServer((socket) => {
  console.log("Client connected");

  let fileStream = null;
  let expectedFileSize = 0;
  let receivedSize = 0;
  let receivingFile = false;
  let headerData = Buffer.alloc(0);
  let isHeaderReceived = false;

  // When data arrives from client
  socket.on("data", (data) => {
    if (!receivingFile) {
      // Buffer initial data to parse the header
      headerData = Buffer.concat([headerData, data]);
      const headerEndIndex = headerData.indexOf("\n");

      if (headerEndIndex !== -1) {
        const header = headerData.toString("utf8", 0, headerEndIndex);
        const body = headerData.slice(headerEndIndex + 1);

        if (header.startsWith("MSG:")) {
          // Handle text messages
          const msg = header.substring(4);
          console.log(`Message from client: ${msg}`);
          headerData = Buffer.alloc(0); // Reset for next message
        } else if (header.startsWith("FILE:")) {
          // Handle file transfer request
          const parts = header.split(":");
          if (parts.length === 3) {
            // Sanitize filename to prevent path traversal attacks
            const filename = path.basename(parts[1]);
            expectedFileSize = parseInt(parts[2]);

            if (isNaN(expectedFileSize)) {
              console.error("Invalid file size in header.");
              socket.end("ERROR: Invalid file size.\n");
              return;
            }

            console.log(
              `Receiving file: ${filename} (${expectedFileSize} bytes)`
            );
            const filePath = path.join(uploadDir, filename);
            fileStream = fs.createWriteStream(filePath);

            fileStream.on("error", (err) => {
              console.error("File stream error:", err);
              socket.end("ERROR: Could not save file.\n");
            });

            receivingFile = true;

            // Write the part of the data that came after the header
            if (body.length > 0) {
              fileStream.write(body);
              receivedSize += body.length;
            }
          }
        }
      }
    } else {
      // Receiving file chunks
      fileStream.write(data);
      receivedSize += data.length;

      if (receivedSize >= expectedFileSize) {
        fileStream.end(() => {
          console.log("File saved successfully!");
          socket.write("SUCCESS: File uploaded.\n");
          receivingFile = false;
          fileStream = null;
        });
      }
    }
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
    if (fileStream) {
      fileStream.end();
    }
  });

  // When client disconnects
  socket.on("end", () => {
    console.log("Client disconnected");
    if (fileStream) {
      fileStream.end();
      console.log("File stream closed due to client disconnection.");
    }
  });
});

// Start server
server.listen(4000, () => {
  console.log("Server listening on port 4000");
});

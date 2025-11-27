const net = require("net");
const fs = require("fs");
const readline = require("readline");

// CLI input setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Connect to server
const client = net.createConnection({ port: 4000 }, () => {
  console.log("Connected to server");
  showMenu();
});

// Handle data from the server (e.g., success/error messages)
client.on("data", (data) => {
  console.log(`\n<-- Server: ${data.toString().trim()}`);
});

client.on("end", () => {
  console.log("Disconnected from server");
  rl.close();
});

client.on("error", (err) => {
  console.error("Connection error:", err.message);
  rl.close();
});

// ---------------------
// Function to show menu
// ---------------------
function showMenu() {
  console.log("\nChoose an option:");
  console.log("1. Send a message");
  console.log("2. Send a file");
  console.log("3. Exit");

  rl.question("Enter your choice: ", (choice) => {
    if (choice === "1") {
      // Send a message
      rl.question("Enter your message: ", (msg) => {
        client.write(`MSG:${msg}\n`); // Added \n
        showMenu();
      });
    } else if (choice === "2") {
      // Send a file
      rl.question("Enter file path: ", (filepath) => {
        const filename = filepath.trim();
        if (!fs.existsSync(filename)) {
          console.log("Error: File not found.");
          showMenu();
          return;
        }

        const stats = fs.statSync(filename);
        const filesize = stats.size;

        // Notify server about file, sending only the base name
        client.write(
          `FILE:${require("path").basename(filename)}:${filesize}\n`
        ); // Added \n

        // Send file content
        const fileStream = fs.createReadStream(filename);

        fileStream.on("data", (chunk) => {
          client.write(chunk);
        });

        fileStream.on("end", () => {
          console.log("--> File sent completely.");
          // Wait for server confirmation before showing menu again
          // The server will send a SUCCESS message which will be caught by the client.on('data') event
          showMenu();
        });

        fileStream.on("error", (err) => {
          console.error("Error reading file:", err.message);
          showMenu();
        });
      });
    } else if (choice === "3") {
      // Exit
      console.log("👋 Exiting...");
      client.end();
    } else {
      console.log("Invalid choice. Please try again.");
      showMenu();
    }
  });
}

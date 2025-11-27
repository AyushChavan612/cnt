const dgram = require("dgram");
const readline = require("readline");

const client = dgram.createSocket("udp4");
const PORT = 4000;
const HOST = "localhost";

// CLI input interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Show Menu
function showMenu() {
  console.log("\nChoose an option:");
  console.log("1. Send a message");
  console.log("2. Trigonometry calculator (sin, cos, tan)");
  console.log("3. Exit");

  rl.question("Enter your choice: ", (choice) => {
    if (choice === "1") {
      rl.question("Enter your message: ", (msg) => {
        client.send(`MSG:${msg}`, PORT, HOST, (err) => {
          if (err) console.error(err);
        });
        showMenu();
      });
    } else if (choice === "2") {
      rl.question("Enter operation (sin/cos/tan): ", (op) => {
        rl.question("Enter value (in degrees): ", (val) => {
          client.send(`TRIG:${op}:${val}`, PORT, HOST, (err) => {
            if (err) console.error(err);
          });
          showMenu();
        });
      });
    } else if (choice === "3") {
      console.log("Exiting...");
      client.close();
      rl.close();
    } else {
      console.log("Invalid choice");
      showMenu();
    }
  });
}

// Listen for server response
client.on("message", (msg, rinfo) => {
  console.log(`\nServer reply: ${msg.toString()}`);
});

// Start program
showMenu();

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
const connectionSql = require("./db");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};

wss.on("connection", function connection(ws, req) {
  const parameters = url.parse(req.url, true);
  const token = parameters.query.token;

  if (!token) {
    console.log("Token is missing");
    ws.close(4001, "Token is missing");
    return;
  }

  clients[token] = ws;
  console.log("Client connected with token:", token);

  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);

    if (data.timestamp) {
      const date = new Date(data.timestamp);
      const mysqlTimestamp = date.toISOString().slice(0, 19).replace("T", " ");

      const query =
        "INSERT INTO Interacts (userId, postId, timestamp, type) VALUES (?, ?, ?, ?)";
      connectionSql.query(
        query,
        [token, data.postId, mysqlTimestamp, data.type],
        (error, results, fields) => {
          if (error) {
            console.log(error);
          }
        }
      );
    } else {
      if (token !== data.userId) {
        const query =
          "INSERT INTO Notifications (senderId, receivedId, message, seen) VALUES (?, ?, ?, false)";
        connectionSql.query(
          query,
          [token, data.userId, data.message, false],
          (error, results, fields) => {
            if (error) {
              console.error(
                "Error inserting message into database:",
                error.stack
              );
            } else {
              sendNotification(data.userId, { message: data.message });
            }
          }
        );
      }
    }
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
    delete clients[token];
  });
});

function sendNotification(token, message) {
  const client = clients[token];
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  } else {
    console.error(`WebSocket is not open for token ${token}`);
  }
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

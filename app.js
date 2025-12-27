function startServer() {
  const express = require('express');
  const path = require("path");

  const app = express();
  const PORT = 3000;

  const serverCredentialsRoutes = require("./routes/serverCredentials");
  const serverDeviceManagerRoutes = require("./routes/serverDeviceManager");

  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json());


  app.use("/api", serverCredentialsRoutes);
  app.use("/api", serverDeviceManagerRoutes);

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`[Server] Server started on port ${PORT}`);
  });

}

// If this file is run with npm start, start the server
if (require.main === module){
  startServer();
}

module.exports = startServer;

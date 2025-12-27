const path = require('path');
const fs = require('fs');

function getFilePath(filename) {
  if (!process.versions.electron) {
    console.log(path.join(__dirname, '..', filename));
    return path.join(__dirname, '..', filename);
  }

  const { app } = require('electron');

  if (!app.isReady()) {
    throw new Error('Electron app not ready yet');
  }

  return app.isPackaged
    ? path.join(app.getPath('userData'), filename)
    : path.join(__dirname, '..', filename);
}

function loadCredentials() {
    try {
        //console.log("path : " + getFilePath('credentials.json'));
        let credentials = JSON.parse(fs.readFileSync(getFilePath('credentials.json'), "utf8"));
        //console.log("credentials : " + credentials);
        return credentials;
    } catch {
        console.log("[Server - GRPC] Errors loading credentials.json from loadCredentials() in apiGrpcChirpstack.js");
    }
}

//console.log(getFilePath('credentials.json'));
module.exports = { getFilePath, loadCredentials };
const path = require('path');
const fs = require('fs');
const { app, dialog, shell } = require('electron');
const axios = require('axios');
//const { start } = require('repl');



function getFilePath(filename) {
  if (!process.versions.electron) {
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
        let credentials = JSON.parse(fs.readFileSync(getFilePath('credentials.json'), "utf8"));
        return credentials;
    } catch {
        console.log("[Server - GRPC] Errors loading credentials.json from loadCredentials() in apiGrpcChirpstack.js");
    }
}

async function checkForUpdates(startupCheck) {
  const currentVersion = app.getVersion();

  try {
    const response = await axios.get(
      'https://api.github.com/repos/SylvainMontagny/chirpstack-device-manager/releases/latest',
      {
        headers: {
          'User-Agent': 'Electron-App'
        },
        timeout: 5000
      }
    );

    const latestVersion = response.data.tag_name.replace(/^v/, '');

    if (latestVersion !== currentVersion) {
      const result = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Open releases page', 'Later'],
        defaultId: 0,
        message: 'New version available',
        detail: `Current version: ${currentVersion}\nLatest version: ${latestVersion}`
      });

      if (result.response === 0) {
        await shell.openExternal(response.data.html_url);
      }
    } else {
      if(!startupCheck) {
      await dialog.showMessageBox({
        type: 'info',
        message: 'You are up to date',
        detail: `Version ${currentVersion}`
      });
    }
    }

  } catch (err) {
    await dialog.showMessageBox({
      type: 'error',
      message: 'Update check failed',
      detail: err.response
        ? `GitHub API error: ${err.response.status}`
        : err.message
    });
  }
}



module.exports = { getFilePath, loadCredentials, checkForUpdates };
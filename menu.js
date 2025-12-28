
const { shell, BrowserWindow, app } = require('electron');
const { checkForUpdates } = require('./utils/utils.js');

const menu = [
  {
    label: 'File',
    role: 'fileMenu',
    submenu: [
      {
        label: 'Exit',
        click: () => {
          app.quit(); // Ferme complètement l'application
        }
      }
    ]
  },
  {
    label: 'View',
    role: 'viewMenu',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools(); // Ouvre/ferme DevTools
          }
        }
      }
    ]
  },
  {
    label: 'Help',
    role: 'helpMenu',
    submenu: [
      {
        label: 'Documentation (Readme)',
        click: async () => {
          await shell.openExternal(
            'https://github.com/SylvainMontagny/chirpstack-device-manager/blob/main/Readme.md'
          );
        }
      },
      {
        label: 'CSV Import Template',
        click: async () => {
          await shell.openExternal(
            'https://github.com/SylvainMontagny/chirpstack-device-manager/blob/main/import-sample.csv'
          );
        }
      },
      { type: 'separator' },
      {
        label: 'Check for updates…',
        click: () => {
          checkForUpdates();
        }
      }
    ]
  }

];

module.exports = menu;

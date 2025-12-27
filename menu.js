
const { shell, BrowserWindow, app } = require('electron');

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
        label: 'Documentation (README)',
        click: async () => {
          await shell.openExternal('https://github.com/SylvainMontagny/iot-platform-webApp/blob/main/README.md');
        }
      },
      {
        label: 'Csv Import Template',
        click: async () => {
          await shell.openExternal('https://github.com/SylvainMontagny/iot-platform-webApp/blob/main/template.csv');
        }
      }
    ]
  }
];

module.exports = menu;

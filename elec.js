const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const  startServer  = require('./app.js');
const menu = require('./menu.js');

let mainWindow;
const PORT = 3000;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.show();

  const appMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(appMenu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();
  setTimeout(() => createWindow(), 1000);
});


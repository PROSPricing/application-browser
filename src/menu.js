/*
 * This file is part of PROS Application Browser, a flash enabled
 * browser restricted to preconfigured servers.
 * Copyright (C) 2018 PROS, Inc.
 *
 * PROS Application Browser is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PROS Application Browser is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PROS Application Browser.  If not, see http://www.gnu.org/licenses/
 * You can contact PROS, Inc. with any questions at http://www.pros.com
 */
const { app, BrowserWindow, dialog } = require('electron');
const i18n = require('./i18n.js');
const path = require('path');
const url = require('url');

// A list of all the open windows opened
const allWindows = {};

// An index param used to create unique identifiers for each window
let windowCount = 0;

// A method used to generate unique window names
const getNewWindowName = () => {
  windowCount += 1;
  return `window-${windowCount}`;
};

/**
 * Registers a window with the application
 */
const addWindow = (windowName, win) => {
  allWindows[windowName] = win;
  win.on('closed', () => {
    // Dereference the window object.
    // When all windows are dereferenced, the app will close
    allWindows[windowName] = null;
    delete allWindows[windowName];
    // if (Object.keys(allWindows).length === 0) {
    //   app.exit();
    // }
  });
};

/**
 * About window
 */
const newAboutWindow = mainConsole => {
  const win = new BrowserWindow({
    minWidth: 640,
    minHeight: 480,
    width: 750,
    height: 480,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.setMenu(null);

  win.once('ready-to-show', () => {
    mainConsole.log('ready to show about...');
    win.show();
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'about.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );

  return win;
};

/**
 * Set the path to the config file based on platform
 */
const createMenu = ({ newTopWindow, mainConsole, mainWindow }) => {
  const debugMode = app.globalContext.config.develop || false;

  return [
    {
      label: i18n.getMessage('Menu.AppName', 'Home'),
      submenu: [
        {
          label: i18n.getMessage('Menu.NewWindow', 'New Window'),
          click() {
            const newWinName = getNewWindowName();
            addWindow(newWinName, newTopWindow(newWinName));
          },
        },
        { type: 'separator' },
        {
          label: i18n.getMessage('Menu.ClearBrowsingData', 'Clear Browsing Data'),
          click() {
            mainWindow.webContents.session.clearCache(() => {
              dialog.showMessageBox(mainWindow, {
                message: i18n.getMessage(
                  'Menu.ClearBrowsingComplete',
                  'Clearing browser data is complete.',
                ),
              });
            });
          },
        },
        {
          label: i18n.getMessage('Menu.Relaunch', 'Relaunch'),
          click() {
            app.relaunch();
            app.quit();
          },
        },
        { label: i18n.getMessage('Menu.Quit', 'Quit'), role: 'quit' },
      ],
    },

    {
      label: i18n.getMessage('Menu.Edit', 'Edit'),
      submenu: [
        { label: i18n.getMessage('Menu.Undo', 'Undo'), role: 'undo' },
        { label: i18n.getMessage('Menu.Redo', 'Redo'), role: 'redo' },
        { type: 'separator' },
        { label: i18n.getMessage('Menu.Cut', 'Cut'), role: 'cut' },
        { label: i18n.getMessage('Menu.Copy', 'Copy'), role: 'copy' },
        { label: i18n.getMessage('Menu.PasteMatchStyle', 'Paste'), role: 'pasteandmatchstyle' },
        { label: i18n.getMessage('Menu.Paste', 'Paste Without Formatting'), role: 'paste' },
        { label: i18n.getMessage('Menu.Delete', 'Delete'), role: 'delete' },
        { label: i18n.getMessage('Menu.SelectAll', 'Select All'), role: 'selectall' },
      ],
    },

    {
      label: i18n.getMessage('Menu.View', 'View'),
      submenu: [
        { label: i18n.getMessage('Menu.Reload', 'Reload'), role: 'reload' },
        { label: i18n.getMessage('Menu.ForceReload', 'Force Reload'), role: 'forcereload' },
        { type: 'separator' },
        { label: i18n.getMessage('Menu.ResetZoom', 'Actual Size'), role: 'resetzoom' },
        { label: i18n.getMessage('Menu.ZoomIn', 'Zoom In'), role: 'zoomin' },
        { label: i18n.getMessage('Menu.ZoomOut', 'Zoom Out'), role: 'zoomout' },
        { type: 'separator' },
        {
          label: i18n.getMessage('Menu.ToggleFullScreen', 'Toggle Full Screen'),
          role: 'togglefullscreen',
        },
        {
          label: i18n.getMessage('Menu.Developer', 'Developer'),
          type: debugMode ? 'submenu' : 'normal',
          visible: debugMode,

          submenu: [
            {
              label: i18n.getMessage('Menu.JavaScriptConsole', 'JavaScript Console'),
              visible: debugMode,
              click() {
                BrowserWindow.getFocusedWindow().webContents.openDevTools();
              },
            },
          ],
        },
      ],
    },
    {
      label: i18n.getMessage('Menu.Help', 'Help'),
      role: 'help',
      id: 'help',
      submenu: [
        {
          label: i18n.getMessage('Menu.About', 'About...'),
          click() {
            const newWinName = getNewWindowName();
            addWindow(newWinName, newAboutWindow(mainConsole));
          },
        },
      ],
    },
  ];
};

module.exports = { createMenu };

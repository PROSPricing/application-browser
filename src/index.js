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
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, Menu, dialog } = require('electron');
const util = require('util');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const environment = require('./environmentSetup.js');
const menu = require('./menu.js');
const i18n = require('./i18n.js');
const { validateNewWindow } = require('./WindowValidator.js');

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep a global reference of the window object
let deeplinkingWindow;

// Deep linked url
let deeplinkingUrl;

// Log both at dev console and at running node console instance
function devToolsLog(s) {
  // eslint-disable-next-line
  console.log(s);
  const message = s.replace(/\n/g, '\\n');

  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log("${message}")`);
  }
  if (
    BrowserWindow.getFocusedWindow() &&
    BrowserWindow.getFocusedWindow().webContents &&
    BrowserWindow.getFocusedWindow() !== mainWindow
  ) {
    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(`console.log("${message}")`);
  }
}

const getUrlFromProtocolString = (str) => {
  const isProtocol = str.indexOf('appb://') === 0;
  const protocolUrl = str.replace(
    /appb:\/\/|http\/\/|http\/(?!\/)|https\/\/|https\/(?!\/)|file\/\/|file\/(?!\/)|ftp\/\/|ftp\/(?!\/)/gi,
    (match) => {
      switch (match) {
        // remove the protocol string
        case 'appb://':
          return '';
        // handle missing colon in deep link
        case 'http//':
        case 'http/':
          return 'http://';
        case 'https//':
        case 'https/':
          return 'https://';
        case 'file//':
        case 'file/':
          return 'file://';
        case 'ftp//':
        case 'ftp/':
          return 'ftp://';
        default:
          return match;
      }
    },
  );
  devToolsLog(`isProtocol# ${isProtocol}`);
  devToolsLog(`str# ${str}`);
  devToolsLog(`protocolUrl# ${protocolUrl}`);

  const urlValidator = /^(ftp|file|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
  const protocolContainsValidUrl = urlValidator.test(protocolUrl);
  let matchesAnEnvironment = false;
  let matchedUrlById = '';
  const {config} = app.prosGlobal;
  devToolsLog(`protocolContainsValidUrl# ${protocolContainsValidUrl}`);

  if (protocolContainsValidUrl) {
    const [protocolScheme, protocolPath] = protocolUrl.split('//');
    const [protocolHost] = protocolPath.split('/');

    if (config && config.environments) {
      for (let i = 0; i < config.environments.length; i += 1) {
        const [envScheme, envPath] = config.environments[i].url.split('//');
        const [envHost] = envPath.split('/');
        devToolsLog(`${envScheme} : ${protocolScheme}`);
        devToolsLog(`${envHost} : ${protocolHost}`);

        if (envScheme === protocolScheme && envHost === protocolHost) {
          matchesAnEnvironment = true;
          break;
        }
      }
    }
  } else if (config && config.environments) {
    for (let i = 0; i < config.environments.length; i += 1) {
      if (str === config.environments[i].id) {
        matchedUrlById = config.environments[i].url;
        break;
      }
    }
  }

  let returnValue = null;

  if (protocolContainsValidUrl && matchesAnEnvironment) {
    returnValue = protocolUrl;
  } else if (matchedUrlById) {
    returnValue = matchedUrlById;
  } else if (isProtocol) {
    // if it is a protocol and it does not match an environment, then show error
    dialog.showErrorBox(
      i18n.getMessage('404.title', 'Page Not Found'),
      i18n.getMessage(
        '404.message',
        `The link "${str}" is not valid and may not match your configured environments.`,
      ),
    );
  }
  return returnValue;
};

const openDeepLink = () => {
  if (deeplinkingUrl) {
    if (deeplinkingWindow) {
      deeplinkingWindow.close();
    }

    deeplinkingWindow = new BrowserWindow({
      minWidth: 1024,
      minHeight: 720,
      width: 1280,
      height: 720,
      show: true,
      webPreferences: {
        plugins: true,
        nativeWindowOpen: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    deeplinkingWindow.on('closed', () => {
      deeplinkingWindow = null;
    });

    deeplinkingWindow.loadURL(deeplinkingUrl);

    if (deeplinkingWindow.isMinimized()) {
      deeplinkingWindow.restore();
    }

    deeplinkingWindow.show();
    deeplinkingUrl = null;
  }
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv, cwd) => {
    // Protocol handler for win32
    // argv: An array of the second instance's (command line / deep linked) arguments
    if (process.platform === 'win32') {
      // Keep only command line / deep linked arguments
      if (argv[1].toString() == '--allow-file-access-from-files') {
        deeplinkingUrl = getUrlFromProtocolString(argv.slice(2).toString());
      } else {
        deeplinkingUrl = getUrlFromProtocolString(argv.slice(1).toString());
      }
    }
    devToolsLog(`app.makeSingleInstance# ${deeplinkingUrl}`);
    openDeepLink();  
  })
}

/**
 * Generates a new top window
 */
const newTopWindow = () => {
  environment.mainConsole.log('loading top window...');

  const win = new BrowserWindow({
    minWidth: 1024,
    minHeight: 720,
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      plugins: true,
      nativeWindowOpen: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.resolve(path.join(__dirname, 'environmentsPage.js')),
    },
  });

  /**
   * Catch cases where the URL is invalid or website is down.
   * Without this code, the user would see an empty screen with no HTML or feedback.
   */
  win.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
    devToolsLog(`did-fail-load# ${errorCode}: ${errorDesc}`);

    // Currently we only redirect when connection related errors
    // see https://cs.chromium.org/chromium/src/net/base/net_error_list.h
    if (errorCode <= -100 && errorCode >= -200) {
      let html = fs.readFileSync(path.join(__dirname, 'error.html'), 'utf-8');
      html = encodeURI(html.replace("<span id='address'/>", validatedURL));
      win.loadURL(`data:text/html;charset=utf-8,${html}`);
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Top window shows content from index.html
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

  // Handle the POST from New-Window bug
  validateNewWindow(win, devToolsLog, app.prosGlobal.config);

  devToolsLog('loadEnv');
  environment.initEnv();

  let errorMessages;
  //Setting startup message without li tag.
  if (app.prosGlobal.error) {
    if (app.prosGlobal.error.length > 0) {
      errorMessages = entities.encode(app.prosGlobal.error[0]) + '</br>';
    }

    //Setting other messages using br and li tags.
    for (let i = 1; i < app.prosGlobal.error.length; i++) {
       errorMessages += `<br/><li>${entities.encode(app.prosGlobal.error[i])}</li>`;
    }
  }

  html = html
    .replace(
      '<title/>',
      `<title>${i18n.getMessage('LaunchPage.ApplicationName', 'Application Browser')}</title>`,
    )
    .replace(
      "<h1 id='heading'/>",
      errorMessages
        ? `<p id='errorMessage'>${errorMessages}<br/></p>`
        : `<h1>${i18n.getMessage('LaunchPage.LinkTitle', 'Environments')}</h1>`,
    );

  html = encodeURI(html);
  win.setTitle(i18n.getMessage('LaunchPage.ApplicationName', 'Environments'));

  // Protocol handler for win32
  if (process.platform === 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = getUrlFromProtocolString(process.argv.slice(1).toString());
    devToolsLog(`win32# ${deeplinkingUrl}`);
  }

  win.loadURL(`data:text/html;charset=utf-8,${html}`);

  if (deeplinkingUrl) {
    devToolsLog(`redirect# ${deeplinkingUrl}`);
    win.loadURL(deeplinkingUrl);
  }

  win.on('page-title-updated', (ev, newTitle) => {
    ev.preventDefault();
    devToolsLog(`Change title: ${newTitle}`);
    const {config} = app.prosGlobal;

    if (deeplinkingUrl) {
      let deepLinkEnvironment = config.environments.find(
        element => element.id === process.argv.slice(1).toString());
      newTitle = entities.encode(deepLinkEnvironment.label);
      win.setTitle(i18n.getMessage('LaunchPage.EnvironmentTitle', 'PROS', { title: newTitle }));
    } else if (config && config.environments) {
      for (let i = 0; i < config.environments.length; i += 1) {
        const label = entities.encode(config.environments[i].label);

        if (label === newTitle) {
          win.setTitle(i18n.getMessage('LaunchPage.EnvironmentTitle', 'PROS', { title: newTitle }));
          break;
        }
      }
    }
  });

  return win;
};

// Must be run before app is "ready"
environment.initEnv();

function main() {
  // Create the browser window.
  mainWindow = newTopWindow();

  const mainConsole = environment.mainConsole;
  const menuGroup = Menu.buildFromTemplate(
    menu.createMenu({ newTopWindow, mainConsole, mainWindow }),
  );
  Menu.setApplicationMenu(menuGroup);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

process.on('uncaughtException', (err) => {
  devToolsLog(util.inspect(err, { compact: true, depth: 5, breakLength: 80 }));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', main);

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    main();
  }
});

// Define custom protocol handler. Deep linking works on packaged versions of the application!
app.setAsDefaultProtocolClient('appb');

// Protocol handler for osx
app.on('open-url', (event, URL) => {
  event.preventDefault();
  deeplinkingUrl = getUrlFromProtocolString(URL);
  devToolsLog(`open-url#  ${URL}`);
  openDeepLink();
});

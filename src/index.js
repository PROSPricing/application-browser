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
const environment = require('./environment.js');
const menu = require('./menu.js');
const i18n = require('./i18n.js');

const { app, BrowserWindow, Menu, dialog } = require('electron');
const fs = require('fs');

// Module with utilities for working with file and directory paths.
const path = require('path');

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
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log("${s}")`);
  }
  if (
    BrowserWindow.getFocusedWindow() &&
    BrowserWindow.getFocusedWindow().webContents &&
    BrowserWindow.getFocusedWindow() !== mainWindow
  ) {
    BrowserWindow.getFocusedWindow().webContents.executeJavaScript(`console.log("${s}")`);
  }
}

const getUrlFromProtocolString = str => {
  const isProtocol = str.indexOf('pros-app://') === 0;
  const protocolUrl = str.replace(
    /pros-app:\/\/|http\/\/|http\/(?!\/)|https\/\/|https\/(?!\/)|file\/\/|file\/(?!\/)|ftp\/\/|ftp\/(?!\/)/gi,
    match => {
      switch (match) {
        // remove the protocol string
        case 'pros-app://':
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
  devToolsLog(`protocolContainsValidUrl# ${protocolContainsValidUrl}`);

  if (protocolContainsValidUrl) {
    const [protocolScheme, protocolPath] = protocolUrl.split('//');
    const [protocolHost] = protocolPath.split('/');

    for (let i = 0; i < app.prosGlobal.config.environments.length; i += 1) {
      const [envScheme, envPath] = app.prosGlobal.config.environments[i].url.split('//');
      const [envHost] = envPath.split('/');
      devToolsLog(`${envScheme} : ${protocolScheme}`);
      devToolsLog(`${envHost} : ${protocolHost}`);

      if (envScheme === protocolScheme && envHost === protocolHost) {
        matchesAnEnvironment = true;
        break;
      }
    }
  }

  let returnValue = null;

  if (protocolContainsValidUrl && matchesAnEnvironment) {
    returnValue = protocolUrl;
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

// Force Single Instance Application
const shouldQuit = app.makeSingleInstance(argv => {
  // Protocol handler for win32
  // argv: An array of the second instance’s (command line / deep linked) arguments
  if (process.platform === 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = getUrlFromProtocolString(argv.slice(1).toString());
  }

  devToolsLog(`app.makeSingleInstance# ${deeplinkingUrl}`);
  openDeepLink();
});

if (shouldQuit) {
  app.quit();
}

/**
 * Get the form data from the document and return the result as a JSON Object
 * This function assumes the last form element created is the one that should
 * be requested. Verification of the correct form should happen by inspecting
 * result object.
 */
const getFormData = function getFormData() {
  // eslint-disable-next-line
  var forms = top.frames.main.document.forms;
  // eslint-disable-next-line
  var form = forms[forms.length - 1];
  // eslint-disable-next-line
  var result = {
    name: form.name,
    action: form.action,
    method: form.method,
    data: {},
  };
  // eslint-disable-next-line
  for (var i = 0; i < form.children.length; i += 1) {
    result.data[form.children[i].name] = form.children[i].value;
  }

  return result;
};

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
    },
  });

  // TODO: Catch cases where the URL is invalid or website is down.
  // win.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
  //   devToolsLog(`did-fail-load# ${errorCode}: ${errorDesc}`);
  //   let html = fs.readFileSync(path.join(__dirname, 'error.html'), 'utf-8');
  //   html = encodeURI(html.replace("<span id='address'/>", validatedURL));
  //   win.loadURL(`data:text/html;charset=utf-8,${html}`);
  // });

  win.once('ready-to-show', () => {
    win.show();
  });

  /**
   * To fix an issue that a new window does not show the POST contents, we
   * must intercept the request to provide additional loading Information
   */
  win.webContents.on('new-window', (event, newURL) => {
    const launchWindow = BrowserWindow.getFocusedWindow();
    const downloadWindow = new BrowserWindow({
      parent: launchWindow,
      show: false,
      webPreferences: {
        plugins: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    // eslint-disable-next-line
    event.newGuest = downloadWindow; // required by electron
    downloadWindow.hide();

    const processingWindow = new BrowserWindow({
      width: 330,
      height: 220,
      parent: launchWindow,
      frame: false,
      modal: true,
      show: false,
    });
    const html = fs.readFileSync(path.join(__dirname, 'processing.html'), 'utf-8');
    processingWindow.loadURL(`data:text/html;charset=utf-8,${html}`);

    const isReportingWindow = newURL.indexOf('window/window') > 0;
    if (isReportingWindow) {
      event.preventDefault();
      processingWindow.show();
    } else {
      downloadWindow.close();
      processingWindow.close();
      return;
    }

    // Navigate to a relative link to pick up the session
    downloadWindow.loadURL('#');

    // Get the form data from the main window
    launchWindow.webContents.executeJavaScript(`(${getFormData.toString()})()`, result => {
      // verify the action matches the form requested using the action URL
      // also, there is no reason to redirect the URL unless the request is a POST method
      if (result.action === newURL && result.method === 'post') {
        /**
         * This path is followed for recognized content such as html and pdf
         */
        downloadWindow.webContents.session.removeAllListeners('did-finish-load');
        downloadWindow.webContents.on('did-finish-load', () => {
          processingWindow.close();
          downloadWindow.show();

          // When the html page is loaded, provide an automatic save option
          dialog.showSaveDialog(
            {
              filters: [{ name: 'text', extensions: ['pdf'] }],
            },
            fileName => {
              if (fileName) {
                downloadWindow.webContents.printToPDF({}, (error, data) => {
                  fs.writeFileSync(fileName, data, 'utf-8');
                  // TODO: handle error case
                });
              }
            },
          );
        });

        /**
         * This path is followed for unrecognized content such as .xls
         * Since in these cases a download happens automatically, we will need to
         * handle the processingWindow and downloadWindow
         */
        downloadWindow.webContents.session.removeAllListeners('will-download');
        downloadWindow.webContents.session.on('will-download', (willDownloadEvent, item) => {
          if (processingWindow) {
            processingWindow.close();
          }

          // Close the download window when complete since it contains no data
          item.once('done', () => {
            downloadWindow.close();
          });
        });

        // Perform the POST request for the MSRS report
        downloadWindow.loadURL(result.action, {
          postData: [
            {
              type: 'rawData',
              bytes: Buffer.from(`POST=${encodeURIComponent(result.data.POST)}`),
            },
          ],
          responseType: 'arraybuffer',
          extraHeaders: 'Content-Type: application/x-www-form-urlencoded\n',
        });
      }
    });
  });

  // Top window shows content from index.html
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
  let links = '';
  const environments = app.prosGlobal.config.environments || [];
  for (let i = 0; i < environments.length; i += 1) {
    const link = `<p><a href="${app.prosGlobal.config.environments[i].url}">${
      app.prosGlobal.config.environments[i].label
    }</a></p>`;
    links += link;
  }

  html = html
    .replace(
      '<title/>',
      `<title>${i18n.getMessage('LaunchPage.ApplicationName', 'Application Browser')}</title>`,
    )
    .replace(
      "<h1 id='heading'/>",
      app.prosGlobal.error
        ? ''
        : `<h1>${i18n.getMessage('LaunchPage.LinkTitle', 'Environments')}</h1>`,
    )
    .replace("<div id='environments'/>", app.prosGlobal.error ? app.prosGlobal.error : links);
  html = encodeURI(html);

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

  return win;
};

// Must be run before app is "ready"
environment.initEnv();

function main() {
  // Create the browser window.
  mainWindow = newTopWindow();

  const mainConsole = environment.mainConsole;
  const menuGroup = Menu.buildFromTemplate(menu.createMenu({ newTopWindow, mainConsole }));
  Menu.setApplicationMenu(menuGroup);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

process.on('uncaughtException', err => {
  devToolsLog(err);
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
app.setAsDefaultProtocolClient('pros-app');

// Protocol handler for osx
app.on('open-url', (event, URL) => {
  event.preventDefault();
  deeplinkingUrl = getUrlFromProtocolString(URL);
  devToolsLog(`open-url#  ${URL}`);
  openDeepLink();
});

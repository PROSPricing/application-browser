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
const { BrowserWindow } = require('electron');
const { inspect } = require('util');

/**
 * Get the last form from the parent document, submit it, and
 * downloads the respose.
 */
const downloadFormResponse = function redirectForm() {
  /* eslint-disable */
  top.DialogUtil && top.DialogUtil.showBusyDialog();
  try {
    var doc = top.document.main.document || top.frames.main.document;
    var forms = doc.forms;
    var form = forms[forms.length - 1];
    var formData = {};

    for (var i = 0; i < form.children.length; i += 1) {
      formData[form.children[i].name] = form.children[i].value;
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        top.DialogUtil && top.DialogUtil.hideBusyDialog();

        var file = window.URL.createObjectURL(xhr.response);
        var a = document.createElement('a');
        a.href = file;

        var filenameParam = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
          xhr.getResponseHeader('Content-Disposition') || 'filename=',
        )[1];
        var filename = filenameParam.replace(/(^")|("$)/g, '');

        top.window.xhr = xhr;
        a.download = filename || xhr.response.name || 'document';
        document.body.appendChild(a);
        a.click();
      }
    };

    xhr.responseType = 'blob';
    xhr.open('POST', form.action, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.send('POST=' + encodeURIComponent(formData.POST));
  } catch (e) {
    console.error(e);
    top.DialogUtil && top.DialogUtil.hideBusyDialog();
  }
  return xhr.response;
  /* eslint-enable */
};

/**
 * To fix an issue in electron that happens when new windows are opened via POST,
 * we will intercept the request and call downloadFormResponse instead.
 */
const validateNewWindow = function downloadPostOnNewWindowEvent(win, consoleLog, config) {
  win.webContents.on('new-window', (event, newURL) => {
    // We are isolating the specific URL pattern known to have this issue
    consoleLog(`dialog URL: ${newURL}`);

    const isPostDownloadRequest = newURL.indexOf('control=callWindowEvent') > 0;
    consoleLog(`isPostDownloadRequest: ${isPostDownloadRequest}`);
    consoleLog(`event: ${inspect(event)}`);

    if (!isPostDownloadRequest) {
      return;
    }

    event.preventDefault();

    const launchWindow = BrowserWindow.getFocusedWindow();
    launchWindow.webContents.executeJavaScript(`(${downloadFormResponse.toString()})()`);
  });

  // when opening a new window, we will redirect the path if the user has configured
  // whenUrl endsWith & thenAppend
  if (config.whenUrl) {
    win.webContents.on('did-finish-load', event => {
      const href = event.sender.history.slice().pop();
      let newHref = href;

      config.whenUrl.forEach(({ endsWith, thenAppend }) => {
        if (endsWith && thenAppend && href.endsWith(endsWith)) {
          newHref = `${href}${thenAppend}`;
        }
      });
      if (newHref !== href) {
        consoleLog(`redirect from: ${href} to ${newHref}`);
        win.webContents.executeJavaScript(`location.replace("${newHref}")`);
      }
    });
  }
};

module.exports = { validateNewWindow };

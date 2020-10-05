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
const { app } = require('electron');
const fs = require('fs');
const nodeConsole = require('console');
const path = require('path');
const i18n = require('./i18n.js');

const mainConsole = new nodeConsole.Console(process.stdout, process.stderr);

/**
 * Set the path to the config file based on platform
 */
const getConfigPath = () => {
  let configPath;
  if(process.platform === 'darwin') {
    configPath = '/pros/desktopclient/config.json'
  } else {
    let relativePath = path.join(__dirname, '../../..', 'config.json');
    configPath = relativePath;
    if (!fs.existsSync(relativePath)) {
      let cwdPath = path.join(process.cwd(), 'config.json');
      if (fs.existsSync(cwdPath)) {
        configPath = cwdPath;
      }
    }
  }
  return configPath;
}

const CONFIG_FILE_PATH = getConfigPath();

/**
 * Example for content of environments.config file.
 * Sample Windows flash.path C:\\Windows\\System32\\Macromed\\Flash\\pepflashplayer64_28_0_0_137.dll
 * Sample iOS flash.path /Library/Internet Plug-Ins/PepperFlashPlayer/PepperFlashPlayer.plugin
 * {
 *   "flash":
 *   {
 *     "path":"C:\\Windows\\System32\\Macromed\\Flash\\pepflashplayer64_28_0_0_137.dll",
 *     "version":"28.0.0.137"
 *   },
 *
 *   "develop": false,
 *   "locale": 'de',
 *
 *   "environments":
 *   [
 *     {
 *       "id": "test",
 *       "url": "https://www.google.it",
 *       "label": "Test"
 *     }, {
 *       "id": "sandbox",
 *       "url": "https://us.yahoo.com/",
 *       "label": "Sandbox"
 *     }, {
 *       "id": "production",
 *       "url": "https://www.facebook.com",
 *       "label": "Production"
 *     }
 *   ],
 *
 *   "whenUrl": [{
 *     "endsWith": "facebook.com",
 *     "thenAppend": "/StarWars/"
 *   }],
 * }
 */

// initialize Desktop Client global context information
app.prosGlobal = {
  rootFolder: path.join(__dirname, '..'),
  error: null,
  configFile: CONFIG_FILE_PATH,
  config: { flash: { path: '', version: '' }, environments: [] },
  develop: false,
};

// read config file
const startupError =
  'Application Browser is not configured correctly, please contact your System Administrator.';

const getSyntaxError = (error, isExplicit) =>
  `[${isExplicit ? 'EXPLICIT' : 'IMPLICIT'}] ${error.name} in config.json: ${error.message}`;

const validateConfigFile = () => {
  let configErrors = [];
  let json = null;

  if (fs.existsSync(app.prosGlobal.configFile)) {
    try {
      const file = fs.readFileSync(app.prosGlobal.configFile);
      json = JSON.parse(file);
    } catch (e) {
      if (e instanceof SyntaxError) {
        configErrors.push(getSyntaxError(e, true));
      } else {
        configErrors.push(getSyntaxError(e, false));
      }
    }
  } else {
    configErrors.push(
      `Configuration file config.json not found at location ${app.prosGlobal.configFile}`,
    );
  }
  return { json, configErrors };
};

const validateParams = (json) => {
  let errorMessages = [];
  let flashPath;
  let configuredFlashPathLocated = false;

  try {
    flashPath = app.getPath('pepperFlashSystemPlugin');
  } catch(error) {
    mainConsole.log(`Default flash path was not found: ${error}`);
  }

  if (json) {
    if (!json.flash) {
      console.log('The config.json file does not have a value for "flash" param');
    } else if (!json.flash.path) {
      console.log('The config.json file does not have a value for "flash path" param');
    } else if (!fs.existsSync(json.flash.path)) {
      console.log(`File not found for the configured flash path [${json.flash.path}]`);
    } else {
      configuredFlashPathLocated = true;
      console.log('Configured flash path located.');
    }

    if (!configuredFlashPathLocated) {
      if (!flashPath || !fs.existsSync(flashPath)) {
        errorMessages.push(
          'The FlashPlayer plugin could not be found. Try reinstalling the FlashPlayer or update the config.json file with a valid path.',
        );
      } else {
        console.log('Default flash path located.');
      }
    }

    if (!json.environments) {
      errorMessages.push(
        'The config.json file does not have a value for the "environments" param',
      );
    } else if (Array.isArray(json.environments)) {
      if (json.environments.length === 0) {
        errorMessages.push(
          'The config.json file does not have any "environments" configured.',
        );
      }
    } else {
      errorMessages.push('The config.json file "environments" param must be an array.');
    }
  }

  return errorMessages;
};

const initEnv = () => {
  try {
    const { json, configErrors } = validateConfigFile();
    app.prosGlobal.config = json || {};
    i18n.loadCatalog(app.prosGlobal.config.locale);

    const errorMessages = validateParams(json);
    if (configErrors.length > 0 || errorMessages.length > 0) {
      app.prosGlobal.error = [];
      app.prosGlobal.error.push(startupError);
      configErrors.forEach(message => app.prosGlobal.error.push(message));
      errorMessages.forEach(message => app.prosGlobal.error.push(message));
      return;
    }
    let defaultFlashPath;
    try {
      defaultFlashPath = app.getPath('pepperFlashSystemPlugin');
    } catch (error) {
      mainConsole.log(`Default flash path was not found: ${error}`);
    }

    let configFlashPath;
    if (!json.flash || !json.flash.path || !fs.existsSync(json.flash.path)) {
      if (!defaultFlashPath || !fs.existsSync(defaultFlashPath)) {
        app.prosGlobal.error = [];
        app.prosGlobal.error.push(
          'The FlashPlayer plugin could not be found. Try reinstalling the FlashPlayer or update the config.json file with a valid path.');
        return;
      }
    } else {
      configFlashPath = json.flash.path;
    }

    const flashPath = configFlashPath || defaultFlashPath;
    app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
    app.commandLine.appendSwitch('ppapi-flash-version', '27.0.0.130');
    mainConsole.log(`Using flash path: ${flashPath}`);
  } catch (ex) {
    app.prosGlobal.error = [];
    app.prosGlobal.error.push(startupError);
  }
};

module.exports = { mainConsole, initEnv };

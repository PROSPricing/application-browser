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
  if (process.platform === 'darwin') {
    configPath = '/pros/desktopclient/config.json';
  } else {
    const relativePath = path.join(__dirname, '../../..', 'config.json');
    configPath = relativePath;
    if (!fs.existsSync(relativePath)) {
      const cwdPath = path.join(process.cwd(), 'config.json');
      if (fs.existsSync(cwdPath)) {
        configPath = cwdPath;
      }
    }
  }
  return configPath;
};

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
app.globalContext = {
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
  const configErrors = [];
  let json = null;

  if (fs.existsSync(app.globalContext.configFile)) {
    try {
      const file = fs.readFileSync(app.globalContext.configFile);
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
      `Configuration file config.json not found at location ${app.globalContext.configFile}`,
    );
  }
  return { json, configErrors };
};

const validateParams = (json) => {
  const errorMessages = [];
  let flashPath;
  let configuredFlashPathLocated = false;

  try {
    flashPath = app.getPath('pepperFlashSystemPlugin');
  } catch (error) {
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

const containsValidUrl = (url) => {
  const urlValidator = /^(ftp|file|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
  return urlValidator.test(url);
};

const getProtocolAndHostFromUrl = (url) => {
  const [protocolScheme, protocolPath] = url.split('://');
  const [protocolHost] = protocolPath.split('/');
  return `${protocolScheme}://${protocolHost}`;
};

/**
 * Automatically fills the mms.cfg file using the url of each environment from config.json file.
 * Each time the application is launched this file is updated with config.json URL environments that
 * do not exist on mms.cfg file. If a new change is made, the application must be restarted.
 *
 * This is an example of the AllowListURLPattern output in the mms.cfg file:
 *
 * For config.json url: "http://<server>:<port>/application/index.html"
 *
 * This is the mms.cfg new entry: "AllowListURLPattern=http://<server>:<port>"
 *
 * SilentAutoUpdateEnable=0, AutoUpdateDisable=1, EOLUninstallDisable=1, ErrorReportingEnable=1
 * and EnableAllowList=1 are added when mms.cfg file does not exist.
 *
 * To disable this functionality add the disableAutoFillMmsFile property as false to the config.json file
 *
 * This document presents more information about how to configure the AllowListURLPattern entry:
 * https://www.adobe.com/content/dam/acom/en/devnet/flashplayer/articles/flash_player_admin_guide/pdf/latest/flash_player_32_0_admin_guide.pdf
 *
 */
const fillMmsFile = () => {
  const MMS_FOLDER = `${app.getPath('userData')}\\Pepper Data\\Shockwave Flash\\System\\`;
  const MMS_FILE_NAME = 'mms.cfg';
  const MMS_PATH = MMS_FOLDER + MMS_FILE_NAME;
  console.log(MMS_PATH);
  let mmsEntries = '';

  if (!fs.existsSync(MMS_PATH)) {
    if (!fs.existsSync(MMS_FOLDER)) {
      fs.mkdirSync(MMS_FOLDER);
    }
    mmsEntries = 'SilentAutoUpdateEnable=0\n';
    mmsEntries += 'AutoUpdateDisable=1\n';
    mmsEntries += 'EOLUninstallDisable=1\n';
    mmsEntries += 'ErrorReportingEnable=1\n';
    mmsEntries += 'EnableAllowList=1\n';
  } else {
    const mmsFileEntries = fs.readFileSync(MMS_PATH, 'utf8').split('\n');
    mmsFileEntries.forEach((element) => {
      if (element.trim() != '') {
        mmsEntries += `${element}\n`;
      }
    });
  }

  if (fs.existsSync(CONFIG_FILE_PATH)) {
    let json = {};
    const file = fs.readFileSync(CONFIG_FILE_PATH);
    json = JSON.parse(file);
    if (json.environments) {
      for (let i = 0; i < json.environments.length; i += 1) {
        if (containsValidUrl(json.environments[i].url)) {
          const allowedEntry = `AllowListURLPattern=${getProtocolAndHostFromUrl(json.environments[i].url)}\n`;
          if (mmsEntries.indexOf(allowedEntry.trim()) === -1) {
            mmsEntries += allowedEntry;
          }
        }
      }
      try {
        fs.writeFileSync(MMS_PATH, mmsEntries);
      } catch (error) {
        app.globalContext.error.push(`Could not write to ${MMS_PATH} file.`);
      }
    }
  } else {
    console.log('fillMmsFile# configuration file not found.');
  }
};

const initEnv = () => {
  try {
    const { json, configErrors } = validateConfigFile();
    app.globalContext.config = json || {};
    i18n.loadCatalog(app.globalContext.config.locale);

    const errorMessages = validateParams(json);
    if (configErrors.length > 0 || errorMessages.length > 0) {
      app.globalContext.error = [];
      app.globalContext.error.push(startupError);
      configErrors.forEach(message => app.globalContext.error.push(message));
      errorMessages.forEach(message => app.globalContext.error.push(message));
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
        app.globalContext.error = [];
        app.globalContext.error.push(
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

    if (!json.disableAutoFillMmsFile) {
      fillMmsFile();
    }
  } catch (ex) {
    app.globalContext.error = [];
    app.globalContext.error.push(startupError);
  }
};

module.exports = { mainConsole, initEnv };

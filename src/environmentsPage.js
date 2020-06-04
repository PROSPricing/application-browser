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

/**
 * Set the path to the config file based on platform
 */
const CONFIG_FILE_PATH =
  process.platform === 'darwin'
    ? '/pros/desktopclient/config.json'
    : 'config.json';

const SETTINGS_FILE_PATH =
  process.platform === 'darwin'
    ? '/pros/desktopclient/launchpage-config.json'
    : process.env.USERPROFILE + '\\launchpage-config.json';

const getSyntaxError = (error) => {
  const isExplicit = error instanceof SyntaxError;
  return `[${isExplicit ? 'EXPLICIT' : 'IMPLICIT'}] ${error.name} in config.json: ${error.message}`;
};

const formatError = message => `<br/><li>${message}</li>`;

const validateParams = (json) => {
  let errorMessages = '';

  if (json) {
    if (!json.environments) {
      errorMessages += formatError(
        'The config.json file does not have a value for the "environments" param',
      );
    } else if (Array.isArray(json.environments)) {
      if (json.environments.length === 0) {
        errorMessages += formatError(
          'The config.json file does not have any "environments" configured.',
        );
      }
    } else {
      errorMessages += formatError('The config.json file "environments" param must be an array.');
    }
  }

  return errorMessages;
};

global.getConfigFile = () => {
  let errorMessage = '';
  let json = {};

  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const file = fs.readFileSync(CONFIG_FILE_PATH);
      json = JSON.parse(file);
    } catch (e) {
      errorMessage += formatError(getSyntaxError(e));
    }
  } else {
    errorMessage += formatError(`Configuration file config.json not found at location ${process.cwd()}`);
  }

  if (!errorMessage) {
    errorMessage = validateParams(json);
  }

  return { json, errorMessage };
};

const validateSettingParams = (json) => {
  let errorMessages = '';

  if (json) {
    if (!json.settings) {
      errorMessages += formatError(
        'The launchpage-config.json file does not have a value for the "settings" param',
      );
    } else if (Array.isArray(json.settings)) {
      if (json.settings.length === 0) {
        errorMessages += formatError(
          'The launchpage-config.json file does not have any "settings" configured.',
        );
      }
    } else {
      errorMessages += formatError(
        'The launchpage-config.json file "settings" param must be an array.');
    }
  }
  return errorMessages;
};

global.checkSettingsFile = () => {
  if (!fs.existsSync(SETTINGS_FILE_PATH) && fs.existsSync(CONFIG_FILE_PATH)) {
    let json = {};
    const file = fs.readFileSync(CONFIG_FILE_PATH);
    json = JSON.parse(file);
    if (json.environments) {
      let values = [];
      for (let i = 0; i < json.environments.length; i += 1) {
        values.push({ref: json.environments[i].id, hide: false});
      }
      let settingsFile = JSON.stringify({settings: values});
      fs.writeFileSync(SETTINGS_FILE_PATH, settingsFile);
    }
  } else if (fs.existsSync(SETTINGS_FILE_PATH) && fs.existsSync(CONFIG_FILE_PATH)) {
    let configJson = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH))
    let settingsJson = JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH))
    syncSettingsFile(configJson, settingsJson)
  }
}

const syncSettingsFile = function(configJson, settingsJson) {
  let currentEnvironments = [];
  for (let i = 0; i < settingsJson.settings.length; i += 1) {
    currentEnvironments[i] = settingsJson.settings[i].ref;
  }

  let newEnvironments = [];
  for (let i = 0; i < configJson.environments.length; i += 1) {
    if (!currentEnvironments.includes(configJson.environments[i].id)) {
      newEnvironments.push({ref: configJson.environments[i].id, hide: false})
    }
  }

  if (newEnvironments.length > 0) {
    for (let i = 0; i < newEnvironments.length; i += 1) {
      settingsJson.settings.push(newEnvironments[i])
    }

    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsJson), (err) => {
      if (err) throw err;
      // success case, the file was updated
      console.log('launchpage-config.json updated');
    });
  }
}

global.getSettingsFile = () => {
  let settingErrorMessage = '';
  let settingJson = {};

  checkSettingsFile();
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    try {
      const file = fs.readFileSync(SETTINGS_FILE_PATH);
      settingJson = JSON.parse(file);

      if (!settingErrorMessage) {
        settingErrorMessage = validateSettingParams(settingJson);
      }
    } catch (e) {
      settingErrorMessage += formatError(getSyntaxError(e));
    }
  }

  return { settingJson, settingErrorMessage };
};

global.toggleEnvHideProperty = (id) => {
  const { settingJson } = global.getSettingsFile();

  let setting = settingJson.settings.find(element => element.ref === id);
  if (setting) {
    setting.hide = !setting.hide;
  } else {
    settingJson.settings.push({"ref":id,"hide":false});
  }

  fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settingJson), (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('launchpage-config.json saved');
  });
};

const createToggleButton = (key, onLabel, offLabel, isOn) =>
  `<div id="${key}" name="${
    isOn ? 'isOn' : 'isOff'
  }" class="pdt-toggleButton hide" style="position: relative;padding: 14px 20px;">
    <button class="pdt-button toggle-button size-small type-default iconed ${isOn &&
      'selected'}" tabindex="0" onClick="toggleEnv('${key}')">
      <div class="pdt-button-container">
        <div class="pdt-button-label-container">
          <div class="pdt-button-icon-container textOn">
            <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" class="pdt-icon pdt-button-icon" focusable="false" style="vertical-align: middle;"><g><path d="m37.3 20q0 4.7-2.3 8.6t-6.3 6.2-8.6 2.3-8.6-2.3-6.2-6.2-2.3-8.6 2.3-8.6 6.2-6.2 8.6-2.3 8.6 2.3 6.3 6.2 2.3 8.6z"></path></g></svg>
          </div>
          <div class="pdt-button-icon-container textOff">
            <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" class="pdt-icon pdt-button-icon" focusable="false" style="vertical-align: middle;"><g><path d="m20.1 5.7q-2.9 0-5.5 1.2t-4.6 3-3 4.6-1.1 5.5 1.1 5.5 3 4.6 4.6 3 5.5 1.2 5.6-1.2 4.5-3 3.1-4.6 1.1-5.5-1.1-5.5-3.1-4.6-4.5-3.1-5.6-1.1z m17.2 14.3q0 4.7-2.3 8.6t-6.3 6.2-8.6 2.3-8.6-2.3-6.2-6.2-2.3-8.6 2.3-8.6 6.2-6.2 8.6-2.3 8.6 2.3 6.3 6.2 2.3 8.6z"></path></g></svg>
          </div>
          <div class="pdt-button-label">
            <p class="pdt-truncatedtext textOn">${onLabel}</p>
            <p class="pdt-truncatedtext textOff">${offLabel}</p>
          </div>
        </div>
      </div>
    </button>
  </div>`;

const getHideValue = (settings, id) => {
  let hideValue = false;
  let setting = settings.find(element => element.ref === id);
  if (setting) {
	hideValue = setting["hide"];
  }
  return hideValue;
};

global.buildLinks = (environments, settings) => {
  let links = '';
  for (let i = 0; i < environments.length; i += 1) {
    const show = getHideValue(settings, environments[i].id) !== true;
    const id = `button-${environments[i].id}`;
    const link = `<div id="${id}" style="padding-bottom:10px;padding-right:10px;padding-left:10px;float: left;width: 31%;" ${show ? '' : 'class="hide"'}>
      <a href="${environments[i].url}"
        onClick="document.title='${environments[i].label}'">
        ${environments[i].label}</a>
        ${createToggleButton(environments[i].id, 'VISIBLE', 'HIDDEN', show)}
      </div>`;
    links += link;
  }
  return links;
};

global.buildEnvironments = () => {
  const { json, newErrorMessages } = global.getConfigFile();
  const { settingJson, settingErrorMessage } = global.getSettingsFile();

  if (newErrorMessages) {
    document.getElementById('environments').innerHTML = newErrorMessages;
  } else if (settingErrorMessage) {
    document.getElementById('environments').innerHTML = settingErrorMessage;
  }

  const existingErrorMessage =
    document.getElementById('errorMessage') && document.getElementById('errorMessage').innerText;

  // only show environments if no error messages are shown
  if (!existingErrorMessage && !newErrorMessages && !settingErrorMessage) {
    const envLinks = global.buildLinks(json.environments, settingJson.settings);
    document.getElementById('environments').innerHTML = envLinks;
  }
};

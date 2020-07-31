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

/**
 * Internationalization and localization support.
 */
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const loadCatalog = configLocale => {
  // loadCatalog must be used after app is ready so we can use app.getLocale().
  // configLocale is a param that comes from the config file and will be null
  // in production cases
  const locale = configLocale || app.getLocale();
  const language = locale.split('-')[0];

  // eslint-disable-next-line
  console.log(`locale# ${language}`);

  // the catalog is loaded into the global app context
  let catalogName = `${language}.json`;
  let catalogPath = path.join(__dirname, '.', 'i18n', catalogName);

  if (fs.existsSync(catalogPath)) {
    app.prosGlobal.catalog = JSON.parse(fs.readFileSync(catalogPath));
  } else {
    // eslint-disable-next-line
    console.log(`The language file ${catalogPath} was not found`);
    catalogName = 'en.json';
    catalogPath = path.join(__dirname, '.', 'i18n', catalogName);
    app.prosGlobal.catalog = JSON.parse(fs.readFileSync(catalogPath));
  }

  return catalogPath;
};

const getMessage = (id, defaultValue, labelmap) => {
  let result = app.prosGlobal.catalog[id.toString()];

  // handle multiline messages
  if (Array.isArray(result)) {
    result = result.join(' ');
  }

  let message = result || defaultValue || id.toString();

  const entries = labelmap ? Object.entries(labelmap) : [];
  entries.forEach(value => {
    message = message.replace(`{${value[0]}}`, value[1]);
  });
  message = entities.encode(message);
  return message;
};

module.exports = { loadCatalog, getMessage };

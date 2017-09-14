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
 * The script parses npm-shrinkwrap.json to identify non dev dependencies
 * and copies all corresponding license files from the npm registry
 * to the project config/copyright folder.
 */

/* eslint no-console: 0 */
/* eslint arrow-body-style: 0 */

const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const prosArtifactoryUrl = process.env.LICENSE_URL;
const licenseFolderPath = path.join(__dirname, 'copyright');
const npmShrinkwrapPath = path.join(__dirname, 'npm-shrinkwrap.json');

if (!fs.existsSync(licenseFolderPath)) {
  fs.mkdirSync(licenseFolderPath);
}

console.log(`license folder is ${licenseFolderPath}`);

const shrinkwrapData = JSON.parse(fs.readFileSync(npmShrinkwrapPath, 'utf8'));
const dependencyPathsArray = Object.getOwnPropertyNames(shrinkwrapData.dependencies);

dependencyPathsArray.forEach(dependencyPath => {
  const dependencyData = shrinkwrapData.dependencies[dependencyPath];
  if (dependencyData.dev === undefined || dependencyData.dev === false) {
    const dependencyVersion = dependencyData.version;
    const dependencyPathParts = dependencyPath.split('/');
    const dependencyName = dependencyPathParts[dependencyPathParts.length - 1];
    const licenseFileName = `${dependencyName}-${dependencyVersion}-license.txt`;
    const dependencyLicenseUrl = `${prosArtifactoryUrl}/${dependencyPath}/-/${licenseFileName}`;

    fetch(dependencyLicenseUrl)
      .then(res => {
        if (res.statusCode > 400 && response.statusCode < 499)
        {
          console.log(`License Missing -- ${licenseFileName}`);
          throw err;
        }
        else {
          return res.text();
        }
      })
      .then(body => {
        fs.writeFile(path.join(licenseFolderPath, licenseFileName), body, 'utf8', err => {
          if (err) throw err;
          console.log(`File saved - ${licenseFileName}`);
        });
      })
      .catch(err => {
        console.error(err);
      });
  }
});

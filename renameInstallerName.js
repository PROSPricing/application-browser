/*
 * Copyright (c) 2020 by PROS, Inc.
 */

const fs = require('fs');
const path = require('path');

const exePath = 'out\\make\\squirrel.windows\\';
const msiPath = 'out\\make\\wix\\';
const ia32 = 'ia32';
const x64 = 'x64';
const filePath = path.join(__dirname, 'package.json');

const rename = (oldName, newName) => {
  if (fs.existsSync(oldName)) {
    fs.rename(oldName, newName, () => {
      console.log(`\nFile ${oldName} renamed to: ${newName}`);
    });
  } else {
    console.log(`File ${oldName} doesn't exist.`);
  }
};

fs.readFile(filePath, { encoding: 'utf-8' }, (error, data) => {
  if (!error) {
    let jsonObj;
    try {
      jsonObj = JSON.parse(data);
    } catch (e) {
      console.log(`Error parsing ${filePath} file.`);
    }
    const oldExeName = `Application Browser-${jsonObj.version} Setup.exe`;
    const oldMsiName = 'Application Browser.msi';

        // 32 bit msi
    let oldName = `${msiPath}${ia32}\\${oldMsiName}`;
    let newName = `${msiPath}${ia32}\\${jsonObj.name}-${jsonObj.version}-${ia32}.msi`;
    rename(oldName, newName);
        // 64 bit msi
    oldName = `${msiPath}${x64}\\${oldMsiName}`;
    newName = `${msiPath}${x64}\\${jsonObj.name}-${jsonObj.version}-${x64}.msi`;
    rename(oldName, newName);
        // 32 bit exe
    oldName = `${exePath}${ia32}\\${oldExeName}`;
    newName = `${exePath}${ia32}\\${jsonObj.name}-${jsonObj.version}-${ia32}-setup.exe`;
        // 64 bit exe
    rename(oldName, newName);
    oldName = `${exePath}${x64}\\${oldExeName}`;
    newName = `${exePath}${x64}\\${jsonObj.name}-${jsonObj.version}-${x64}-setup.exe`;
    rename(oldName, newName);
  } else {
    console.log(error);
  }
});

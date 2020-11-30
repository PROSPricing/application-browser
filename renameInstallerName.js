/*
 * Copyright (c) 2020 by PROS, Inc.
 */

const fs = require('fs');
const path = require('path');
const exePath = 'out\\make\\squirrel.windows\\x64\\';
const msiPath = 'out\\make\\wix\\x64\\';
const filePath = path.join(__dirname, 'package.json');

fs.readFile(filePath, {encoding: 'utf-8'}, function(error, data) {
    if (!error) {
        let jsonObj;
        try {
            jsonObj = JSON.parse(data);
        } catch (e) {
            console.log("Error parsing " + filePath + " file.");
        }
        const oldMsiName = msiPath + 'Application Browser.msi';
        const newMsiName = msiPath + jsonObj.name + '-' + jsonObj.version + '.msi';
        if (fs.existsSync(oldMsiName)) {
            fs.rename(oldMsiName, newMsiName, () => { 
                console.log("\nFile " + oldMsiName + " renamed to: " + newMsiName);
            });
        } else {
            console.log("File " + oldMsiName + " doesn't exist.");
        }
        const oldExeName = exePath + 'Application Browser-' + jsonObj.version + ' Setup.exe';
        const newExeName = exePath + jsonObj.name + '-' + jsonObj.version + '-setup.exe';
        if (fs.existsSync(oldExeName)) {
            fs.rename(oldExeName, newExeName, () => { 
                console.log("\nFile " + oldExeName + " renamed to: " + newExeName);
            }); 
        } else {
            console.log("File " + oldExeName + " doesn't exist.");
        }
    } else {
        console.log(error);
    }
});

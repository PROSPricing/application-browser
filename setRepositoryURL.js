/*
 * Copyright (c) 2020 by PROS, Inc.
 */

var fs = require('fs');
var path = require('path');

const setRepository = (filePath, repositoryURL) => {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(error, data) {
        if (!error) {
            var result = data.replace(/REPOSITORY_URL/g, repositoryURL);
            fs.writeFile(filePath, result, 'utf8', function (err) {
                if (err) {
                    console.log(err);
                }
            });
        } else {
            console.log(error);
        }
    });
}

const gradleFilePath = path.join(__dirname, 'gradle/wrapper/gradle-wrapper.properties');
const gradleRepositoryURL = process.argv.slice(2)[0];
const npmrcFilePath = path.join(__dirname, '.npmrc');
const npmrcRepositoryURL = process.argv.slice(3)[0];

setRepository(gradleFilePath, gradleRepositoryURL);
setRepository(npmrcFilePath, npmrcRepositoryURL);

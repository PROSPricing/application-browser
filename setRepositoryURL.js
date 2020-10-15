/*
 * Copyright (c) 2020 by PROS, Inc.
 */

var fs = require('fs');
var path = require('path');
var filePath = path.join(__dirname, 'gradle/wrapper/gradle-wrapper.properties');
var repositoryURL = process.argv.slice(2)[0];

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
const request = require('request');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://pdftables.com/api?key=1nda6sg80tjv&format=xlsx-multiple';

class PDF {

    static toXLSX(srcFilePath, encoding) {
        return new Promise((resolve, reject) => {
            //console.log("srcFilePath", srcFilePath);
            request.post({encoding: encoding, url: API_URL},  (err, res, body) => {
                if (!err && res.statusCode === 200) {

                    const names = srcFilePath.split('.');
                    const extension = names[names.length - 1];
                    console.log("extension", extension)
                    const outFilePath = srcFilePath.replace(extension,'xlsx');

                    fs.writeFile(outFilePath, body,  err => {
                        if (err) {
                            console.log('error writing file');
                            console.error(err);
                            reject(err);
                        }
                        resolve(outFilePath);
                    });
                } else {
                    console.log('error retrieving URL');
                    console.error(err);
                    reject(err);
                }
            }).form().append('file',fs.createReadStream(srcFilePath));
        });

    }


}

module.exports = PDF;
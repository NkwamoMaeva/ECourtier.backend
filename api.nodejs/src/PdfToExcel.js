let request = require('request');
let fs = require('fs');

export default class PdfToExcel {

    constructor(filePath, fileOutput){
        this.filePath = filePath;
        this.url = 'https://pdftables.com/api?key=fwe922uerceu&format=xlsx-single';
        this.encoding = null;
        this.fileOutputTarget = fileOutput;
        this.postRequest();
    }

    requestBuilder (){
        return request.post({encoding: this.encoding, url: this.url},  (err, res, body) => {
            if (!err && res.statusCode === 200) {
                fs.writeFile(this.fileOutputTarget, body,  err => {
                    if (err) {
                        console.log('error writing file');
                    }
                });
            } else {
                console.log('error retrieving URL');
                console.error(err);
            }
        });
    }

    postRequest(){
        let form = this.requestBuilder().form()
        form.append('file',fs.createReadStream(this.filePath))
    }



}
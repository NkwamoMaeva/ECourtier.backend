import mv from 'mv';
import TransactionFile from './transactionFile';
import PdfToExcel from "./PdfToExcel";

export default class TransactionsController {

    constructor(_file, _type, _insurer) {
        this.file = _file;
        this.type = _type;
        this.insurer = _insurer;
        //console.log("Trasaction initialised", this.file, this.type, this.insurer);
    }

    uploadFile() {

        const names = this.file.name.split('.');

        /**
         * Get file extension
         *
         * @type {*|string}
         */
        const extension = names[names.length - 1];




        let newFilePath = `data.files/${this.insurer}/${this.type}_${new Date().getTime()}.${extension}`;
        //console.log('newFilePath', newFilePath);

        return new Promise((resolve, reject) => {
            mv(this.file.path, newFilePath, {
                mkdirp: true //this option allow mv module to create all directories in the newPathFile
            }, (err, result)=> {
                if (err)
                    reject(err);
                else {
                    if (extension.toLowerCase() === 'pdf'){
                        let convertedFileTarget = newFilePath.replace(extension,'xlsx');
                        const pdfToExcel = new PdfToExcel(newFilePath,convertedFileTarget);
                        newFilePath = pdfToExcel.fileOutputTarget;
                    }
                    const xlsx_file = new TransactionFile(newFilePath);
                    let timeNumber = String(new Date().getTime());
                    let pos = timeNumber.length - 6;
                    resolve({
                        dataFile: xlsx_file.data,
                        filePath: xlsx_file.filePath,
                        insurer: this.insurer,
                        type: this.type,
                        reference: "".concat(this.type, timeNumber.substring(pos))
                    });
                }
            });
        });

    }
}
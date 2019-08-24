import mv from 'mv';
import TransactionFile from './transactionFile';
import PDF from "./utility.pdf";
export default class TransactionsController {

    constructor() {}

    uploadFile(_file, _type, _insurer, _idInsurer) {
        this.file = _file;
        this.type = _type;
        this.insurer = _insurer;
        this.idInsurer = _idInsurer;
        const names = this.file.name.split('.');
        /**
         * Get file extension
         *
         * @type {*|string}
         */

        const extension = names[names.length - 1];
        let newFilePath = `data/files/${this.insurer}/${this.type}_${new Date().getTime()}.${extension}`;

        return new Promise((resolve, reject) => {
            mv(this.file.tempFilePath, newFilePath, {
                mkdirp: true
            }, (err, result) => {
                if (err)
                    reject(err);

                const xlsxTransaction = (filePath) => {
                    const xlsx_file = new TransactionFile(filePath);
                    let timeNumber = String(new Date().getTime());
                    let pos = timeNumber.length - 6;
                    resolve({
                        dataFile: xlsx_file.data,
                        filePath: xlsx_file.filePath,
                        insurer: this.insurer,
                        idInsurer: this.idInsurer,
                        type: this.type,
                        reference: ''.concat(this.type, timeNumber.substring(pos))
                    });
                }

                if (extension.toLowerCase() === 'pdf') {
                    PDF.toXLSX(newFilePath, null)
                        .then(outFilePath => {
                            newFilePath = outFilePath;
                            xlsxTransaction(newFilePath);
                        })
                        .catch(reason => reject(reason));
                } else {
                    xlsxTransaction(newFilePath);
                }

            });
        });

    }

    getAllTransaction() {
        return new Promise((resolve, reject) => {
            db.connect(function(res, err) {
                db.query(`
                    SELECT 
                    t.id, t.reference, t.creation_date, t.amount,
                    t.last_update, t.idUser, t.idTransaction_type,
                    t.idInsurer, i.short_name
                    FROM transactions t
                    JOIN insurers i ON i.id = t.idInsurer
                    `,
                    function(err, result, fields) {
                        if (err)
                            return reject(err)
                        resolve(result);
                    });
            })
        })
    }

}
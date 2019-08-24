import UtilityDto from './utility.dto';
import TransactionsController from './transactions.controller';
export default class TransactionsRoutes {

    constructor(_server) {
        this.server = _server;
        this.newTransaction();
    }

    newTransaction() {
        this.server.post('/transactions/upload', (req, res, next) => {
            let file = req.files.transactionFile;
            let insurer = req.body.insurer;
            let idInsurer = req.body.idInsurer;
            let type = req.body.transactionType;

            if (typeof file === 'object') {
                try {
                    const transaction = new TransactionsController(file, type, insurer);
                    transaction.uploadFile().then(data => {
                        UtilityDto.successResponse(res, "Successfully upload file", data);
                    });
                } catch (e) {
                    UtilityDto.internalServerErrorResponse(res, e.message);
                }
            } else {
                UtilityDto.badRequestResponse(res, "Invalid file sent !");
            }
            return next();
        });
    }
    getTransaction() {

    }
}
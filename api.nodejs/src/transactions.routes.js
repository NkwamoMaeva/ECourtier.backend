import UtilityDto from './utility.dto';
import TransactionsController from './transactions.controller';

export default class TransactionsRoutes {

    constructor(_server) {
        this.server = _server;
        this.newTransaction();
        //console.log("UtilityDto", UtilityDto);
    }

    newTransaction() {
        this.server.post('/transactions', (req, res, next) => {

            //console.log(req)
            //res.send(200, req.files);
            if(typeof req.files.transactionFile === 'object') {
                try {
                    const transaction = new TransactionsController(req.files.transactionFile, req.params.transactionType || 1, req.params.insurer || "Primonial");
                    transaction.uploadFile().then(data => {
                        //console.log("Upload File", data);
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
}
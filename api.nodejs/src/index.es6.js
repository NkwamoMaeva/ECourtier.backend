import express from 'express';
import UtilityDto from './utility.dto';
import TransactionsController from './transactions.controller';
import InsurersController from './insurances.controller';
// import restifyCors from 'restify-cors-middleware';
import path from 'path';
import TransactionsRoutes from './transactions.routes';
// import UsersRoutes from './user.routes';
import mysql from 'mysql';
import config from './config'
import fileUpload from 'express-fileupload';
import querystring from 'querystring'
import bodyparser from 'body-parser'
// import corsMiddleware from 'restify-cors-middleware';

// const cors = corsMiddleware({
//     preflightMaxAge: 5, //Optional
//     origins: ['http://api.myapp.com', 'http://web.myapp.com'],
//     allowHeaders: ['API-Token'],
//     exposeHeaders: ['API-Token-Expiry']
// })

/**
 * Creating server
 *
 * @type {Server}
 */
// const server = restify.createServer({
//     name: 'eCourtierApiCore'
// });

// //CORS
// const cors = restifyCors({
//     origins: ['*'],
//     preflightMaxAge: 86400,
//     allowHeaders: [
//         'Content-Type',
//         'Authorization',
//         'Content-Length',
//         'X-Request-Width',
//         'Accept',
//         'x-parse-application-id',
//         'x-parse-rest-api-key',
//         'x-parse-session-token'
//     ],
//     exposeHeaders: [],
//     credentials: false
// });
const server = express()
// server.pre(cors.preflight);
// server.use(cors.actual);

//This plugin deduplicates extra slashes found in the URL.
// server.pre(restify.plugins.pre.dedupeSlashes());

//This plugin parses the Accept header, and ensures that the server can respond to what the client asked for.
// server.use(restify.plugins.acceptParser(server.acceptable));

// server.use(restify.plugins.queryParser());
// server.use(restify.plugins.bodyParser());

const routes = {
    transactions: new TransactionsRoutes(server),
    // user: new UsersRoutes(server)
};

let db = mysql.createConnection(config.ldb)

server.use(bodyparser.urlencoded({limit: '50mb', extended: true}));
server.use(bodyparser.json());
server.use(bodyparser());
server.use(fileUpload({
    limits: {fileSize: 50 * 1024 * 1024},
    useTempFiles: true,
}));
server.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE'); // If needed
    res.header('Access-Control-Allow-Headers', 'Content-Type'); // If needed
    next();
})
    .get('/login/:username/:password', (req, res) => {
        let username = req.params["username"]
        let password = req.params["password"]
        login(username, password).then(result => {
            res.send(result);
        })
    })


    .post('/upload', (req, res) => {
        let file = req.files.transactionFile;
        let insurer = req.body.insurer;
        let idInsurer = req.body.idInsurer;
        let type = req.body.transactionType;
        // try {
        const transaction = new TransactionsController();
        transaction.uploadFile(file, type, insurer, idInsurer).then(data => {
            res.send(data);
        });
    })
    .post('/transaction/add', (req, res) => {
        let data = req.body.data;
        let date = new Date();

        let lastUpdate = data.last_update.replace('T', ' ').split('.')[0]
        let creatonDate = data.creation_date.replace('T', ' ').split('.')[0]
        let transaction = {
            'idInsurer': data.idInsurer,
            'idTransaction_type': data.idTransaction_type,
            'reference': data.reference,
            'amount': data.amount,
            'last_update': lastUpdate,
            'creation_date': creatonDate,
            'idUser': data.idUser,
        }
        let newDataFile = data.data_file.replace(/"/g, '|')
        let newColumns = data.columns.replace(/"/g, '|')
        let file = {
            'columns': newColumns,
            'path_file': data.path_file,
            'data_file': newDataFile,
            'idTransaction': null
        }
        insert('transactions', transaction).then(result => {
            file.idTransaction = result.insertId;
            insert('files', file).then(res2 => {
                alterAssureur(data['eltToUpdate'], data['valueToUpdate'], transaction.idInsurer).then(result2 => {
                    res.send(result);
                })
            })
        })
    })
    .get('/transaction/get', (req, res) => {
        selectAllTransaction().then(result => {
            res.send(result);
        })
    })
    .delete('/transaction/delete', (req, res) => {
        let ids = JSON.parse(req.body.data);
        Delete(ids, 'id', 'transactions').then(result => {
            Delete(ids, 'idTransaction', 'files').then(result2 => {
                res.send(result);
            })
        })
    })
    .post('/transaction/update/:id', (req, res) => {
        let id = req.params['id']
        let data = req.body.data;

        let lastUpdate = data.last_update.replace('T', ' ').split('.')[0]
        let creatonDate = data.creation_date.replace('T', ' ').split('.')[0]
        let transaction = {
            'idInsurer': data.idInsurer,
            'idTransaction_type': data.idTransaction_type,
            'reference': data.reference,
            'amount': data.amount,
            'last_update': lastUpdate,
            'creation_date': creatonDate,
            'idUser': data.idUser,
        }
        let newDataFile = data.data_file.replace(/"/g, '|')
        let newColumns = data.columns.replace(/"/g, '|')
        let file = {
            'columns': newColumns,
            'path_file': data.path_file,
            'data_file': newDataFile,
            'idTransaction': null
        }
        updateAll('transactions', transaction, 'id', id).then(result => {
            file.idTransaction = id;
            updateAll('files', file, 'path_file', data.path_file).then(result2 => {
                alterAssureur(data['eltToUpdate'], data['valueToUpdate'], transaction.idInsurer).then(result3 => {
                    res.send(result);
                })
            })
        })
    })
    .get('/transaction/get/:id', (req, res) => {
        let id = req.params["id"]
        selectTransactionById(id).then(result => {
            res.send(result[0]);
        })
    })

    .get('/transaction/getByInsurer/:id', (req, res) => {
        let id = req.params["id"]
        selectTransactionByInsurerId(id).then(result => {
            res.send(result);
        })
    })

    .get('/transaction/getByType/:id', (req, res) => {
        let id = req.params["id"]
        selectTransactionByType(id).then(result => {
            res.send(result);
        })
    })

    .get('/transaction/:startDate/:endDate', (req, res) => {
        let startDate = req.param("startDate");
        let endDate = req.param("endDate");
        selectByPeriod(startDate, endDate).then(result => {
            res.send(result);
        })
    })
    .post('/insurer', (req, res) => {
        let file = req.files.image;
        let dues = req.body.dues;
        let regles = req.body.regles;
        let description = req.body.description;
        let short_name = req.body.short_name;

        // console.log(file);
        const insurer = new InsurersController();
        insurer.uploadFile(file, regles, dues, short_name, description).then(data => {
            // console.log(data)
            // res.send(data);
            insert('insurers', data).then(result => {
                res.send(result);
            })
        });
        // let data = req.body.insurer;
        // insert('insurers', data).then(result => {
        //     res.send(result);
        // })
    })
    .put('/insurer/update/:id', (req, res) => {
        let id = req.param("id");
        let short_name = req.param("short_name");
        let description = req.param("description");
        let image_path = req.param("image_path");
        let dues = req.param("dues");
        let regles = req.param("regles");

        return new Promise((resolve, reject) => {
            db.connect(function (res, err) {
                db.query(`
                UPDATE insurers SET short_name = ${short_name},
                                    description = ${description},
                                    image_path = ${image_path},
                                    dues = ${dues},
                                    regles = ${regles}
                                WHERE id = ${id}
                `);
            })
        })

    })
    .get('/insurer/paid', (req, res) => {
        selectPaid().then(result => {
            res.send(result[0])
        })
    })
    .get('/insurer/unpaid', (req, res) => {
        selectUnpaid().then(result => {
            res.send(result[0])
        })
    })
    .get('/insurer/paid/:id', (req, res) => {
        selectPaidByInsurer(req.param("id")).then(result => {
            res.send(result[0])
        })
    })
    .get('/insurer/unpaid/:id', (req, res) => {
        selectUnpaidByInsurer(req.param("id")).then(result => {
            res.send(result[0])
        })
    })
    .delete('/insurer/delete', (req, res) => {
        let ids = JSON.parse(req.body.data);
        Delete(ids, 'id', 'insurers').then(result => {
            res.send(result);
        })
    })
    .post('/insurer/:id', (req, res) => {
        let id = req.param("id")
    })
    .get('/insurer', (req, res) => {
        select('insurers').then(result => {
            res.send(result);
        })
    })
    .post('/transactionTypes', (req, res) => {
        select('transaction_types')
    })
    .listen(9001, function () {
        console.log('Service started at port 9001')
    });

/*
function insertTest(data) {
    return new Promise((resolve, reject) => {
        let keys = Object.keys(data);

        db.connect(function (res, err) {
            let query = `INSERT INTO test (data) VALUE("${data}")`
            db.query(query, function (err, result, fields) {
                if (err)
                    return reject(err)
                resolve(result)
            });
        })
    })
}
*/

function select(table) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`SELECT * FROM ${table}`, function (err, result, fields) {
                if (err)
                    return reject(err)
                resolve(result);
            });
        })
    })
}

function alterAssureur(fieldToUpdate, newValue, id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(
                `
              UPDATE insurers
              SET ${fieldToUpdate} = ${newValue}
              WHERE id = ${id}
            `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}


function updateAll(table, elt, referenceField, referenceValue) {
    let keys = Object.keys(elt);
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            let query = `UPDATE ${table} SET `
            keys.forEach(element => {
                query += `${element} = "${elt[element]}", `
            });
            query = query.slice(0, query.length - 2)
            query += ` WHERE ${referenceField} = "${referenceValue}"`
            console.log(query)
            db.query(query, function (err, result, fields) {
                if (err)
                    return reject(err)
                resolve(result)
            });
        })
    })
}

function selectAllTransaction() {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                        SELECT t.id,
                               t.reference,
                               t.creation_date,
                               t.amount,
                               t.last_update,
                               t.idUser,
                               t.idTransaction_type,
                               t.idInsurer,
                               i.short_name,
                               f.path_file
                        FROM transactions t
                                 JOIN insurers i ON i.id = t.idInsurer
                                 JOIN files f ON f.idTransaction = t.id
                `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}

function selectTransactionById(id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT 
                t.id, t.reference, t.creation_date, t.amount,
                t.last_update, t.idUser, t.idTransaction_type,
                t.idInsurer, i.short_name,
                f.path_file,
                f.columns,
                f.data_file
                FROM transactions t
                JOIN insurers i ON i.id = t.idInsurer
                JOIN files f ON f.idTransaction = t.id
                WHERE t.id = "${id}"
                `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}

function selectTransactionByInsurerId(id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT 
                t.id, t.reference, t.creation_date, t.amount,
                t.last_update, t.idUser, t.idTransaction_type,
                t.idInsurer, i.short_name,
                f.path_file,
                f.columns,
                f.data_file
                FROM transactions t
                JOIN insurers i ON i.id = t.idInsurer
                JOIN files f ON f.idTransaction = t.id
                WHERE t.idInsurer = "${id}"
                `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}

function selectTransactionByType(id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT 
                t.id, t.reference, t.creation_date, t.amount,
                t.last_update, t.idUser, t.idTransaction_type,
                t.idInsurer, i.short_name,
                f.path_file,
                f.columns,
                f.data_file
                FROM transactions t
                JOIN insurers i ON i.id = t.idInsurer
                JOIN files f ON f.idTransaction = t.id
                WHERE t.idTransaction_type = "${id}"
                `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}

function selectPaid() {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT SUM(amount) as totat FROM transactions WHERE idTransaction_type = 1 
                `, function (err, result, fields) {
                if (err)
                    return reject(err);
                resolve(result);
            })
        });
    })
}

function selectPaidByInsurer(id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT SUM(amount) as totat FROM transactions WHERE idInsurer = ${id} AND idTransaction_type = 1 
                `, function (err, result, fields) {
                if (err)
                    return reject(err);
                resolve(result);
            })
        });
    })
}

function selectUnpaid() {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT SUM(amount) as totat FROM transactions WHERE idTransaction_type = 2 
                `, function (err, result, fields) {
                if (err)
                    return reject(err);
                resolve(result);
            })
        });
    })
}

function selectUnpaidByInsurer(id) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                SELECT SUM(amount) as totat FROM transactions WHERE idInsurer = ${id} AND idTransaction_type = 2 
                `, function (err, result, fields) {
                if (err)
                    return reject(err);
                resolve(result);
            })
        });
    })
}

function Delete(ids, reference, table) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
                DELETE FROM ${table} 
                WHERE ${reference} IN (${ids})
                `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
        })
    })
}

function insert(table, data) {
    return new Promise((resolve, reject) => {
        let keys = Object.keys(data);

        db.connect(function (res, err) {
            let query = `INSERT INTO ${table} (id`
            keys.forEach(element => {
                query += `, ${element}`
            });
            query += `) VALUES(${null}`

            keys.forEach(element => {
                query += `, "${data[element]}"`
            });
            query += `)`
            db.query(query, function (err, result, fields) {
                if (err)
                    return reject(err)
                resolve(result)
            });
        })
    })
}

function selectByPeriod(startDate, endDate) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`
            SELECT 
            t.id, t.reference, t.creation_date, t.amount,
            t.last_update, t.idUser, t.idTransaction_type,
            t.idInsurer, i.short_name
            FROM transactions t
            JOIN insurers i ON i.id = t.idInsurer
            WHERE creation_date BETWEEN "${startDate}" AND "${endDate}"
            `,
                function (err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result)
                });
        })
    })
}

function login(username, password) {
    return new Promise((resolve, reject) => {
        db.connect(function (res, err) {
            db.query(`SELECT * FROM users WHERE username = "${username}" AND password = "${password}"`,
                function (err, result, fields) {
                    if (err) {
                        return reject(err)
                    }
                    resolve(result)
                });
        })
    })
}
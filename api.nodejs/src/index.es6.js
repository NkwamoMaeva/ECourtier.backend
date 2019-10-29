const express = require('express');
const Sequelize = require('sequelize');
const bodyparser = require('body-parser');
const mv = require('mv');
const Model = Sequelize.Model;
const Op = Sequelize.Op;
const PDF = require("./utility.pdf");
const md5 = require("md5");
const multer = require('multer');
const TransactionFile = require('./TransactionFile');
const upload = multer({
    dest: '/data/'
});
//const TransactionsController = require('./transactions.controller');
const server = express();
const fileUpload = require('express-fileupload');
let port = 9001;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/database.sqlite'
});

const intervals = [
    [1, 3],
    [4, 6],
    [7, 9],
    [10, 12]
];

server
    .use(bodyparser.urlencoded({limit: '64mb', extended: true}))

    .use(bodyparser.json())

    .use(bodyparser())

    .use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    })

    .get('/', (req, res) => {

        User.findAll().then(users => {
            res.send(JSON.stringify(users, null, 4));
        });
    })

    .post('/login', (req, res) => {

        const request = req.body;


        let answer;
        if (request !== undefined && request.username !== undefined && request.password !== undefined) {
            const username = request.username;
            const password = md5(request.password);


            login(username, password).then(result => {

                if (result.toString() !== '') {

                    res.send(JSON.stringify(result, null, 4));
                }
            }).catch(_ => {
                let msg = null;
                res.send(JSON.stringify(msg, null, 4));
            });

        } else {

            answer = null;
            res.send(JSON.stringify(answer, null, 4));
        }

    })

    .post('/register', (req, res) => {

        const request = req.body;
        let answer;

        if (request !== undefined && request.username !== undefined && request.password !== undefined && request.name !== undefined && request.company !== undefined) {

            const username = request.username;
            const password = request.password;
            const name = request.name;
            const company = request.company;

            if (username.length !== 0 && password.length !== 0 && name.length !== 0 && !isNaN(company)) {

                Company.findAll({
                    where: {
                        id: company
                    }
                }).then(companies => {

                    if (companies.length !== 0) {

                        register(username, md5(password), name, company).then(result => {

                            if (result.toString() !== '') {

                                res.send(JSON.stringify(result, null, 4));
                            }

                        }).catch(_ => {
                            let msg = null;
                            res.send(JSON.stringify(msg, null, 4));
                        })

                    } else {
                        answer = null;
                        res.send(JSON.stringify(answer, null, 4));
                    }

                });

            } else {
                answer = null;
                res.send(JSON.stringify(answer, null, 4));
            }

        } else {
            answer = null;
            res.send(JSON.stringify(answer, null, 4));
        }

    })

    .post('/transaction', (req, res) => {
        const request = req.body;

        if (request !== undefined && request.idInsurer !== undefined && request.reference !== undefined &&
            request.idTransaction_type !== undefined && request.amount !== undefined &&
            request.idUser !== undefined && request.path_file !== undefined && request.columns !== undefined &&
            request.data_file !== undefined && request.creation_date !== undefined && request.last_update !== undefined
        ) {

            const insurer = request.idInsurer;
            const reference = request.reference;
            const type = request.idTransaction_type;
            const amount = request.amount;
            const user = request.idUser;

            const columns = request.columns;
            const path = request.path_file;
            const data = request.data_file;

            addTransaction(insurer, user, type, amount, reference, [columns, path, data]).then(result => {
                if (result.toString() !== '') {

                    console.log("Save done !");
                    res.send(JSON.stringify(result, null, 4));

                }
            }).catch(err => {

                console.log(err);
                res.send(JSON.stringify(err, null, 4));

            });

        } else {

            console.log("Params error !");
            res.send(JSON.stringify(null, null, 4));

        }

    })

    .put('/transaction/update/:id', (req, res) => {
        const request = req.body;
        const id = req.params.id;

        if (request !== undefined && request.idInsurer !== undefined && request.reference !== undefined &&
            request.idTransaction_type !== undefined && request.amount !== undefined && req.params.id !== undefined &&
            request.idUser !== undefined && request.path_file !== undefined && request.columns !== undefined &&
            request.data_file !== undefined && request.creation_date !== undefined && request.last_update !== undefined
        ) {

            const id = req.params.id;
            const reference = request.reference;
            const amount = request.amount;

            const columns = request.columns;
            const path = request.path_file;
            const data = request.data_file;

            updateTransaction(id, reference, amount, [columns, path, data]).then(result => {
                if (result.toString() !== '') {

                    console.log("Saving error !");
                    res.send(JSON.stringify(result, null, 4));

                }
            }).catch(err => {

                console.log(err);
                res.send(JSON.stringify(err, null, 4));

            });

        } else {

            console.log("Params error !");
            res.send(JSON.stringify(null, null, 4));

        }
    })

    .post('/insurer/add', upload.single('image'), (req, res) => {

        addInsurer(req).then(result => {
            res.send(JSON.stringify(result, null, 4));
        });

    })

    .post('/upload', upload.single('transactionFile'), (req, res) => {


        uploadTransaction(req).then(result => {
            res.send(JSON.stringify(result, null, 4));
        });

    })

    .get('/transaction', (req, res) => {

        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }


        Transaction.findAll({
            where: {
                creation_date: {
                    [Op.between]: [start_date, end_date]
                }
            },
            include: [
                {model: TransactionType},
                {model: Insurer},
                {model: File}
            ]
        }).then(transactions => {
            res.send(JSON.stringify(transactions, null, 4));
        }).catch(err => {

        })
    })

    .get('/transaction/:id', (req, res) => {
        const id = req.params.id;
        Transaction.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            include: [
                {model: TransactionType},
                {model: File},
                {model: Insurer}
            ]
        }).then(transaction => {
            res.send(JSON.stringify(transaction.TransactionType, null, 4));
        }).catch(err => {

        })
    })

    .delete('/transaction/delete', (req, res) => {
        const ids = req.body.id;

        Transaction.destroy({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        }).then(_ => {
            res.send(JSON.parse('{"message":"Transactions deleted !"}'));
        });
    })

    .get('/insurer', (req, res) => {
        Insurer.findAll().then(insurers => {
            res.send(JSON.stringify(insurers, null, 4));
        });
    })

    .get('/insurer/paid', (req, res) => {

        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }

        Insurer.findOne({
            where: {
                id: {
                    [Op.eq]: parseInt(req.body.insurer)
                }
            }
        }).then(insurer => {
            if (insurer != null) {
                Transaction.findAll({
                    where: {
                        insurer_id: {
                            [Op.eq]: insurer.id
                        },
                        creation_date: {
                            [Op.between]: [start_date, end_date]
                        }, transaction_type_id: {
                            [Op.eq]: 2
                        }
                    },
                    include: [
                        {model: TransactionType},
                        {model: Insurer},
                        {model: File}
                    ]
                }).then(transactions => {
                    res.send(JSON.stringify(transactions, null, 4));
                }).catch(err => {
                    console.log(err);
                })
            }
        }).catch(err => {
            console.log(err);
        });

    })

    .get('/insurer/unpaid', (req, res) => {

        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }

        Insurer.findOne({
            where: {
                id: {
                    [Op.eq]: parseInt(req.body.insurer)
                }
            }
        }).then(insurer => {
            if (insurer != null) {
                Transaction.findAll({
                    where: {
                        insurer_id: {
                            [Op.eq]: insurer.id
                        },
                        creation_date: {
                            [Op.between]: [start_date, end_date]
                        }, transaction_type_id: {
                            [Op.eq]: 1
                        }
                    },
                    include: [
                        {model: TransactionType},
                        {model: Insurer},
                        {model: File}
                    ]
                }).then(transactions => {
                    res.send(JSON.stringify(transactions, null, 4));
                }).catch(err => {
                    console.log(err);
                })
            }
        }).catch(err => {
            console.log(err);
        });

    })

    .get('/insurer/:id', (req, res) => {
        const id = req.params.id;
        Insurer.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        }).then(insurer => {
            res.send(JSON.stringify(insurer, null, 4));
        });
    })

    .delete('/insurer/delete', (req, res) => {
        const ids = req.body.id;

        Insurer.destroy({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        }).then(_ => {
            res.send(JSON.parse('{"message":"Insurers deleted !"}'));
        });
    })

    .get('/transaction_paid', (req, res) => {
        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }

        Transaction.findAll({
            where: {
                transaction_type_id: {
                    [Op.eq]: 2
                },
                creation_date: {
                    [Op.between]: [start_date, end_date]
                }
            }
        }).then(transactions => {
            let amount = 0.0;
            transactions.forEach(transaction => {
                amount += parseFloat(transaction.amount);
            });
            res.send(JSON.stringify(amount, null, 4));
        }).catch(err => {

        })
    })


    .get('/transaction_unpaid', (req, res) => {
        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }

        Transaction.findAll({
            where: {
                transaction_type_id: {
                    [Op.eq]: 1
                },
                creation_date: {
                    [Op.between]: [start_date, end_date]
                }
            }
        }).then(transactions => {
            let amount = 0.0;
            transactions.forEach(transaction => {
                amount += parseFloat(transaction.amount);
            });
            res.send(JSON.stringify(amount, null, 4));
        }).catch(err => {

        })
    })


    .get('/transaction_paid/listed', (req, res) => {

        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }

        const id = req.params.id;
        Transaction.findAll({
            where: {
                transaction_type_id: {
                    [Op.eq]: 1
                }, creation_date: {
                    [Op.between]: [start_date, end_date]
                }
            }, include: [
                {model: File}
            ]
        }).then(transactions => {
            let amount = 0.0;
            transactions.forEach(transaction => {
                if (transaction.file != null) {
                    amount += parseFloat(transaction.amount);
                }
            });
            res.send(JSON.stringify(amount, null, 4));
        }).catch(err => {

        })
    })

    .get('/transaction_paid/unlisted', (req, res) => {
        const id = req.params.id;
        let start_date = checkDateTrimester(new Date())[0];
        let end_date = checkDateTrimester(new Date())[1];

        if (req.body.start_date !== undefined) {
            start_date = toDate(req.body.start_date);
        }

        if (req.body.end_date !== undefined) {
            end_date = toDate(req.body.end_date);
        }
        Transaction.findAll({
            where: {
                transaction_type_id: {
                    [Op.eq]: 1
                }, creation_date: {
                    [Op.between]: [start_date, end_date]
                }
            }, include: [
                {model: File}
            ]
        }).then(transactions => {
            let amount = 0.0;
            transactions.forEach(transaction => {
                if (transaction.file == null) {
                    amount += parseFloat(transaction.amount);
                }
            });
            res.send(JSON.stringify(amount, null, 4));
        }).catch(err => {

        })
    })

    .get('/transaction_type', (req, res) => {
        TransactionType.findAll().then(types => {
            res.send(JSON.stringify(types, null, 4));
        })
    })
    .listen(port, _ => {
        console.log("Server started at port " + port);
        sequelize.authenticate().then(_ => {
            const tables = [];
            sequelize.modelManager.forEachModel(m => {
                if (m.options.doNotSync !== true) {
                    tables.push(m);
                }
            });

            Sequelize.Promise.each(tables, t => {
                return t.sync({force: false});
            }).then(_ => {
                Company.create({
                    short_name: 'E-CONSEIL',
                    head_office: 'DOUALA'
                }).then(_ => {
                    TransactionType.create({
                        intitule: 'Bordereau'
                    }).then(_ => {
                        TransactionType.create({
                            intitule: 'Commission'
                        }).then(_ => {
                            console.log("Data created");
                        })
                    })
                }).catch(err => {


                });
            });

        }).catch(err => {
            console.log("Error while connecting to the database! " + err);
        });


    });


function checkDateTrimester(date) {
    let month = date.getMonth() + 1;
    let answer = [];

    if (month >= 1 && month <= 3)
        answer = [date.getFullYear() + '-01-01', date.getFullYear() + '-03-31'];
    else if (month >= 4 && month <= 6)
        answer = [date.getFullYear() + '-04-01', date.getFullYear() + '-06-30'];
    else if (month >= 7 && month <= 9)
        answer = [date.getFullYear() + '-07-01', date.getFullYear() + '-09-30'];
    else if (month >= 10 && month <= 12)
        answer = [date.getFullYear() + '-10-01', date.getFullYear() + '-12-31'];

    return answer;
}

function toDate(dateStr) {
    let parts = dateStr.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function login(username, password) {
    return new Promise((resolve, reject) => {
        User.findOne({
            where: {
                username: username,
                password: password
            },
            include: [
                {
                    model: Company
                }
            ]
        }).then(user => {
            resolve(user);
        }).catch(err => {
            return reject(err);
        });
    })
}


function register(username, password, name, company) {
    return new Promise(((resolve, reject) => {
        User.create({
            password: password,
            username: username,
            displayed_name: name,
            company_id: company
        }).then(user => {

            User.findOne({
                where: {
                    id: user.id
                },
                include: [
                    {
                        model: Company
                    }
                ]
            }).then(user => {
                resolve(user);
            }).catch(err => {
                return reject(err);
            });

        }).catch(err => {
            return reject(err);
        })
    }))
}


function addTransaction(idInsurer, user, idTransaction_type, amount, reference, arr) {
    return new Promise((resolve, reject) => {
        Transaction.create({
            reference: reference,
            amount: amount,
            insurer_id: idInsurer,
            transaction_type_id: idTransaction_type,
            user_id: user,
        }).then(transaction => {
            if (arr.length >= 3) {
                const columns = arr[0];
                const path = arr[1];
                const data = arr[2];

                File.create({
                    path_file: path,
                    data_file: data,
                    columns: columns,
                    id_transaction: transaction.id
                }).then(transaction_ => {
                    return resolve(transaction_);
                })

            }
            return resolve(transaction);
        }).catch(err => {
            return reject(err);
        });
    });
}

function updateTransaction(id, reference, amount, arr) {
    return new Promise((resolve, reject) => {
        Transaction.update({
            reference: reference,
            amount: amount,
        }, {
            where: {
                id: id
            }
        }).then(_ => {
            Transaction.findOne(
                {
                    include: [
                        {model: File}
                    ],
                    where: {id: id}
                }
            ).then(transaction => {
                console.log(transaction);
                if (arr.length >= 3) {
                    const columns = arr[0];
                    const path = arr[1];
                    const data = arr[2];

                    File.update({
                        path_file: path,
                        data_file: data,
                        columns: columns
                    }, {

                        where: {
                            id_transaction: transaction.id
                        }
                    }).then(_ => {
                        return resolve(transaction);
                    })

                }
                return resolve(transaction);
            });
        }).catch(err => {
            return reject(err);
        });
    });
}

function uploadTransaction(param) {
    const insurer = param.body.insurer;
    const insurer_id = parseInt(param.body.idInsurer);
    const type_id = parseInt(param.body.transactionType);
    const file_ = param.file;

    const names = file_.originalname.split('.');
    const extension = names[names.length - 1];
    const tmp_path = file_.path;
    let newFilePath = `data/files/${insurer}/${type_id}_${new Date().getTime()}.${extension}`;

    return new Promise((resolve, reject) => {

        mv(tmp_path, newFilePath, {
            mkdirp: true
        }, (err, result) => {
            if (err)
                reject(err);
            else {
                const xlsxTransaction = (filePath) => {
                    const xlsx_file = new TransactionFile(filePath);
                    let timeNumber = String(new Date().getTime());
                    let pos = timeNumber.length - 6;
                    resolve({
                        dataFile: xlsx_file.data,
                        filePath: xlsx_file.filePath,
                        insurer: insurer,
                        idInsurer: insurer_id,
                        type: type_id,
                        reference: ''.concat(`${type_id}`, timeNumber.substring(pos))
                    });
                };

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
            }
        });

    });
}

function addInsurer(param) {

    const short_name = param.body.short_name;
    const description = param.body.description;
    const dues = parseFloat(param.body.dues);
    const regles = parseFloat(param.body.regles);

    const file_ = param.file;

    const names = file_.originalname.split('.');
    const extension = names[names.length - 1];
    const tmp_path = file_.path;
    const newFilePath = `data/picture/${short_name}/${short_name}_${new Date().getTime()}.${extension}`;

    return new Promise((resolve, reject) => {
        mv(tmp_path, newFilePath, {
            mkdirp: true
        }, (err, result) => {
            if (err)
                reject(err);
            else {

                Insurer.create({
                    short_name: short_name,
                    description: description,
                    image_path: newFilePath,
                    dues: dues,
                    regles: regles,
                }).then(insurer => {
                    resolve(insurer)
                }).catch(err => {
                    reject(err)
                })
            }
        });
    });

}

class User extends Model {
}

User.init({
    // attributes
    password: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    displayed_name: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    registration_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date()
    },
    image_path: {
        type: Sequelize.STRING(1000),
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'users',
    timestamps: false
});

class Company extends Model {
}

Company.init({
    short_name: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
    },
    head_office: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
    },
}, {
    sequelize,
    modelName: 'companies',
    timestamps: false
});

User.belongsTo(Company, {foreignKey: 'company_id'});

class TransactionType extends Model {
}

TransactionType.init({
    intitule: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    sequelize,
    modelName: 'transaction_types',
    timestamps: false
});


class Insurer extends Model {
}

Insurer.init({
    short_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    description: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    image_path: {
        type: Sequelize.STRING(1000),
        allowNull: true
    },
    dues: {
        type: Sequelize.DECIMAL,
        allowNull: false
    },
    regles: {
        type: Sequelize.DECIMAL,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'insurers',
    timestamps: false
});


class Transaction extends Model {

}

Transaction.init({
    reference: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
    },
    creation_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date()
    },
    amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
    },
    last_update: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: new Date()
    }
}, {
    sequelize,
    modelName: 'transactions',
    timestamps: false

});

Transaction.belongsTo(User, {foreignKey: 'user_id'});
Transaction.belongsTo(TransactionType, {foreignKey: 'transaction_type_id'});
Transaction.belongsTo(Insurer, {foreignKey: 'insurer_id'});

class File extends Model {
}

File.init({
    path_file: {
        type: Sequelize.STRING(1000),
        allowNull: false
    },
    data_file: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    columns: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'files',
    timestamps: false
});

File.belongsTo(Transaction, {foreignKey: 'id_transaction'});
Transaction.hasOne(File, {foreignKey: 'id_transaction'});
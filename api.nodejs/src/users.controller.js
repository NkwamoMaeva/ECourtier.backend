import mv from 'mv';
export default class UserController {

    constructor() {}

    login(username, password) {
        return new Promise((resolve, reject) => {
            db.connect(function(res, err) {
                db.query(`SELECT * FROM users WHERE username = "${username}" AND password = "${password}"`,
                    function(err, result, fields) {
                        if (err) {
                            return reject(err)
                        }
                        resolve(result)
                    });
            })
        })
    }

    getTransaction() {
        let query =
            `
        SELECT 
            t.id,
            t.reference, 
            t.creation_date, 
            t.amount,
            t.last_update,
            t.idUser,
            t.idTransaction_type,
            t.idInsurer, 
            i.short_name
        FROM transactions t
        JOIN 
            insurers i
        ON 
            i.id = t.idInsurer
        `
        return new Promise((resolve, reject) => {
            index.connection().then(res => {
                console.log('je suis la')
            })
            db.connect(function(res, err) {
                db.query(query, function(err, result, fields) {
                    if (err)
                        return reject(err)
                    resolve(result);
                });
            })
        })
    }
}
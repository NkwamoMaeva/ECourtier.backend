import restify from 'restify';
import restifyCors from 'restify-cors-middleware';
import TransactionsRoutes from './transactions.routes';


/**
 * Creating server
 *
 * @type {Server}
 */
const server = restify.createServer({
    name: 'eCourtierApiCore'
});


//CORS
const cors = restifyCors({
    origins: ['*'],
    preflightMaxAge: 86400,
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'Content-Length',
        'X-Request-Width',
        'Accept',
        'x-parse-application-id',
        'x-parse-rest-api-key',
        'x-parse-session-token'
    ],
    exposeHeaders: [],
    credentials: false
});

server.pre(cors.preflight);
server.use(cors.actual);

//This plugin deduplicates extra slashes found in the URL.
server.pre(restify.plugins.pre.dedupeSlashes());

//This plugin parses the Accept header, and ensures that the server can respond to what the client asked for.
server.use(restify.plugins.acceptParser(server.acceptable));

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());


const routes = {
    transactions: new TransactionsRoutes(server)
};
server.get({name: 'home', path: '/'}, function (req, res, next) {
    console.log(req);
    res.header('content-type', 'json');
    res.send({hello: 'world'});
    next();
})


/**
 * Starting server
 */
server.listen(9001, _ => console.log(`${server.name} is started and listen port 9001 !`));
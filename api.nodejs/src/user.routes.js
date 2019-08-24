import UtilityDto from './utility.dto';
import UsersController from './usertions.controller';
export default class UsersRoutes {

    constructor(_server) {
        this.server = _server;
        this.newAuthentication();
        //console.log("UtilityDto", UtilityDto);
    }

    newAuthentication() {
        this.server.post('/login/:username/:password', (req, res, next) => {
            let username = req.params["username"]
            let password = req.params["password"]
            login(username, password).then(result => {
                res.send(result);
            })

            try {
                const user = new UserController();
                user.login(username, password).then(data => {
                    UtilityDto.successResponse(res, "Successfully upload file", data);
                });
            } catch (e) {
                UtilityDto.internalServerErrorResponse(res, e.message);
            }
            return next();
        });
    }
}
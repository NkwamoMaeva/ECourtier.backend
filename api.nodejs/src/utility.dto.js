export default class UtilityDto {
    constructor() {}

    response({success, errorCode, message, data}) {

    }

    static addCors(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
        res.setHeader('Access-Control-Allow-Credentials', true);
    }

    static successResponse(response, message, data = null) {
        UtilityDto.addCors(response);
        response.status(200);
        response.json({
            success: true,
            errorCode: null,
            message: message,
            data: data
        });
    }

    static unexpectedResponse(response, message, code = 3) {
        UtilityDto.addCors(response);
        response.status(200);
        response.json({
            success: false,
            errorCode: code,
            message: message,
            data: null
        });
    }
    static badRequestResponse(response, message, code = 3) {
        UtilityDto.addCors(response);
        response.status(200);
        response.json({
            success: false,
            errorCode: code,
            message: message,
            data: null
        });
    }

    static internalServerErrorResponse(response, message, code = 5) {
        UtilityDto.addCors(response);
        response.status(500);
        response.json({
            success: false,
            errorCode: code,
            message: message,
            data: null
        });
    }
}
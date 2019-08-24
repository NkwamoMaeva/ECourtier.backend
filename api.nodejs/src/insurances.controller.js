import mv from 'mv';
export default class InsurersController {

    constructor() {}

    uploadFile(_file, _reges, _dues, _short_name, _description) {
        this.file = _file;
        this.reges = _reges;
        this.dues = _dues;
        this.short_name = _short_name;
        this.description = _description;

        const names = this.file.name.split('.');
        /**
         * Get file extension
         *
         * @type {*|string}
         */

        const extension = names[names.length - 1];
        let newFilePath = `data/picture/${this.short_name}/${new Date().getTime()}.${extension}`;

        return new Promise((resolve, reject) => {
            mv(this.file.tempFilePath, newFilePath, {
                mkdirp: true
            }, (err, result) => {
                if (err)
                    reject(err);
                resolve({
                    regles: this.reges,
                    image_path: newFilePath,
                    dues: this.dues,
                    short_name: this.short_name,
                    description: this.description,
                })
            });
        });

    }
}
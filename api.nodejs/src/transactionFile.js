import xlsx from 'xlsx';


export default class TransactionFile {


    constructor(filePath) {
        this.filePath = filePath;
        this.data = [];
        this.column_indexes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        this.key_words = ['client', 'reférence', 'contrat', 'code', 'bordéreau', 'commission', 'dû', 'produit', 'date', 'taux'];

        this.getAllDatas();
        this.reindexObjects();
        this.addPropertiesToObjects();
        this.setHeaders();
        this.validateLines();
    }


    getAllDatas() {

        // Si on a pas en entrée une chaine ou si elle est vide on retourne []
        if (this.filePath === undefined || this.filePath.trim().length < 1) {
            this.data = [];
            return;
        }

        // On ouvre un stream vers le fichier
        let wb = xlsx.readFile(this.filePath, {cellDates: true});

        // On selectionne la feuille de calcul
        let ws = wb.Sheets[wb.SheetNames[0]];

        // On converti la feuille en collection d'objets JSON
        let datas = xlsx.utils.sheet_to_json(ws);

        // On cree des variables pour y stocker le nom des colonnes
        // Pour cela on se base sur le premier objet de notre collection
        let obj = {};
        Object.keys(datas[0]).forEach(key => {
            // On parcoure donc les clés pour les ajouter dans notre nouvel objet
            obj[key] = key;
        });
        datas.unshift(obj);

        // On retourne notre collection
        this.data = datas;
        return;
    }


    reindexObjects() {

        // Si on a pas en entrée une collection ou si elle est vide on retourne []
        if (this.data === undefined || this.data.length < 1) {
            this.data = [];
            return;
        }

        let datas_ = [];

        // On déclare un objet tampon
        let _obj = null;
        // On parcoure notre collection d'objet
        this.data.forEach((elt) => {
            // on initialise notre objet tampon
            _obj = {};

            // On declare et on initialise notre compteur
            let i = 0;
            // On parcoure les propriétés de notre collection
            for (let prop in elt)
                // On verifie si la propriete n'est pas nulle
                if (elt.hasOwnProperty(prop)) {
                    // Et a ajoute la valeur de la propriété a un objet
                    _obj[this.column_indexes[i]] = elt[prop];

                    // On incrémente notre compteur
                    i++
                }


            // On push donc l'objet dans notre nouveau tableau
            datas_.push(_obj);

            // On libère ensuite la mémoire en vidant notre objet
            _obj = null;

        });

        this.data = datas_;
        return;
    }


    merge(obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    }


    addPropertiesToObjects() {

        // Si on a pas en entrée une collection ou si elle est vide on retourne []
        if (this.data === undefined || this.data.length < 1) {
            this.data = [];
            return;
        }

        let datas_ = [];

        // On decalare 2 objets qui vont stocker l'objet actuel
        // Et un petit objet qui contiendra les propriétés a ajouter
        let obj_ = null;
        let _obj = null;

        // Puis on parcoure donc notre objet
        let number = 1;
        this.data.forEach((elt) => {
            obj_ = {};
            _obj = {};

            // On parcoure les propriétés de notre objet
            for (let prop in elt)
                // On vérifie si la valeur n'est pas nulle
                if (elt.hasOwnProperty(prop))
                // On ajoute donc cela a notre nouvel objet
                    obj_[prop] = elt[prop];

            // On ajoute dons les nouvelles propriétés dans un autre objet
            _obj['#'] = number;
            _obj['VALID'] = false;
            _obj['HEAD'] = false;

            // On fusionne donc les deux objets
            obj_ = this.merge(_obj, obj_);

            // On ajoute donc l'objet dans notre collection
            datas_.push(obj_);

            // on gère le compteur
            number++;

            // on gère la mémoire
            _obj = null;
            obj_ = null

        });

        this.data = datas_;
        return;
    }


    setHeaders() {
        // Si on a pas en entrée une collection ou si elle est vide on retourne []
        if (this.data === undefined || this.data.length < 1) {
            this.data = [];
            return;
        }

        // On parcoure tous les objets de notre collection
        this.data.forEach((elt) => {

            // On initialise une variable pour le nombre de correspondance
            let found = 0;

            // On parcoure notre objet
            for (let prop in elt)

                // On vérirfie si la valeur de la propriété n'est pas nulle
                if (elt.hasOwnProperty(prop)) {
                    let val = elt[prop];

                    // On parcoure la collection de nos mots clés
                    this.key_words.forEach((word) => {

                        // On vérifie s'il y a un match puis on incrémente
                        if (val.toString().toLowerCase().includes(word.toLowerCase()))
                            found++
                    })
                }
            // S'il ya au moins 3 matches on peut donc définir une ligne d'entête
            if (found >= 3)
                elt['HEAD'] = true
        });

    }


    validateLines() {
        // Si on a pas en entrée une collection ou si elle est vide on retourne []
        if (this.data === undefined || this.data.length < 1)
            this.data = [];

        // On declare une variable pour le nombre de propriétés de l'entete
        let number = 0;
        // On cherche la ligne d'entête pour recupérer son nombre de propriétés
        this.data.forEach((elt) => {
            if (elt.hasOwnProperty('HEAD') && elt['HEAD'] && number === 0)
                for (let prop in elt)
                    if (elt.hasOwnProperty(prop))
                        number++
        });

        // Maintenant on parcoure les ligne pour définir leur validités
        this.data.forEach((elt) => {
            let nbr = 0;
            // On compte le nombre de propriétés
            for (let prop in elt) if (elt.hasOwnProperty(prop)) nbr++;

            // On fait une approximation de nombre de ligne et ensuit
            // On verifie que l'objet a le même nombre de propriétés que l'entête et qu'elle n'est pas une entête
            if ((number - 2 === nbr || number + 2 === nbr || number - 1 === nbr || number + 1 === nbr || number === nbr) && elt.hasOwnProperty('HEAD') && elt['HEAD'] === false)
                elt['VALID'] = true
        })
    }


    calculateCommissions(_index) {
        // Si on a pas en entrée une collection ou si elle est vide on retourne 0.0
        if (this.data === undefined || this.data.length < 1)
            return 0.0;

        let _commission = 0.0;
        this.data.forEach((elt) => {
            let index_ = 0;
            for (let prop in elt)
                if (elt.hasOwnProperty(prop)) {
                    if (index_ === _index && typeof elt[prop] === 'number') {
                        _commission += elt[prop]
                    }
                    index_++
                }
        });

        return Math.round(_commission * 100) / 100
    }
}
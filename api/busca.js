const utils = require('./common');

var _post = function (tarefas, atuais, pessoas, body) {
    // Junta as tarefas
    var merged = utils.join_tap(tarefas, atuais, pessoas);
    
    // Formata o filtro de acordo com o json de saída
    var filtro = {};
    [{ a: 'id', b: 'idTarefa' },
        { a: 'description', b: 'description' },
        { a: 'name', b: 'taskName' },
        { a: 'doBefore', b: 'doBefore' },
        { a: 'comment', b: 'comment' },
        { a: 'status', b: 'status' },
        { a: 'people', b: 'personName' },
        { a: 'peopleID', b: 'idPessoa' },
        { a: 'points', b: 'points' }].forEach(t => {
        if (t.a in body) {
            filtro[t.b] = body[t.a];
        }
    });

    var filtered = [];
    // Filtra as tarefas
    if (Object.keys(filtro).length === 0) filtered = merged;
    if ('parcial' in body
        && body['parcial'] == true) {
        if ('strict' in body
            && body['strict'] == true) {
            // parcial TRUE, strict TRUE
            //se o filtro é um array, todas os valores passados devem estar presentes 
            filtered = merged.filter(t=> {
                for (var k in filtro) {
                    if (filtro[k] === null) {
                        if (filtro[k] != t[k]) return true;
                    } else if ((filtro[k].constructor === Array
                        && !filtro[k].map(e=> t[k].includes(e))
                            .reduce((a, b) => a && b))
                        || (filtro[k].constructor === String
                            && !t[k].includes(filtro[k]))
                        || (filtro[k].constructor === Number
                            && filtro[k] != t[k])) {
                        return false;
                    }
                }
                return true;
            });
        } else {
            // parcial TRUE, strict FALSE
            filtered = merged.filter(t=> {
                for (var k in filtro) {
                    if (filtro[k] === null) {
                        if (filtro[k] == t[k]) return true;
                    } else if (
                        (filtro[k].constructor === Array
                            && filtro[k].map(e=> t[k].includes(e))
                                .reduce((a, b) => a || b))
                        || (filtro[k].constructor === String
                            && t[k].includes(filtro[k]))
                        || (filtro[k].constructor === Number
                            && filtro[k] == t[k])) {
                        return true;
                    }
                }
                return false;
            });
        }
    }
    else if ('strict' in body
        && body['strict'] == true) {
        // parcial FALSE, strict TRUE
        filtered = merged.filter(t=> {
            for (var k in filtro) {
                if (filtro[k] === null) {
                    if (filtro[k] != t[k]) return true;
                } else if (
                    (filtro[k].constructor === Array
                        && !filtro[k].includes(t[k]))
                    || (filtro[k].constructor === String
                        && filtro[k] != t[k])
                    || (filtro[k].constructor === Number
                        && filtro[k] != t[k])) {
                    return false;
                }
            }
            return true;
        });
    } else {
        // parcial FALSE, strict FALSE
        filtered = merged.filter(t=> {
            for (var k in filtro) {
                if (filtro[k] === null) {
                    if (filtro[k] == t[k]) return true;
                } else if (
                    (filtro[k].constructor === Array
                        && filtro[k].includes(t[k]))
                    || (filtro[k].constructor === String
                        && filtro[k] == t[k])
                    || (filtro[k].constructor === Number
                        && filtro[k] == t[k])) {
                    return true;
                }
            }
            return false;
        });
    }
    
    // Ordena
    if ('orderBy' in body && filtered.length > 0
        && body['orderBy'] in filtered[0]) {
        // ordena inverso
        if (body['orderBy'].indexOf('-') == 0) {
            filtered = filtered.sort((a, b) => {
                return a[body['orderBy']] < b[body['orderBy']];
            });
        } else {
            filtered = filtered.sort((a, b) => {
                return a[body['orderBy']] > b[body['orderBy']];
            });
        }
    }

    return filtered;
};

module.exports = {
    // retorna um json com os critérios válidos no json da busca
    "get": function (req, res, next) {
        var criterios = {
            'id': 'string',
            'description': 'string',
            'name': 'string',
            'doBefore': 'date',
            'people': '[string]',
            'peopleID': '[string]',
            'comment': 'string',
            'status': 'string',
            'strict': 'boolean',
            'parcial': 'boolean',
            'orderBy': 'string',
            'points': 'number'
        };
        res.json(criterios);
    },
    // faz uma busca usando req.body como critérios de busca
    "post": function (req, res, next) {
        req.azureMobile.tables('tarefas')
            .read().then(function (t_results) {
            req.azureMobile.tables('atuais')
                .read().then(function (a_results) {
                req.azureMobile.tables('pessoas')
                    .read().then(function (p_results) {
                    res.json(_post(t_results, a_results, p_results, req.body));
                });
            });
        });
    }
}

const utils = require('./common');

var _post = function (req, body) {
    var tarefa = {};
    ['description', 'name', 'doBefore','points'].forEach(t => {
        if (t in body) {
            tarefa[t] = body[t];
        }
    });
    var at = {};
    ['status', 'comment'].forEach(t => {
        if (t in body) {
            at[t] = body[t];
        }
    });
    req.azureMobile.tables('tarefas')
        .insert(Object.assign({}, tarefa))
        .then(nova => {
        if ('people' in body) {
            //cria uma linha em _atuais_ pra cada pessoa recebida
            body.people.forEach(pID => {
                req.azureMobile.tables('atuais').insert(Object.assign({ 'idTarefa': nova.id, 'idPessoa': pID }, at));
            });
        }
    });
    return { status: 201, text: 'tarefa inserida com sucesso' };
};

var _get = function (tarefas, atuais, pessoas) {
    return utils.join_tap(tarefas, atuais, pessoas);
};

var _put = function (req, tarefa, body) {
    // se tiver alguma prop de Tarefas
    // atualiza @tarefas
    var novo = {};
    ['description', 'doBefore', 'name','points'].forEach(t => {
        if (t in body) {
            novo.id = tarefa.id;
            novo[t] = body[t];
        }
    });
    if ('id' in novo) { req.azureMobile.tables('tarefas').update(novo); }
    // se tiver 'people', atualiza para cada pessoa
    // cujo id foi passado em 'people'
    if ('people' in body) {
        req.azureMobile.tables('atuais')
            .where({ idTarefa: tarefa.id })
            .read().then(a_results => {
            // ids das pessoas já designadas pra esta tarefa
            var atIDs = a_results.map((el) => {
                return el.idPessoa;
            });
            novo = { 'idTarefa': tarefa.id };
            ['comment', 'status'].forEach(t => {
                if (t in body) {
                    novo[t] = body[t];
                }
            });
            a_results.forEach(at => {
                // atualiza a linha em _atuais_ das pessoas que já estavam atribuídas
                if (body.people.includes(at.idPessoa)) {
                    req.azureMobile.tables('atuais').update(Object.assign({}, at, novo));
                }
            });
            body.people.forEach(pID => {
                // cria uma linha em _atuais_ pra cada pessoa nova recebida
                if (!atIDs.includes(pID)) {
                    req.azureMobile.tables('atuais').insert(Object.assign({ 'idPessoa': pID }, novo));
                }
            });
        });
    }
    return { status: 200, text: 'tarefa atualizada com sucesso' };
};

var _delete = function (req, atuais, body) {
    atuais.forEach(at => {
        if (body.people.includes(at.idPessoa)) {
            req.azureMobile.tables('atuais').delete(at);
        }
    });
};

var api = module.exports = {
    // retorna tarefas INNER JOIN atuais INNER JOIN pessoas
    // ON T.id == A.tarefaID AND P.id == A.pessoaID
    "get": function (req, res, next) {
        req.azureMobile.tables('tarefas')
            .read().then(function (t_results) {
            req.azureMobile.tables('atuais')
                .read().then(function (a_results) {
                req.azureMobile.tables('pessoas')
                    .read().then(function (p_results) {
                    res.json(_get(t_results, a_results, p_results));
                });
            });
        });
    },
    // cria uma nova tarefa com req.body
    "post": function (req, res, next) {
        return res.json(_post(req, req.body));
    },
    // atualiza uma tarefa
    "put": function (req, res, next) {
        if ('id' in req.body) {
            req.azureMobile.tables('tarefas')
                .where({ id: req.body.id })
                .read().then(function (t_results) {
                if (t_results.length == 0) return res.json({ status: 500, text: 'id=' + req.body.id + ' not found @tarefas' });
                return res.json(_put(req, t_results[0], req.body));
            });
        } else {
            return res.json({ status: 500, text: '`id` field missing in the request body' });
        }
    },
    // remove um responsável da tarefa
    "delete": function (req, res, next) {
        if ('id' in req.body
            && 'people' in req.body) {
            req.azureMobile.tables('atuais')
                .where({ idTarefa: req.body.id })
                .read().then(a_results => {
                return res.json(_delete(req, a_results, req.body));
            });
        } else {
            return res.json({ status: 500, text: '`id` and/or `people` field(s) missing in the request body' });
        }
    }
}
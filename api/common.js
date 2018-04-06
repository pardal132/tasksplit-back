// https://msdn.microsoft.com/library/en-us/JJ613353.aspx?f=255&MSPPError=-2147217396

module.exports = {
    join_tap: function (tarefas, atuais, pessoas) {
        var merged = [];
        var atuais_pessoas = [];
        // O(2|atuais|^2)
        atuais.forEach(function (atual) {
            pessoas.forEach(function (pessoa) {
                if (pessoa.id == atual.idPessoa) {
                    var novo = Object.assign({}, pessoa, atual);
                    novo.personName = pessoa.name;
                    atuais_pessoas.push(novo);
                }
            });
        });
        tarefas.forEach(function (tarefa) {
            var atribuida = false;
            atuais_pessoas.forEach(function (atual) {
                if (tarefa.id == atual.idTarefa) {
                    atribuida = true;
                    var novo = Object.assign({}, tarefa, atual);
                    novo.taskName = tarefa.name;
                    ['updatedAt', 'deleted', 'version', 'googleToken', 'facebookToken', 'phone', 'email', 'name']
                        .forEach(function (key) { delete novo[key]; });
                    merged.push(novo);
                }
            });
            if(atribuida == false){
                //coloca os campos que viriam de _atuais_
                var novo = Object.assign({},tarefa);
                ['id', 'idPessoa', 'comment', 'status', 'personName']
                        .forEach(function (key) { novo[key] = null; });
                novo.idTarefa = tarefa.id;
                novo.taskName = tarefa.name;
                ['updatedAt', 'deleted', 'version', 'name']
                        .forEach(function (key) { delete novo[key]; });
                merged.push(novo);
            }
        });
        return merged;
    }
};
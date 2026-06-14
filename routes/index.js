const express = require("express");
const wrap = require("express-async-error-wrapper");
const axios = require("axios");
const router = express.Router();
const sql = require("../data/sql");

const url_api = process.env.url_api;

router.get("/", wrap(async (req, res) => {
	
	await sql.connect(async sql => {
		let lista = await sql.query("select max(id) id from soil");
                           
		let id_inferior = 61628;
		if (lista[0].id) {
			id_inferior = lista[0].id;
		}

		const response = await axios.get(url_api + "?sensor=soil&id_inferior=" + id_inferior);
		const dadosNovos = response.data;

		for (let i = 0; i < dadosNovos.length; i++) {
			const dadoNovo = dadosNovos[i];

			await sql.query("insert into soil (id, data, id_sensor, delta, condutividade, umidade, temperatura) values (?, ?, ?, ?, ?, ?, ?)", [dadoNovo.id, dadoNovo.data, dadoNovo.id_sensor, dadoNovo.delta, dadoNovo.condutividade, dadoNovo.umidade, dadoNovo.temperatura]);
		}
	});

	let nomeDoUsuarioQueVeioDoBanco = "Rafael";

	let opcoes = {
		usuario: nomeDoUsuarioQueVeioDoBanco,
		quantidadeDeRepeticoes: 5
	};

	res.render("index/index", opcoes);
}));

router.get("/presencaTotalPorDia", wrap(async (req, res) => {
	const data_inicial = req.query["data_inicial"];
	const data_final = req.query["data_final"];
	let dados;

	await sql.connect(async sql => {

		dados = await sql.query(`
			select id_sensor, date(data) dia, sum(delta) presenca_total from soil
			where data between ? and ? and ocupado = 0
			group by id_sensor, dia
			order by id_sensor, dia    #### MUDAR PARA SOIL
		`, [data_inicial, data_final]);

	});

	res.json(dados);
}));

router.get("/sobre", wrap(async (req, res) => {
	res.render("index/sobre");
}));

router.get("/contato", wrap(async (req, res) => {
	res.render("index/contato");
}));

router.get("/tecnologia", wrap(async (req, res) => {
	res.render("index/tecnologia");
}));

router.get("/dados", wrap(async (req, res) => {
    let resultado;

    await sql.connect(async sql => {
        const rows = await sql.query(`
            SELECT temperatura, umidade, condutividade,
                   DATE_FORMAT(data, '%H:%i') AS hora
            FROM soil
            ORDER BY id DESC
            LIMIT 1
        `);
        resultado = rows[0];
    });

    res.json(resultado);
}));

router.get("/dados/historico", wrap(async (req, res) => {
    let resultado;
    const { data_inicial, data_final, hora_inicial, hora_final } = req.query;

    await sql.connect(async sql => {
        resultado = await sql.query(`
            SELECT temperatura, umidade, condutividade,
                   DATE_FORMAT(data, '%d/%m %H:%i') AS hora
            FROM soil
            WHERE id_sensor = 2
              AND data BETWEEN ? AND ?
              AND TIME(data) BETWEEN ? AND ?
            ORDER BY id ASC
            LIMIT 100
        `, [data_inicial, data_final, hora_inicial, hora_final]);
    });

    res.json(resultado);
}));

router.get("/heatmap", wrap(async (req, res) => {
    let resultado;
    const { data_inicial, data_final, hora_inicial, hora_final } = req.query;

    await sql.connect(async sql => {
        resultado = await sql.query(`
            SELECT
                date_format(date(data), '%d/%m/%Y') AS dia,
                EXTRACT(HOUR FROM data) AS hora,
                AVG(umidade) AS umidade
            FROM soil
            WHERE id_sensor = 2
              AND data BETWEEN ? AND ?
              AND TIME(data) BETWEEN ? AND ?
            GROUP BY dia, hora
            ORDER BY dia, hora
        `, [data_inicial, data_final, hora_inicial, hora_final]);
    });

    const diasMap = {};
    for (const row of resultado) {
        if (!diasMap[row.dia]) diasMap[row.dia] = {};
        diasMap[row.dia][row.hora] = parseFloat(row.umidade) || 0;
    }

    const dias = Object.keys(diasMap);
    const matriz = dias.map(dia => {
        return Array.from({ length: 24 }, (_, h) => diasMap[dia][h] || 0);
    });

    res.json(matriz);
}));

module.exports = router;

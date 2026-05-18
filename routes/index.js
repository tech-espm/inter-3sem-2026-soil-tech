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

router.get("/teste", wrap(async (req, res) => {

	let teste = await sql.query("select * from soil")
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste", opcoes);
}));

router.get("/teste2", wrap(async (req, res) => {
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste2", opcoes);
}));

router.get("/teste3", wrap(async (req, res) => {
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste3", opcoes);
}));

router.get("/produtos", wrap(async (req, res) => {
	let produtoA = {
		id: 1,
		nome: "Produto A",
		valor: 25
	};

	let produtoB = {
		id: 2,
		nome: "Produto B",
		valor: 15
	};

	let produtoC = {
		id: 3,
		nome: "Produto C",
		valor: 100
	};

	let produtosVindosDoBanco = [produtoA, produtoB, produtoC];

	let opcoes = {
		titulo: "Listagem de Produtos",
		produtos: produtosVindosDoBanco
	};

	res.render("index/produtos", opcoes);
}));

module.exports = router;

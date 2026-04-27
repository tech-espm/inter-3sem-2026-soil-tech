CREATE DATABASE IF NOT EXISTS soiltech DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- Todos os deltas estão em segundos

USE soiltech;

-- Um registro é inserido a cada 10 minutos, quer tenham ocorrido mudanças ou não.
CREATE TABLE soil (
  id bigint NOT NULL PRIMARY KEY AUTO_INCREMENT,
  data datetime NOT NULL,
  id_sensor tinyint NOT NULL,
  delta int NOT NULL, -- segundos
  condutividade float NOT NULL, -- μS / cm (micro siemens por centímetro)
  umidade float NOT NULL, -- %
  temperatura float NOT NULL -- °C
);

-- Query para monitorar em tempo real
(select id_sensor, condutividade, umidade, temperatura from pca where id_sensor = 1 order by id desc limit 1)
union all
(select id_sensor, condutividade, umidade, temperatura from pca where id_sensor = 2 order by id desc limit 1)
;

-- Query de consolidação por sensor, dia do mês e por hora, para o heatmap de visão explodida por dia da semana com N colunas e 24 linhas
select date_format(date(data), '%d/%m/%Y') dia, extract(hour from data) hora, avg(condutividade) condutividade, avg(umidade) umidade, avg(temperatura) temperatura
from soil
where data between '2025-03-03 00:00:00' and '2025-03-14 23:59:59'
and id_sensor = 2
group by dia, hora
order by dia, hora
;

# Dados de composição alimentar

TACO — Tabela Brasileira de Composição de Alimentos, NEPA/UNICAMP, 4ª edição, 2011. Valores por 100 g de parte comestível. Preparação e marca podem alterar a composição.

Dados digitalizados: https://github.com/raulfdm/taco-api
Commit: 06e466ad2f3d76064b587808b1804564b2c40f67
Arquivos: references/csv/food.csv, categories.csv e nutrients.csv.

Importação: união por foodId; valores numéricos mantidos; campos vazios preservados como null. Na digitalização de origem, “Tr” (traço) foi convertido para 0. A aplicação informa essa limitação. Zero não prova ausência absoluta. Valores NA e em reavaliação ficam ausentes. Não somar RE, RAE e retinol: são formas alternativas de expressar vitamina A. A base não inclui todos os nutrientes existentes (por exemplo, vitaminas D, E, K e B12).

Licença da digitalização (MIT):

Copyright 2022 Raul de Melo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

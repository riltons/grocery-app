API (Visão Geral)
Esta API fornece acesso ao cadastro dos produtos do Cosmos.

Autenticação
Todas as chamadas deverão conter no cabeçalho o campo X-Cosmos-Token com o seu token de acesso a API que está disponível logo abaixo:

Seu Token: gcTll84IT9IeuqA-28YiDA

Além do token, é necessário informar o UserAgent: Cosmos-API-Request
Modelagem da API
Todos os serviços disponibilizados através da API utilizam a tecnologia REST (Representational State Transfer), uma arquitetura para a disponibilização de recursos através de sistemas distribuídos, popularmente utilizado sobre HTTP.
A quantidade de itens padrão por página é de 30, mas pode ser extendida até 90 itens usando o parâmetro per_page, valores maiores que este não serão aceitos.
HTTP 1.1
O protocolo padrão para comunicação com as APIs é o HTTP versão 1.1. Para maiores informações sobre esse protocolo, consulte: http://www.w3.org/Protocols/rfc2616/rfc2616.html http://www.ietf.org/rfc/rfc2616.txt
UTF-8
O Charset padrão para chamadas às APIs é o UTF-8. Para maiores informações sobre essa codificação, consulte: https://tools.ietf.org/html/rfc3629
JSON
JSON (JavaScript Object Notation) é um padrão para descrição de dados para intercâmbio entre sistemas e é mais simples e mais leve que o XML.

Endpoint
O endpoint para acessar a API é: https://api.cosmos.bluesoft.com.br

Serviços
Os serviços abaixo podem ser utilizados para fazer consultas no banco de dados geral do Cosmos:

GET /gtins/{código}
Recupera detalhes do produto atráves do GTIN/EAN informado.
GET /gpcs/{código}
Recupera detalhes do GPC e Produtos vínculados a ele, atráves do código informado.
GET /ncms/{código}/products
Recupera detalhes do NCM e Produtos vínculados a ele, atráves do código informado.
GET /products?query={descrição ou gtin}
Recupera lista de produtos paginados atráves da descrição ou GTIN.
Caso o usuário seja um varejista, é possível utilizar os seguintes serviços para consultar sua base de produtos:

GET /retailers/gtins/{código}
Recupera detalhes do produto de um varejista atráves do GTIN/EAN informado.
GET /retailers/gpcs/{código}
Recupera detalhes do GPC e Produtos vínculados a ele na base de produtos do varejista, atráves do código informado.
GET /retailers/ncms/{código}
Recupera detalhes do NCM e Produtos vínculados a ele na base de produtos do varejista, atráves do código informado.
GET /retailers/products?query={descrição ou gtin}
Recupera uma lista de produtos paginados da base do varejista atráves da descrição ou GTIN.

Lista de Códigos de Sucesso
A API usa os seguintes códigos HTTP para indicar retornos de sucesso comuns:
HTTP 200: Indica que o processamento foi realizado corretamente e o retorno será conforme a expectativa. Método: GET

Lista de Códigos de Erro
A API usa os seguintes códigos HTTP para indicar erros comuns:
HTTP 422: Exceções de negócio
Família 400: Exceções devido a erros do cliente:
HTTP 400: Requisição Mal Formada;
HTTP 401: Requisição Requer Autenticação;
HTTP 403: Requisição Negada;
HTTP 404: Recurso não Encontrado;
HTTP 405: Método não Permitido;
HTTP 408: Tempo esgotado para a requisição;
HTTP 413: Requisição excede o tamanho máximo permitido;
HTTP 415: Tipo de mídia inválida (falta de informar o content-type correto, ver JSON);
HTTP 429: Requisição excede a quantidade máxima de chamadas permitidas à API;
Exceção lançadas por erros de Servidor(es)
500: Erro de servidor

Políticas de Acesso
O acesso aos serviços da API do Cosmos são regulados por políticas de acesso (policy rules). Essas regras definem a quantidade de requisições que podem ser realizados para cada serviço. Toda vez que o limite de chamadas é excedido, a requisição é respondida com o status HTTP 429 acompanhado de uma mensagem informando a quantidade excedida.

Exemplos
Nos exemplos abaixo, estamos obtendo os detalhes de um produto com o GTIN 7891910000197.

Ruby
Python
PHP
cUrl
Delphi
C#
      require 'net/http'
      uri = URI.parse('https://api.cosmos.bluesoft.com.br/gtins/7891910000197.json')
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      request = Net::HTTP::Get.new(uri.request_uri)
      request['User-Agent'] = 'Cosmos-API-Request'
      request['Content-Type'] = 'application/json'
      request['X-Cosmos-Token'] = 'YuZwpKZlMvph8grVNwQ9Fw'
      response = http.request(request)
      puts response.body
    
      using System;
      using System.Net;
      using System.Net.Http;
      using System.Net.Http.Headers;

      class Cosmos
      {
          static void Main(string[] args) {
              var url = "https://api.cosmos.bluesoft.com.br/gtins/7891910000197.json";
              CosmosWebClient wc = new CosmosWebClient();
              string response = wc.DownloadString(url);
              Console.Write(response);
          }

          public class CosmosWebClient : WebClient {
              protected override WebRequest GetWebRequest(Uri address) {
                  HttpWebRequest request = (HttpWebRequest) base.GetWebRequest(address);
                  request.UserAgent="Cosmos-API-Request";
                  request.Headers["X-Cosmos-Token"] = "YuZwpKZlMvph8grVNwQ9Fw";
                  base.Encoding = System.Text.Encoding.UTF8;
                  return request;
              }
          }
      }
    
Retorno da Consulta Acima
{
    "avg_price": 2.99,
    "brand": {
        "name": "UNIÃO",
        "picture": ""
    },
    "description": "AÇÚCAR REFINADO UNIÃO 1KG",
    "gpc": {
        "code": "10000043",
        "description": "Açúcar / Substitutos do Açúcar (Não perecível)"
    },
    "gross_weight": 1000,
    "gtin": 7891910000197,
    "height": 0.0,
    "length": 0.0,
    "max_price": 2.99,
    "ncm": {
        "code": "17019900",
        "description": "Outros",
        "full_description": "Açúcares e produtos de confeitaria - Açúcares de cana ou de beterraba e sacarose quimicamente pura, no estado sólido - Outros: - Outros"
    },
    "net_weight": 1000,
    "price": "R$ 2,99",
    "thumbnail": "https://cdn-cosmos.bluesoft.com.br/products/7891910000197",
    "width": 0.0
}
Googleplay button
Appstore button

Acelerato
Bluesoft Nossos Materiais

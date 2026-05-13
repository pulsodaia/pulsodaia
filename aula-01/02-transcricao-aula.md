# Transcrição - Encontro FlowHub 01

**Tema:** Integração GoHighLevel + Claude Code
**Data:** 12 de maio de 2026 (terça, 19h BRT)
**Duração:** 2h13min
**Organizador:** Alex Campos (Triadeflow)
**Participantes:** Alex Campos, Kleber Fernandes, Cinthia (Mood Assessoria de Marketing), Dr. Lucas Moraes (Amigos da Coluna), Oceano Azul, Sidney Faroldo (Futuro), Gisele (Estudando MTC)

---

## Sumário Executivo

Primeiro encontro da nova série de aulas semanais às terças 19h, dedicada a integrar GoHighLevel (HUB) com Claude Code. Alex demonstrou como gerar tokens PIT da agência e da subconta, criar uma subconta pelo terminal usando Claude Code, e como esse fluxo elimina horas de trabalho manual. O ponto central da aula foi mostrar duas soluções reais entregues a clientes: um sistema de pedidos para gráfica de uniformes (F5) que virou um produto modular com painel TDI, mapa do processo e Kanban de produção, e um sistema de check-in semanal para clínica de nutrição (Dr. Reinaldo) integrado aos custom objects do GHL. Discutiram a diferença entre custom fields e custom objects, casos de uso por nicho (clínica, automotivo, gráfica, e-commerce), a regra do "básico bem feito" antes de automação complexa, e fechamento de venda recorrente (R$1.000/mês) usando solução personalizada como mecanismo de retenção. Encerrou prometendo enviar a skill e o agente do GHL no grupo da comunidade.

---

## Transcrição completa

### [00:00] Pré-aula e quebra-gelo entre participantes

> **Cinthia:** Boa noite.
>
> **Kleber Fernandes:** Boa noite, Cinthia.
>
> **Cinthia:** Tudo bem?
>
> **Alex Campos:** Tudo joia. Chegamos primeiro, hein?
>
> **Cinthia:** Chegamos primeiro. E aí, Kleber, me fala de você, o que você faz?
>
> **Kleber Fernandes:** Deixa eu aumentar o volume.
>
> **Cinthia:** Me fala de você, o que você faz.
>
> **Alex Campos:** Alá, alá, turma!
>
> **Kleber Fernandes:** Olha quem chegou.
>
> **Alex Campos:** Eu estava vendo que vocês iam se falar, se fala aí que eu estou terminando uma parada aqui.
>
> **Cinthia:** Estava perguntando para o Kleber o que ele faz.
>
> **Kleber Fernandes:** Então, eu tenho uma agência, era uma agência de marketing, agora a gente voltou para a IA, e com o GoHighLevel agora as coisas tendem a mudar, né? Eu tô no meu período de experimento. Creio que vai chegar até depois de amanhã, acho que é até quinta-feira, né? E eu tenho algumas dúvidas com relação à ferramenta. E você?
>
> **Cinthia:** Eu tô na mesma, eu tinha uma assessoria de marketing, agora eu migrei pra estruturação empresarial com IA, então tem a parte de marketing, mas ela faz parte do processo da estruturação da empresa. Porque por muito tempo o problema maior dos meus clientes foi a falta de estrutura, principalmente no comercial. E o Alex é meu parceiro de outras ferramentas, já antigo. Ele me apresentou no GHL, acho que faz dois meses eu comecei com a conta de três, vem de implementação, agora eu passei pra outra conta maior. E tenho tentado me aprofundar mais no estudo dele. Mas estou colhendo bons frutos. Eu achei que é uma plataforma bem completa. Estou migrando os meus clientes de agente, de UPT Maker e n8n para ele. E agora estou tentando fazer upsell dos clientes que eu tenho, pelo menos para o CRM. Nem que seja eu criando um workflow ali basiquinho, uma pipeline basic, arroz com feijão pra vender, nem que seja pra vender só mensal e não vender implementação, mas ter a pessoa lá pra que eu possa controlar realmente o que tá acontecendo, pagar uma mensalidade ali, já tem um fixo a mais.
>
> **Kleber Fernandes:** Entendi. Basicamente é o que eu tô fazendo também. A gente trabalha com estruturação também, eu tenho aquela coisa de dizer pro cliente que ele precisa primeiro ter uma estrutura orgânica para depois pensar em anúncio. O que a gente mais vê é nego gastando, rasgando dinheiro com anúncio e não tem a estrutura básica validada pra que ele não tenha um gasto alto com CAC. E a gente faz essa estruturação também. Antes era só site e mídia social. Hoje não, hoje é um ecossistema mesmo. Só que o GoHighLevel já vem com tudo pronto. Daquilo que vai servir para todo e qualquer cliente, ela já tem pronto. Só se a coisa for muito personalizada, se for algo específico, aí realmente a gente tem que correr para o código. Mas dentro do GoHighLevel é muito mais fácil. Inclusive eu tinha uma ferramenta que eu trabalhava antes, que ela fazia essa sincronização de conteúdos entre o Google Meu Negócio e as redes sociais. E ranqueava o cliente nesses canais. Só que esse ranqueamento nada mais é do que você ter constância de conteúdo. A única coisa que ela tinha de uau é uma automatização de conteúdo. Mas isso eu já tô fazendo com o próprio Claude, né? E agora com o GoHighLevel eu vou ter mais facilidade ainda, dado aquela questão das APIs. No Claude você tem que linkar API por API, cliente por cliente. No GoHighLevel eu já vejo que a coisa já tá mais facilitada nesse sentido.
>
> **Cinthia:** Mais avançada, né?
>
> **Kleber Fernandes:** A única coisa é eu criar o conteúdo mesmo e ir pra cima. Pra criar o conteúdo eu também uso o Claude.
>
> **Cinthia:** É isso aí. Roubamos um minuto de você. Roubamos um minuto, Alex.
>
> **Kleber Fernandes:** Tá mutado, Alex.
>
> **Alex Campos:** Olha que beleza, eu tô falando aqui pras paredes. Tá mutado. Agora vocês tão me ouvindo bem?
>
> **Kleber Fernandes:** Agora sim.

---

### [11:00] Abertura oficial da aula 01 e proposta da série

> **Alex Campos:** 100%? Show demais. Muito bom meus amigos, o mercado está evoluindo, então hoje a gente vai dar início a uma nova jornada. Muito bom estar com vocês aqui. Há uns três anos atrás a gente iniciou um movimento parecido, mas o mercado muda e a gente muda também junto com o mercado. Estou muito feliz por dar início novamente a esse movimento. Eu estava protelando, mas hoje vai dar início a toda semana. Eu acredito que na terça-feira vai ser esse horário, todas as terças-feiras às 19h. Mas, ao decorrer do tempo, pode ser que a gente faça em outro horário, até para outras pessoas participarem também. Isso aqui vai ficar gravado, vai lá para dentro do nosso Hub.
>
> E hoje o tema da nossa aula aqui é como usar o GHL com o Claude Code, porque tá todo mundo usando, muitas pessoas ainda não sabem usar, e a ideia hoje é eu trazer aqui já como conectar. Pode ser que alguns de vocês já estejam conectando, usando aí, mas eu vou trazer essa parte de como conectar o GHL ao Claude Code. Pra quem ficar até o final, eu vou disponibilizar as minhas duas skills do GHL pra vocês já conectarem no Claude de vocês. E também eu vou mostrar duas soluções que eu criei pra melhorar o GHL dos meus clientes. Com isso que fez, numa das negociações, eu fechei uma única conta com mensalidade de R$1.000,00 só por conta dessa solução que eu fiz em, eu não, né? O Claude fez em poucos minutos. Que quebrou totalmente a objeção do cliente em relação à plataforma.
>
> Ao final dessa apresentação, a gente sempre vai fazer um hot seat. Vamos tirar dúvidas e também deixar vocês trazerem algumas coisas que vocês estão fazendo aí também, que é bem legal para a comunidade. Dentro desses encontros também, eu sempre vou estar olhando alguns alunos e parceiros que estão se destacando e trazer eles também para mostrar alguma solução, trazer uma aula. Hoje nós damos start à aula 01 de muitas que vão vir por aí. E é muito bom, muito feliz de todos vocês estarem aí, grandes parceiros, a Cinthia de longa data, o Dr. Lucas também, Oceano Azul. Eu sempre esqueço o nome do Airton, sempre lembro da empresa dele. Isso quer dizer que o brand tá forte, hein, Airton?
>
> **Oceano Azul:** O brand tá funcionando.
>
> **Alex Campos:** A Estudando MTC é a Gisele. Ela falou que não pode abrir a câmera, tranquilo. E vamos nós aqui, turma. Eu vou compartilhar a minha tela com vocês. Peço para vocês, tirem toda a distração das outras telas, dos outros apps. Foca aqui nessa uma horinha que a gente vai ser bem proveitosa. Para você que está vendo a gravação, eu vou deixar o material complementar debaixo dessa aula depois. Então bora lá.
>
> **Cinthia:** Eu tô prestando atenção aqui, a minha câmera tá no lugar e o negócio tá no outro, tá?
>
> **Alex Campos:** Não, tranquilo. Vocês estão vendo minha tela? Só dá um joinha aí se vocês estão vendo minha tela, ok, show.

---

### [14:00] Tokens PIT da agência vs subconta no HUB

> **Alex Campos:** Então turma, bora lá. Esse aqui é o meu HUB, né? Aqui a gente tá no modo agência. E aí, eu não sei se vocês sabem, tem como a gente gerar dois tokens para fazer dois tipos de integração. Eu mesmo, hoje eu não entro mais aqui em subcontas e crio uma conta. Se vocês estão fazendo isso, vocês estão gastando preciosos cinco minutos do tempo de vocês.
>
> O que eu faço? Eu já gero um token. Eu venho aqui em configurações, integração privada. Ele é diferente, essa integração privada da agência dá permissões e endpoints diferentes da subconta. Então eu venho criar a nova integração, sempre dou um nome aqui pra eu não me perder, descrição se você quiser, próximo, e aí eu habilito todos os escopos. Se vocês verem, nós temos 24 escopos. O que são esses escopos? São os endpoints que o HUB nos fornece hoje pra que a gente possa fazer qualquer tipo de ação dentro da agência. Se vocês quiserem, com o tempo, vejam o que cada um faz. A gente não vai entrar nesse detalhe, é mais a ideia de fazer a integração aqui mesmo. Então, eu venho aqui, crio. Pronto, criei. Então, ele vai gerar o PIT.

---

### [17:00] Abrindo o Claude Code via terminal e criando subconta

> **Alex Campos:** Esse PIT aqui, eu já venho, vou abrir aqui o meu amigo Claudinho. Não sei vocês, mas eu gosto muito de usar o terminal. Eu uso o PowerShell. Pra quem usa Mac é outro, mas a ideia é a mesma. Tem gente que gosta de usar a IDE, o Antigravity, o próprio VSCode, entre outras. Eu gosto muito do terminal, não tenho usado nenhuma IDE. Vai de cada um. Por hábito, eu comecei a usar o terminal e mantive. Mas eu vejo que se eu usar uma IDE, me dá talvez até uma visualização melhor daquilo que eu estou construindo em relação a pastas. Depois a gente discute sobre isso.
>
> Então, eu vou chamar meu Claude aqui. Pessoal, já estou partindo do princípio que todos vocês que estão assistindo essa aula já têm o Claude instalado na sua máquina e no VPS, que depois, se for o caso, a gente cria uma aula específica só de como instalar. Mas é muito simples, só seguir o passo a passo. A ideia aqui não é aula de Claude Code, a ideia é aula de GHL usando o Claude Code.
>
> Então beleza, chamei meu Claudinho aqui, e aí eu vou pedir pra ele: "Crie uma subconta com o nome de aula01 para o Claudio." Vou dar o nome da conta de Claudio. E vou dar o PIT aqui pra ele. Ele já vai criar aqui, bem simples assim. Pode ser que a primeira vez que você criar, pode ser que ele não. Mesmo, se você ver aqui, o meu já colocou aqui API HUB. É uma ordem que eu dei. O meu Claude, ele tem uma regra: ele não pode, de forma nenhuma, em nada que ele for escrever, citar o GHL. Porque eu não trabalho com White Label, então eu preciso fazer com que ele sempre trate as coisas, mesmo que eu fale para ele que é o GHL, ele sempre vai trocar a nomenclatura para HUB. Então o nome GHL ele sempre vai usar HUB.
>
> Pronto, ele já criou a subconta e ele já me deu o ID, a localização dessa subconta. Então, se eu vim aqui...
>
> **Alex Campos:** STLX, por que você não entrou lá e criou? Era mais rápido do que você ter abrido um terminal. Eu sempre estou com o terminal aberto. Então é muito mais simples. É só pedir pra ele já criar ali. Então eu já venho aqui. Vamos ver qual é o nome que ele criou. Aula 01. É incrível isso, né? O poder, a velocidade que nos dá. Às vezes eu tô fazendo alguma outra coisa, só peço pra ele criar a conta e depois o cliente pode vir aqui.
>
> Ele não colocou nenhum usuário. Eu poderia. Muito bem, vamos lá. O teu cliente te passou uma lista de 10 clientes, te passou 10 e-mails e 10 nomes. Geralmente, o que eu faço? Eu estou numa reunião com o cliente, já peço pra ele esses nomes, esses e-mails, e já manda para o Claude. Ele já vai lá e cria todos os usuários certinho, já manda os e-mails para os clientes. Cara, isso otimiza muito o nosso tempo. E por que eu estou trazendo isso? É pra vocês pensarem que tudo é possível. Dentro daquilo que você faz de forma repetitiva, você pode dar a ordem para o teu agente criar isso.

---

### [21:00] Integrando a subconta e criando custom fields

> **Alex Campos:** E agora a gente vai fazer a integração com a subconta. Agora sim a gente vai ver. O processo é o mesmo, a gente vai em configuração, integrações privadas, criar nova integração, vou dar o nome aqui de Claude, escopos, e aí vocês veem que aqui na subconta já tem 126 endpoints. Então, a nível de subconta a gente já consegue criar muito mais coisas. Vou criar aqui, pronto, e aí eu vou pegar esse PIT.
>
> Ele exige não só o PIT. Ele também precisa da localização. Se você entrar aqui na URL, em cima, vocês vão ver que tem Location, que é a localização, e tem um ID. Vocês estão conseguindo enxergar isso? Na URL. Então, geralmente, o que eu faço? Eu peço pro Claudio. Na verdade, ele já até trouxe a localização. Vocês podem ver que é o mesmo. Eu vou criar agora. Vamos conectar com a subconta. Segue o PIT e a localização. Porque se eu não der a localização, ele fica perdido. Então eu só pego essa URL inteira e já dou pra ele.
>
> Isso aqui é a forma mais segura de criar isso? Não, mas você pode fazer tudo isso e depois ir rotacionar a sua key. Só você, você não vai expor isso pra nada. Você tá expondo? Se a Anthropic vazar isso aí, geram outros clientes. Pronto aqui. Se a gente vai trabalhar numa ideia, a gente tem a possibilidade de criar um ponto env, mas eu não vou entrar nesses detalhes porque já é algo muito mais profundo em relação à programação. A ideia aqui é ser o mais simples, rápido e direto onde qualquer pessoa consiga fazer isso. A ideia é simplificar. Olha lá, ele já validou o PIT.
>
> E aí, turma, daqui pra frente é onde mora o ouro do nosso negócio. Vou dar exemplo. O que eu tenho feito com esse tipo de integração? As principais coisas. Primeira coisa, criar campos personalizados. Quem concorda comigo, ergue a mão. Cara, imagina, vamos lá, você tem que criar 20 campos personalizados de diversos tipos. Tem uma empresa que tem 12, tipo assim, vamos criar um campo de lista e um dos campos tem 12 itens. Cara, é um saco. A gente ficaria horas e horas só para criar esses campos personalizados. Eu posso vir aqui agora e simplesmente pedir pra ele criar os campos personalizados.

---

### [25:00] Escolha do nicho da demo: contabilidade

> **Alex Campos:** Então aqui, eu vou simular que a gente vamos lá, votação dos maiores aí. Eu vou fazer aqui uma mini implementação, a gente não vai fazer uma implementação completa, vai fazer uma mini implementação de um nicho específico. Fala aí vocês, qual o nicho que a gente vai construir aqui agora?
>
> **Kleber Fernandes:** Contabilidade.
>
> **Alex Campos:** Contabilidade. E aí, Cinthia? Contabilidade mesmo? Galera, opina aí. Vamos lá, que não é só eu falando. Eu não gosto desse tipo de só falar. Tem que participar.
>
> **Cinthia:** Eu estou no estética e odonto, né, agora?
>
> **Alex Campos:** Estética e odonto. Contabilidade. Então, a contabilidade ganhou. Vamos criar aqui então uma implementação de contabilidade. Vamos lá. Claudio, já vamos criar baseado no nosso método.
>
> Olha que interessante. Presta atenção nisso aqui, galera. Isso daqui é o ouro. É isso que eu vou mostrar pra vocês sem brincadeira nenhuma. É o que vai economizar tempos e horas de vocês. Eu estou falando para ele criar baseado no método. Alex, que método é esse? É o meu método de criação, porque eu já treinei isso. Depois a gente pode trazer uma aula específica de como criar método. A gente pode se aprofundar.
>
> Então, beleza, Claudio, vamos criar baseado no nosso método TDI. Uma implementação para um escritório de contabilidade. Liste tudo que temos de fazer e crie para mim baseado no modelo da F5. Aí vocês vão entender. Eu estou dando F5, você vai falar: Alex, o que é F5? Vocês vão entender o que é o F5. Modelo da F5, já com o checklist. Eu poderia simplesmente só escrever para ele assim "roda o TDI", eles já sabem. Só que se eu não trazer mais contexto, vocês não vão entender o que é isso. Mas vocês vão entender, aguenta aí. Vai fazer sentido no final, na hora que estiver pronto.
>
> Modelo F5 já com o checklist de todas as tarefas que eu tenho de fazer. Tudo aquilo que você consegue, já cria e marca como feito. Estamos numa aula, então acelera. Sem enrolação. Apenas demonstrar. Pronto. Vou criar aqui. Ele já vai criar.
>
> Vocês viram aí, a gente criou uma conta do zero. Essa conta está zerada, não tem nada, acabamos de criar. Vamos até ver aqui, configuração com personalizados. Veja que só tem os campos padrões, já trazendo uma informação. Não sei se vocês já perceberam, mas os campos padrões, eu falo porque tem muitos clientes que às vezes falam "tira isso, tira aquilo". Campos padrões, você vê que não tem a lixeirinha para você excluir, tanto em contato como em oportunidade e empresa, existe os padrões. Seria legal, tem muitos campos ali que às vezes não faz sentido para o cliente, ele quer tirar e não consegue.

---

### [30:00] Apresentando o caso F5: gráfica de uniformes e a objeção do cliente

> **Alex Campos:** Vamos ver aqui o que o Claudinho está falando. "Demo TDI contabilidade, vou olhar o template da F5 e separar tudo em paralelo. Vou ler o template visual da F5." Deixa eu trazer para vocês entenderem o que é a tal da F5. Deixa eu só abrir aqui um outro terminal. Vou pedir para ele abrir aqui. Vai fazer muito sentido pra vocês.
>
> Essa F5, pra vocês entenderem, é uma empresa de uniforme lá do sul, de Pelotas, se não me engano. E eles têm uma gráfica. Eles chegaram pra nós pra implementar o CRM. E a objeção dele era: "Como que eu vou fazer o CRM conversar com o meu ERP?" Ele usa o OMIE. Caramba, eu nem sei o que é Omie. E ele falou: "Vai ter como integrar?" Eu falei: "Tem. Se tiver API, tem." Beleza, saí da reunião e vou mostrar para vocês aqui.
>
> "Claude, abre a F5." Todo o painel deles. A objeção dele era: como que eu vou integrar o CRM ao meu ERP? Essa foi uma das objeções. E aí agora vocês vão entender, eu quero escutar vocês. Como que vocês fariam? Vamos lá, ele vem de uniformes personalizados, então a gráfica, camisa, uniforme. Ele tem várias grades, de cores, de tamanho. Às vezes tem pedido de 300 camisas, porém 10 de um tipo, 20 de outra. Como que vocês fariam? Olha só que bizarro, até o CRM ele já abriu da F5.
>
> Agora eu pergunto pra vocês: como que vocês tratariam o pedido de um cliente desse dentro do CRM? Pelo menos de dois ou três aí.
>
> **Cinthia:** Eu não entendi a pergunta.
>
> **Alex Campos:** Como que vocês tratariam o pedido? Essa foi a principal objeção do cliente. Como que o meu vendedor vai fazer o pedido dentro do CRM dos meus clientes? Lembrando, às vezes o cara recebe um pedido de 100 camisas, só que dessas 100 tem 5 pretas, 10 azuis, 20 vermelhas, cada uma de uma grade. Vocês veem que é uma salada de pedido. Como que vocês fariam esse pedido dentro do CRM, pra que o cliente consiga ter todas as métricas, ver quais grades ele está mais vendendo, qual cor ele está mais vendendo?
>
> **Cinthia:** Eu criaria campo personalizado ou tag.
>
> **Alex Campos:** Campos personalizados ou tag. O vendedor, vamos lá, o cara fez um pedido de 500 camisas, de seis cores diferentes, vários tamanhos. Como que você preencheria esses campos personalizados?
>
> **Cinthia:** De forma automática ou ele ia fazer manual?
>
> **Alex Campos:** Não sei, como que você faria?
>
> **Cinthia:** Ele receberia o pedido pelo WhatsApp?
>
> **Alex Campos:** WhatsApp, o fluxo deles é no WhatsApp.
>
> **Cinthia:** Eu pediria pro Claudio fazer a categorização.
>
> **Alex Campos:** Qual você faria?
>
> **Kleber Fernandes:** Categorizaria, né? Via Claudio. Vai mandar pelo WhatsApp, o Claudio recebe e filtra isso e já joga no CRM, no WhatsApp.
>
> **Alex Campos:** O cara tá recebendo no WhatsApp e ele precisa usar o CRM pra lançar o pedido.
>
> **Cinthia:** Se for cor equivalente a vermelho, ele vai categorizar, daí colocar sinônimos. Se ele falar vermelho lá, ele vai ler e faria categorias.
>
> **Kleber Fernandes:** Tem duas categorias pelo menos, tem cor e tamanho.
>
> **Cinthia:** Ele ia fazer esse cruzamento. Tipo, ele falou "vermelha P, 3P, 5M", então ele teria que listar realmente as variáveis: cor, tamanho e quantidade.

---

### [35:00] A solução: sistema de pedido personalizado integrado ao CRM

> **Alex Campos:** Vamos lá, o que eu fiz? Eu trouxe essa informação para o Claudio, na verdade a transcrição da reunião. Eu fiz a reunião com o cliente numa quarta-feira, era mais ou menos umas 6 horas da tarde. Quando era 10 horas da noite eu mandei pro cliente isso aqui. Eu criei um sistema de pedido. Olha só: aqui ele busca o lead do cliente, isso já está integrado com o CRM. O cliente entrou lá, então ele já busca o pedido, pega o nome do contato e o WhatsApp dele.
>
> E aqui eu faço o pedido. Vejam que é uma grade muito grande de produtos. Não é só camisa, tem moletom, tem boné, é uma gráfica. Isso aqui eu já puxei do quê? Já puxei do ERP dele. Pedi pra ele o login e senha do ERP dele. Já fiz aqui, então eu consigo vir aqui, o vendedor só vem aqui e faz o pedido. Bordado, quantidade.
>
> **Alex Campos:** Ah, você já montou certinho pra ele? Já montei, facilitei a vida dele.
>
> **Kleber Fernandes:** Prontinho, então ele não precisava se preocupar com categoria, nada disso, porque ele já estava pronto.
>
> **Alex Campos:** Não, porque eu já peguei tudo do ERP dele, baseado no ERP dele.
>
> **Kleber Fernandes:** O banco de dados dele.
>
> **Alex Campos:** Na verdade, eu nem peguei o ERP dele. Eu pedi pra ele mais ou menos uma informação daquilo que ele vendia, falei pro Claude que ele ia usar o ERP tal, XPTO, que o ERP ia ter um catálogo. Então o catálogo tá aqui, tá vendo? Ele já vincula com o catálogo: uniformes, brindes, serigrafia, bordado, escola. Ele vai puxar todo o estoque, as categorias, os valores. Aqui ele pode criar um novo produto, que já sincroniza com o ERP. É via dupla, ele pode tanto lançar lá e vir pra cá, como criar aqui e lançar pra lá.
>
> **Kleber Fernandes:** Você vai conciliando estoque e pedido de produção.
>
> **Alex Campos:** Exatamente. Então beleza, faço todo o pedido aqui. Lembrando, esse aqui não tá em produção ainda, esse cliente entrou agora, a gente tá desenvolvendo. Vai ter ideia, hein? Foi isso aqui que eu fechei, cara. Isso aqui foi à venda.
>
> **Kleber Fernandes:** Claro, é lindo.
>
> **Alex Campos:** Na hora que eu clicar em salvar e enviar pro cliente aprovar, pronto, automaticamente já cria o pedido. Só que aí é onde está a grande mágica que só o GHL tem isso, que são os custom objects, que são os objetos personalizados. Eu pedi pro Claude, conversei com ele, e ele me sugeriu, baseado nas skills do GHL que eu tenho, "não, a gente vai usar os custom objects". Porque nos custom objects, vamos lá, o vendedor teria que preencher isso aqui de forma manual. Nós sabemos que a galera não preenche, por isso que eu criei o sistema de pedido. Qual é o trabalho do cara? Selecionar a quantidade e o item.
>
> **Cinthia:** Nenhum.
>
> **Alex Campos:** Só que automaticamente vai ser preenchido todos os campos dos custom objects, vai ter aqui todos os produtos e todos os itens do produto também. Foi essa solução que eu criei com o Claude que me fez ir pra uma segunda reunião com o cliente e falar: "Está aqui a resolução do seu problema." O cara ficou: "caraca, irmão!"

---

### [40:00] Fechando R$1.000/mês recorrente em vez de R$4 mil à vista

> **Alex Campos:** Vamos lá. Eu fiz a reunião com o cara, era às seis da tarde. Quando era três horas da manhã, mais ou menos, nas minhas loucuras aqui, eu mandei uma mensagem no WhatsApp do cara falando que era a Clara, como se fosse a IA mandando a mensagem pro cara, que o sistema dele tava pronto. Mano, no dia seguinte, dez horas da manhã, esse cara tava no meu WhatsApp falando: "Pelo amor de Deus, vamos fechar isso, como que a gente faz pra iniciar?" Sumiu a objeção, porque a única objeção do cara era como que eu vou lançar isso dentro do sistema.
>
> **Cinthia:** Pergunta: você cobrou o desenvolvimento do sistema ou você preferiu focar no fee?
>
> **Alex Campos:** Eu preferi focar no fee. O sistema, pra mim foi um protótipo e eu vou conseguir replicar isso pra outros nichos e outros clientes. Já pensei no Ramon na parte de atacado. Pra atacado isso aqui é sensacional. Elimina aquele BO da galera ter que ficar preenchendo o campo personalizado.
>
> **Kleber Fernandes:** Perdi o começo.
>
> **Alex Campos:** Não, não, vai de boa, depois você assiste. Tá muito massa. Foi isso que fez o cara fechar. Pra vocês terem noção, o cliente veio, ele queria uma implementação de CRM, e já tinha recebido algumas ofertas de outras pessoas de implementação de 4 mil reais. Na reunião eu falei: "Meu preço é 8." Ele falou: "Você tá louco, irmão, você tá me cobrando o dobro." Eu falei: "Não, eu tô te criando um negócio pra ser 100% personalizado." E na própria reunião, ele veio com o propósito de "não, eu poderia pagar pelo menos mil reais por mês".
>
> Cara, eu sou vendedor. O que eu fiz? Eu vou cobrar 12 mil reais desse cara, eu vou criar algo que ele vai depender do sistema, e esse cara vai ficar me pagando mil reais por mês? Exatamente. Aí o que eu fiz? Eu vendi pra ele uma recorrência no Stripe de mil reais por mês. A venda é de doze mil? É. Eu recebi os doze mil? Ainda não. Mas eu preferi vender uma recorrência de 12 mil, sabendo que esse cara pode ficar comigo 12 meses, 24 meses. E ele mesmo trouxe pra reunião, ele tem outras dores. Uma delas eu já matei na última reunião, eu dei de brinde pro cara.
>
> Por quê? O Claude ele cria as paradas muito rápido. E por que eu tô fazendo isso? Eu crio as paradas pra amarrar o cara dentro da minha recorrência. O meu jogo é trazer o cliente pra dentro da plataforma e o cara usar a plataforma pro resto da vida. E dificilmente ele vai trocar.
>
> **Oceano Azul:** Dificilmente ele vai trocar porque tem algo ali que ele não vai comprar em lugar nenhum.

---

### [44:00] O Kanban da produção entregue de brinde

> **Alex Campos:** Aqui, olha o que eu fiz, que eu não mostrei pra vocês: a produção. Mano, na hora que eu mostrei isso aqui, o cara quase chora. Ele falou: "Não, é mentira, velho, que você criou isso aí." Ele falou que talvez queria isso. Na reunião de entrega, eu já entreguei isso pra ele.
>
> **Kleber Fernandes:** Como se livre, já.
>
> **Alex Campos:** E o que isso faz? Pergunta: você acha que o operacional do cara vai ficar entrando dentro do CRM pra operacionalizar? Não. O que eu fiz?
>
> **Kleber Fernandes:** Você criou um Kanban.
>
> **Alex Campos:** O cara lá da operação, a única coisa que ele precisa fazer é isso aqui. Porque o gerente precisa visualizar onde tá o pedido do cliente, e ele não sabe. O gerente não sabe, o dono não sabe, ninguém sabe. Quando o cliente pergunta, ninguém sabe. Tem que ficar perguntando pra um monte de gente. Aí deu erro, vamos lá, o pedido deu problema. Precisa ser alertado, peça torta, confirmar problema, pronto. O bagulho fica piscando ali na cara do cara, porque isso precisa voltar pro corte ou fazer alguma outra coisa.
>
> **Kleber Fernandes:** Pelo próprio processo de fabricação dele, ele não tem como automatizar isso, ele tem que olhar mesmo.
>
> **Alex Campos:** Exatamente. É um negócio simples. O cara falou: "Eu vou comprar um tablet pra cada um, vou colocar isso aí e a galera vai ficar olhando." Pergunto: quando é que esse cara vai sair da plataforma? Não vai. Não tem nem como esse cara sair, porque a operação dele vai estar amarrada, a galera vai estar acostumada.
>
> E aí, onde está o poder das soluções que você cria? Não sei o que vocês têm criado, depois a gente troca essa ideia. Mas essa foi uma das soluções que eu criei, que eu achei fantástico.

---

### [47:00] Padronização visual: identidade BMW + painel TDI substituindo Miro

> **Alex Campos:** E aí, eu não sei se vocês estão olhando aqui, o cara gosta de carro. E eu trouxe a personalização da BMW na parada. Eu usei as cores da BMW. Você vê aqui, tem a faixa da BMW, azul, vermelho. Eu gostei muito desse padrão de painel. Agora tudo que eu vou criar pro cliente. Aí eu criei. Aqui é o processo comercial dele, entra toda a parte de ICRM. Eu fazia isso dentro do Miro. Não sei vocês, a maioria que me conhece sabe que eu sempre usei o Miro. Cara, teve uma vez aí que eu acabei compartilhando com alguns clientes, na hora que eu vi veio uma lapada de R$250 de Miro porque eu compartilhei o fluxo com outras pessoas. E tá na plataforma terceira, é do Miro.
>
> O que eu fiz? Eu trouxe aqui pra dentro. Isso aqui é um HTML, onde eu entrego algo muito visual, personalizado pro cliente. Aqui todo o funil dele, toda a SLA de resposta, as conversas. Como funciona a parte de... explicando cada ícone. Esse aqui é um print, eu dei um print do chat e mandei pra cá, explicando o que é cada um. Na parte de conversas, explicando o que é cada botão. A lateral da direita, o que significa cada um, o que faz. O sistema de pedido, explicando como funciona. Quais são as atividades do Chico, que é o dono, da Tainara, da Bia. A Bia é uma agente de IA. Eu vendi pra ele também depois um agente de IA. Porém eu tenho feito agente de IA de outra forma, não estou usando o GHL. Apesar de estar usando também o GHL, eu tenho usado outros também. O Leandro e a Luísa, a Jéssica e o Edmilson, as regras de ouro, e um glossário. Porque assim, a maioria dos clientes eles não sabem o que significa Lead, Stage, Open, SLA. Então eu trouxe uma simplificação.
>
> Cara, pode ser que o cliente nem use isso, nem pesquise, vai perguntar pra mim. Mas isso aqui já fica documentado, facilita a minha vida, os meus treinamentos. E visualmente o cliente percebe e fala: "Caraca, que entrega, caramba. O que esse cara tá fazendo pro meu negócio?"
>
> Só que agora eu não sei se vocês perceberam. Qualquer cliente que entra agora, eu falo: "Pega o modelo TDI da F5 e replica."
>
> **Kleber Fernandes:** Tá pronto já. Só mudo o nome do cliente.
>
> **Alex Campos:** Exatamente. Isso parece bobagem, mas esse efeito aqui é encantamento. A Apple trabalha dessa forma. É a gente trazer elementos de forma visual.

---

### [51:00] Excalidraw substituindo Miro pago

> **Alex Campos:** É que vocês não viram a proposta. Aqui eu já crio também o fluxo. Na verdade eu não crio, quem cria é a própria IA. E ela criou um modelo sensacional que talvez nem eu criaria. Existe um fixo, essa ferramenta que cria esses fluxos, depois eu mando lá no grupo, que é o... agora eu esqueci o nome. É Draw, não sei o que é Draw, é um criador de fluxos. Cara, é sensacional, depois eu mando pra vocês no grupo.
>
> **Cinthia:** Excalidraw.
>
> **Kleber Fernandes:** Excalidraw, é.
>
> **Alex Campos:** Exatamente, isso aí, Excalidraw. Aqui eu consigo, aquele lá ele fica fixo e esse eu consigo mudar. Eu consigo, junto com o cliente, igual mesmo. Eu fui pra reunião com o cliente, a única coisa que ficou faltando no processo do cliente foi a etapa de designer, porque precisa passar por um designer antes da aprovação do layout com o cliente. Cara, esse aqui quem criou 100% foi o Claude. Nem eu, nos meus maiores treinamentos e sonhos da vida, eu criaria um fluxograma tão bem feito como o Claude criou. Legenda, e o cliente tem toda essa documentação.
>
> E aqui tá, aqui eu já mostrei pra vocês, o CRM dele, e vocês sabem que você pode embedar um... Isso já faz parte do CRM dele, os pedidos aqui. Trouxe como ícone personalizado. Então ele consegue fazer todo o pedido, já integrado com CRM, integrado com Omie, que é o ERP dele, com a personalização que eu trouxe.

---

### [54:00] Conceito de snapshot pessoal e Painel TDI gerado pelo Claude

> **Alex Campos:** Vamos ver agora o que ele criou aqui. Pronto, já criou. Vamos ver da nossa demo. O Alex já criou a subconta. Vou pedir pra ele abrir no meu browser, abre o link do navegador. Pessoal, o que eu indico pra vocês: crie o método de vocês, crie um padrão. Pegue essa ideia do GHL de snapshot e traga pro negócio de vocês. Quando a gente fala de snapshot, ele não precisa ser só o snapshot do próprio GHL. Snapshot pode virar todo o teu processo de criação. Tudo aquilo que você cria, pode replicar, pode virar um snapshot.
>
> Pronto, está aí. Ele já criou o painel. Criou todo o painel TDI, a pauta da reunião, o mapa do processo, o hub da conta, os custom fields que ele sugeriu, ele já deu o que a gente já criou. Ele já criou o campo field de CNPJ, razão social, drop down de regime tributário, segmento, faturamento mensal, inscrição estadual, data de abertura da empresa, as tags operacionais. O pipeline comercial ele não cria, mas eu vou mostrar pra vocês como a gente faz pra criar de forma fácil. E aqui na reunião, pode falar.
>
> **Oceano Azul:** Aquele teu negócio lá, sei lá, do Excalidraw, ele é editável ali pelo navegador?
>
> **Alex Campos:** Editável. Aqui ó. Faz sentido pagar uma ferramenta mais barata que seja, que no caso do Miro é R$40, a conta mais barata, mas não faz sentido pagar uma ferramenta quando vocês podem usar isso gratuitamente, que vai cumprir o mesmo papel, que é mostrar um fluxograma pro cliente.
>
> **Kleber Fernandes:** O Claude você está usando ele puro ou com um orquestrador?
>
> **Alex Campos:** Não, eu tenho várias skills, vários agentes, sub-agentes. A ideia é essa, você vai criando o seu Claude. A ideia não é trazer uma aula de Claude, depois a gente pode pensar em alguma coisa. Mas algo que eu posso trazer pra vocês é: use o Claude de forma personalizada. Sempre traga o seu modo de fazer. Aquilo que você faz de forma repetitiva, pergunta pra ele "isso que a gente tá fazendo pode virar uma skill, um agente, um sub-agente, um método, um framework?" Só isso já vale.
>
> Tem gente vendendo mentoria pra falar isso pra vocês. Se você trabalhar nessa mentalidade de métodos, o seu agente, o seu Claude, ele vai ficar muito bom. Tem uma galera que fala pra mim: "Alex, mas o meu Claude eu falo pra ele e ele não faz." Mano, é porque você não treinou ele no que ele tem que ser feito. Talvez você tá usando pouco. Eu tô três meses pagando R$1.100, a conta Max 200, e usando essa parada durante 16, 18 horas por dia. Faz três meses que eu tô nessa parada. Então aprendi muita coisa. Com quem? Com o próprio Claude. Vivência mesmo, mas com background daquilo que eu já sabia. Foram seis anos que eu peguei e falei: "Irmão, essa parada que tá aqui, que eu não tenho braço mas tenho muita vontade, eu sei o que eu quero, faz pra mim." Essa é a mentalidade.
>
> **Cinthia:** O framework no Excalidraw, você cria manual? Daí você pega tudo que está na sua cabeça e vai desenhando, ou lá você também usa o Claude pra criar?
>
> **Alex Campos:** Não, o Claude eu pedi baseado no cliente, no processo do cliente que a gente mapeou no onboarding, pra ele criar o fluxo.
>
> **Cinthia:** Então ele cria esse fluxo compilado também? Ele já criou o fluxo daquele jeito?
>
> **Alex Campos:** Ele criou o fluxo exatamente desse jeito e eu falei: "Caraca, de primeira, galera, de primeira." Mas é aquilo, pode ser que o de vocês não crie, porque talvez vocês não treinaram ele com o conhecimento que eu já tinha de fluxograma.
>
> Só pra vocês terem noção, nos últimos dois meses eu fiz 12 implementações de CRM usando o Claude. O meu Claude tá bem treinado. Ele sabe cada palavra. Quando eu falo, mesmo que eu fale errado, ele já sabe o que tem que ser feito.
>
> **Kleber Fernandes:** Só de você estar dando esse passo a passo, esse método, é de onde a gente já vai partir, cara.
>
> **Alex Campos:** Exatamente. Quem pegar isso, com certeza vai sair na frente do mercado.
>
> **Cinthia:** Fazendo uma observação, realmente eu acho que hoje a minha maior dificuldade com o Claude é saber como eu vou configurar ele de maneira que siga um padrão, sabe? O documento lá do Claude.md bonitinho, ali bem listado o que ele precisa fazer, e que quando ele acessa a pasta ele siga aquela lógica.
>
> **Alex Campos:** Maria, depois a gente vai ter algumas aulas só de Claude pra gente trazer isso pra vocês.

---

### [60:00] Apresentação do segundo case: clínica de nutrição Dr. Reinaldo

> **Alex Campos:** O mapa do processo. Tá vendo? Eu não dei... legal, tem até aberto aqui. Tá vendo que ele não criou igual? Mas por que ele não criou igual? Cara, você viu o prompt que eu dei pra ele? Só falei pra ele "faz igual da F5". Se eu tivesse dado o link da F5, ele criaria igual. É você dar elementos, contexto. Só que, cara, já ficou bom. Na verdade, ele seguiu um padrão, eu vou falar, ele até melhorou pra mim, tá bem melhor que aquele. É porque ele trouxe cores, trouxe um emblema. Mas eu posso trazer pra ele. Esse aqui já não é o editável, esse já é o fixo. Lá tá editável, lá tem o fixo, tá editado. Aqui vamos ver o que ele criou pra nós.
>
> **Kleber Fernandes:** Cara, mas só isso aí ninguém entrega, velho. Ninguém entrega isso aí.
>
> **Alex Campos:** É, aqui é a subconta. Beleza, vamos ver o que mais. Ele criou a pauta. Tem alguém entrando aqui. E aí, rapidamente, vocês viram aqui, eu vou mostrar outra solução que eu criei, que tá ficando muito massa também, que é por nicho de nutrição. Cara, isso aqui ficou animal, de verdade. Vou abrir aqui.
>
> Na travada aqui, normal. Por isso que eu preciso comprar um Mac Pro 28 Megapower Terabyte. Né Dr. Lucas, tu comprar um Megapower M18. Que abre o Reinaldo. Cara, olha que doideira. Ele falou: "Ó, quem pôde? Reinaldo, irmão!" Ele sabe quem é o Reinaldo, turma. Por quê? Ele tá treinadinho. Ele sabe quem é.
>
> **Cinthia:** Por quê?
>
> **Alex Campos:** Porque eu tenho lá na minha pasta todos os clientes, todo método, todas as demonstrações. Galera, pede pra ele te dar uma aula, te trazer informações sobre aquele tema que tu tá com dificuldade. "Eu tenho dificuldade em criação de processo." Pera, pede pra ele buscar. Eu sempre vou dizer: "Vai, faz uma pesquisa profunda sobre esse tema e cria um método de estudo pra mim treinar." Você mesmo aprende. Eu vejo que a galera usa o Obsidian. No início, o meu tá até salvando lá, tudo lá, mas eu não salvo lá como principal. Eu salvo num banco de dados proprietário. Até porque amanhã se o Obsidian cair ou quiser me cobrar 50 mil dólares, eu perdi todas as informações. As minhas informações tá tudo dentro do meu banco de dados proprietário.

---

### [66:00] Empacotando solução como produto: a leitura do Kleber

> **Alex Campos:** Ele já trouxe aqui. Abre o painel dele. Abre o painel. Isso aqui é pro seu, Lucas. Acho que pra você faz muito sentido. Abre o painel do check-in. Aí eu vou mostrar um negócio pra vocês.
>
> O check-in do cara, ele é nutricionista. Então toda semana, todo dia, ele tem uma funcionária. Se liga, galera. Olha onde tá o ouro. O ouro do negócio de vocês tá dentro das dificuldades e necessidades que os seus clientes têm no dia a dia. Vocês precisam fazer mais reuniões com os clientes de vocês, entender as dores deles e trazer soluções. Vai criar apps, vai criar soluções com o Claude pra dores que o cliente de vocês tem no dia a dia.
>
> Eu vou mostrar aqui, depois a gente vai abrir pra dúvidas, e depois a gente vai fazer um hot seat, discutir algumas soluções que vocês têm criado. Cadê o Reinaldo? Peraí. Tá aqui o check-in. Aqui tem uma senha de segurança, eu não lembro agora.
>
> **Kleber Fernandes:** Você pensou na entrega como um produto mesmo, né cara? Porque você entregou pro cara a solução dele, e aí eu fico imaginando como se fosse numa caixa. Chegou o produto dele, e aí você entregou também o manual de instruções do produto.
>
> **Alex Campos:** Exatamente isso.
>
> **Kleber Fernandes:** Empacotou, não só empacotou, mas materializou um produto.
>
> **Alex Campos:** Aí é digital.
>
> **Kleber Fernandes:** Eu nunca vi. Ninguém fazia isso aí.
>
> **Alex Campos:** Eu gosto muito de vocês, por isso eu quis trazer essas aulas. Coisas reais que eu tô fazendo no dia a dia. Eu tava com saudade de dar aula. Bora lá, enquanto abre, eu não tô lembrando a senha. Vamos abrir pra dúvidas, depois a gente volta.

---

### [68:00] Hot seat parte 1: dúvidas do Kleber e Dr. Lucas sobre PIT e escopos

> **Kleber Fernandes:** Não briguem, ergue a mão e tirem a dúvida.
>
> **Alex Campos:** Atender um por um.
>
> **Kleber Fernandes:** Você começou aí, eu tava anotando. A primeira coisa, você pegou o PIT da integração privada, né?
>
> **Alex Campos:** Isso.
>
> **Kleber Fernandes:** Assim, não repara, cara, porque é o seguinte, eu comecei ontem.
>
> **Alex Campos:** Não, tranquilo, a ideia é essa.
>
> **Kleber Fernandes:** De repente faço uma pergunta assim...
>
> **Alex Campos:** Pessoal, não existe pergunta boba. Existe pergunta que você não sabe. Se você não sabe, é o que você tem que perguntar. De boa, tranquilo. Tô aqui pra isso.
>
> **Kleber Fernandes:** Aí eu tava fuçando tudo, e tentei seguir o que você fez. Peguei o PIT e coloquei aqui no Claude, e o Claude perguntou pra mim: "Você vai querer criar uma subconta no GoHighLevel? Então você precisa me dar algumas informações." Ele falou, se era via API do GoHighLevel.
>
> **Alex Campos:** Vamos lá, a gente fez duas etapas. A gente pegou o PIT da agência pra criar a subconta. Depois, com a subconta criada, a gente conectou a subconta. Fazendo a primeira etapa.
>
> **Kleber Fernandes:** Na primeira eu fiz isso, abri o terminal, ali, abrir um diretório, um terminal.
>
> **Alex Campos:** Como é a primeira vez que você está criando e você não tem a skill que eu tenho aqui, ele não sabe o que fazer, por isso que ele está te perguntando. Mas você só vai falar pra ele: "Não, cria o cliente do nome tal e o email é..." Só fala: cria a conta. Porque aí ele vai criar a conta sem o usuário. Se eu tenho usuário, se eu tenho nome e email, ele já cria a conta com o usuário.
>
> **Kleber Fernandes:** Quando ele pediu, eu dei aula01 e peguei o PIT. Daí falei pra ele: "Cria uma subconta pro Claude, PIT tal." Daí ele falou: "Como que você quer que eu prossiga? Via API do GoHighLevel, script automatizado, explicar o processo ou nada disso?"
>
> **Alex Campos:** A skill faz toda a diferença. Na hora que eu mandar a skill pra vocês, ele não vai nem perguntar isso, ele já vai criar automático. Alguém mais tem alguma dúvida? Ou quer falar outra coisa? Vamos lá galera.
>
> **Dr. Lucas Moraes:** Eu vi ali o PIT, eu não tinha usado essa opção ainda, mas vi a diferença. Um tem uma quantidade X de escopos, o outro tem 146 escopos. Mas são escopos mais apertados e diferentes.
>
> **Alex Campos:** O escopo da agência é referente a criações e endpoints baseado no perfil agência.
>
> **Dr. Lucas Moraes:** Quando eu for mexer com alguma subconta específica?
>
> **Alex Campos:** Aí você vai dar o da subconta e a localização.
>
> **Dr. Lucas Moraes:** Aí eu pego a localização e jogo isso no navegador?
>
> **Alex Campos:** No próprio link, na hora que você cria o escopo, como você já está na conta, lá no link da barra de tarefa, ele já tem a localização. Se você tiver com a sua conta aberta, vai ver que já está escrito lá: Location. Eu mando o link completo pra ele.
>
> **Dr. Lucas Moraes:** Você não manda o link completo?
>
> **Kleber Fernandes:** É, eu mando o link completo.
>
> **Alex Campos:** Ele já vai saber, ele já sabe o que ele precisa. Pra não precisar ir lá copiar só o ID, eu já mando o link completo que ele já sabe.
>
> **Dr. Lucas Moraes:** Isso pra quando você, por exemplo, vou mexer com a conta 2 agora. Você fez a conta 1, deu aula 1. Quero mexer agora na subconta 2.
>
> **Alex Campos:** Isso, ele vai saber.
>
> **Dr. Lucas Moraes:** Vai lá, pega esse link e joga pro PIT, e pronto.
>
> **Alex Campos:** Cada subconta tem um ID, que é um PIT diferente, e uma localização, que é o ID da conta. Esse ID que está na localização é o ID da subconta, é como ele vai diferenciar.
>
> **Dr. Lucas Moraes:** Mesmo com aquele PIT, o PIT dessa subconta eu preciso passar essa location também? Mesmo com o PIT?
>
> **Alex Campos:** Geralmente ele pede a localização, ele não sabe do que significa o ID, porque um ID pode ser um ID de qualquer conta.

---

### [73:00] O que dá e o que não dá pra criar via API + snapshots de pipeline por nicho

> **Dr. Lucas Moraes:** E com esses 146 escopos ali, isso me atende em todo nível?
>
> **Alex Campos:** O que ele não faz ainda, de tudo que eu fiz, ele não cria a pipeline. Mas depois vou mostrar pra vocês como eu crio. Cara, é tão rápido criar uma pipeline depois que você já tem ela desenhada, que até dá pra usar automático, depende do meu nível de preguiça. Se eu tô muito preguiçoso, eu peço pra ele criar, ou fazendo outra coisa. Ele usa lá uma extensão, um MCP. Eu nunca lembro o nome dessa ferramenta, mas é uma ferramenta que ela cruza o navegador e mexe sozinho. Mas aí ele demora muito, fica viajando ali. Mas ele cria. Eu acho mais rápido eu criar.
>
> O que eu fiz pra minimizar isso? Como eu vi que estava sempre tendo que criar manual ou via essa ferramenta, eu já tenho meio que alguns snapshots prontos de pipelines. Vamos lá, todo CRM precisa de lead de entrada. Então o que eu fiz? Eu categorizei alguns nichos, alguns mercados, e já criei alguns snapshots baseados nesses mercados. Já tenho essa estrutura de pipeline meio que pronta. Vou criar um novo cliente, já crio esse novo cliente com esse snapshot do pipeline pronto. Já ganhei horas porque eu fiz isso antes.
>
> **Dr. Lucas Moraes:** O que você mostrou hoje sobre as camisetas ali, o tamanho de camiseta, mas pensando dentro de um consultório, uma pipeline de um consultório, que seria como se fosse um CRM mesmo, mas cada campo personalizado é alguma coisa, é um exame que a pessoa tem que ver, é um exame que chegou, algo urgente. Por ali eu consigo, com esse PIT, criar esses campos, mapear, utilizar?
>
> **Alex Campos:** Campos personalizados, sim. O que não dá pra criar? Pipeline e as automações. Fora isso, eu consegui criar tudo: custom object, campo personalizado, tag. O que mais? É porque geralmente é isso que a gente cria numa implementação.
>
> **Cinthia:** Mas o agente também não dá pra criar?
>
> **Alex Campos:** Agente não. Agente ainda não. Mas dá pra criar o prompt pra você utilizar no agente.
>
> **Cinthia:** Então, ontem eu tentei criar. Até cria, mas nessa extensão de navegação, só que era muito lenta.
>
> **Alex Campos:** Às vezes, vamos lá, você tá fazendo outra coisa, você tem duas telas, põe uma tela, deixa ele lá trabalhando e vai trabalhar na outra.
>
> **Cinthia:** Eu fiz isso, depois fui correndo em cima de algumas coisas que ele tinha feito.
>
> **Alex Campos:** Mais alguma dúvida, Lucas?
>
> **Dr. Lucas Moraes:** Não, achei interessante. Eu tinha visto alguma coisa, mas não tinha fuçado nisso. Eu tenho que entregar uma implementação também. Estou pensando aqui em uma forma de fazer via Claude Code também.
>
> **Alex Campos:** Qual?
>
> **Dr. Lucas Moraes:** Se adianta como você mostrou aqui. Eu peguei o meu PIT aqui e fiz de teste. Eu consegui fazer a migração. Eu só falei de onde que era. "Esse aqui é do GoHighLevel", e ele já conseguiu.

---

### [78:00] Pergunta-chave da Cinthia: por onde começar, complexo ou simples?

> **Cinthia:** Alex, eu tenho uma pergunta, aproveitando uma situação que daí já me ajuda. Eu estou com dificuldade, você até falou hoje de criar dentro da conta backup. Por exemplo, eu crio todo o planejamento da estrutura de campanha do cliente. Vou dar o exemplo do Dr. Mauro. Como vai ser a campanha, quais são os canais de aquisição, a atração do pago, vai ser por formulário, WhatsApp, quem vai fazer cada coisa. Aí eu senti muita dificuldade porque percebi que eu coloquei a carroça na frente dos bois. Eu montei uma pipeline inteira baseada no que eu achei que seria o funil de vendas dele. Então, o lead, cai a lead, depois primeiro contato, o boss vai fazer a qualificação dele, depois follow-up 24, 48, 72, aquela coisa toda. Eu criei tudo, workflows, automação, toda aquela coisa. E aí, quando começou a rodar a campanha, eu vi que tipo assim, eu fiz toda uma estrutura e na prática ela tava... não foi funcional. Não funcionou nada do que eu tinha pensado. Por quê? Tem fatores que a gente tem controle, como essa parte de automação, e os que a gente não tem controle, que são os porra dos vendedores que não fazem a parte deles.
>
> Hoje você que já tem essa estrutura, essa questão de organização, como você faz esse tipo de estrutura para o cliente? De uma campanha, por exemplo. Eu sei que você não faz, mas acho que o trabalho de fábrica. De GHL mesmo, o que seria ideal? Tá lá na conta do... A conta backup, criar toda a estrutura, ou criar o básico primeiro, fazer isso e isso primeiro, aí eu vejo o que vai rolar e daí vou fazendo no meio?

---

### [80:00] A regra do básico bem feito: 95% da dor do cliente

> **Alex Campos:** Muito boa sua pergunta. Eu entendi exatamente a sua dor e eu sofri bastante com isso. Geralmente nós que gostamos de automatizar, a gente quer criar uma parada mirabolante, tipo o Megazord Blaster pro cliente. E aí na hora que o cliente vai usar, ele não usa nem 10% da parada.
>
> O que eu aprendi depois de vários anos e depois de 12 implementações seguidas do GHL? Básico bem feito vai resolver 95% da dor do seu cliente. Porque ele não tem processo comercial, ele não tem CRM. Só de você criar um pipeline, criar uma automação simples, básica, já vai resolver 95% da dor dele. E isso virou a minha chave também. Nós não queremos ganhar recorrência, então eu entrego muito rápido algo que já vai resolver a dor do cliente. Só que aí ele vai ter uma ferida. E aí eu vou lá e resolvo essa ferida. O cliente tá satisfeito. E pode aparecer uma outra dor, aí eu vou lá e soluciono essa outra dor. Do que eu ter que, da minha cabeça, pensar numa estratégia mirabolante, criar um fluxo gigantesco com 18 automações, que vai dar piruleta, que vai chamar não sei o quê, e no final das contas o cliente não usa.
>
> Depois disso, diversos nichos. O básico bem feito. Quando eu falo básico mesmo, porque a maioria dos nossos clientes hoje não tem processo comercial. E quando você já entra com a implementação de um CRM, com um Kanban, com algumas... Por que eu tô falando? Teve empresas que eu fui lá e criei pensando numa implementação foda. O cliente falou: "Não, não quero isso, tira isso, faz isso, faz isso." Eu falei: "Caraca, se eu soubesse, eu tinha feito só isso."
>
> **Cinthia:** É tempo de inventar esse carro. Eu plantei a minha solução pra ele que daria certo e ele não.
>
> **Alex Campos:** A gente tem que escutar o que ele quer, entregar o que ele precisa, mas dentro daquilo que ele de fato precisa, não aquilo que a gente quer entregar 100%, porque vai dar problema. E principalmente automação, vai criando automação baseado na necessidade do cliente. Quando o cliente apontar a mão e falar "eu tô repetindo muito isso, não tem como automatizar?", aí você vai lá e cria uma automação. Mesmo que demore cinco minutos, entra numa demanda de entrega. Às vezes você já tem essa automação pronta e outro cliente só vai lá e truca.
>
> **Cinthia:** Esse básico que você falou, esse arroz com feijão, no caso você já criou várias estruturas que você foi validando, e aí você pega isso e replica para os outros.
>
> **Alex Campos:** É isso aí.

---

### [83:00] As 5 automações arroz-com-feijão de todo cliente

> **Cinthia:** Exemplos?
>
> **Alex Campos:** Campo personalizado de rastreamento. A maioria dos clientes não tem rastreamento. Eu só preciso criar um campo personalizado pra pegar os campos do Stevo e mapear esses campos e criar o campo personalizado pra voltar pra Meta. Pronto. São duas automações simples e eficazes que a maioria dos clientes não tem e que você implementa.
>
> **Cinthia:** Mas pra mim é o básico, follow-up mesmo. Eu tô com problema de follow-up de cliente.
>
> **Alex Campos:** Já pode criar um template. O próprio agente Builder lá, se você pedir pra ele criar a automação de follow-up por SMS, se você estiver usando SMS, ele já vai criar. Aí só você dar pra ele assim: "Eu quero follow-up de D1, D3, D7 e D21." E ao invés de você colocar a mensagem, coloca placeholder. Eu já não sei se é esse o nome que se fala, placeholder, é aquilo que você vai alterar. Pra você usar como template. Pronto, já tá pronta a automação de follow-up pra todos os clientes. É a mesma, não muda. O que vai mudar é a mensagem.
>
> Outra automação que você já pode deixar pronta: cliente pede boas-vindas. Outra automação que a maioria dos clientes pede: ausência de horário, fora do horário comercial. NPS, automação que você já pode criar, todo cliente pode utilizar. E quando eu falo NPS, é algo básico, gente. A maioria dos clientes não tem. Mandar o link.
>
> Outro gatilho que você pode usar pra usar a própria ferramenta. Pra quem vende, eu não vendo mais isso, mas a agência que vende, vender a otimização do Google Meu Negócio, usar o próprio GHL pra fazer isso. Você pode criar o NPS depois de sete dias da compra, mandando o link do Google Meu Negócio, ou antes. Tem gente que gosta de mandar no dia seguinte, que o cliente já tá ali meio satisfeito. Depende de negócio pra negócio.

---

### [86:00] O dilema de Cinthia: tirar pessoas do processo

> **Cinthia:** É, eu tava pensando. Esses básicos aí, o problema. Nessa campanha específica, eles não têm o time comercial mesmo, tem duas meninas que são assistentes de dentista e comercial.
>
> **Alex Campos:** A maioria das clínicas, quando se trata de clínica, não tem comercial, gente. A galera fala que tem, mas não tem.
>
> **Cinthia:** A menina ajuda as outras coisas, não tem argumento de venda nenhum.
>
> **Alex Campos:** Quanto menos trabalho essa menina precisar fazer, mais resultado você vai ter.
>
> **Cinthia:** Esse que tá o problema. Eu tava fazendo uma análise aqui. Em 12 dias foram 68 leads vindos de campanha do formulário. Tem 52 parados na porra do follow-up que a menina tinha que fazer e não fez. De caso específico, a pessoa precisava da panorâmica, a pessoa precisava fazer a simulação de financiamento. E aí não sei, tá parado lá. E aí você fica falando pra pessoa, ela fala: "Mas eu não sou vendedora, eu tenho outras coisas pra fazer, mandar mensagem pros outros clientes, são dois dentistas..."
>
> Então eu tava pensando. Eu acho que o caminho, eu tenho certeza que o caminho que eu vejo pra mim é pensar em soluções, criar soluções que dependam cada vez menos de pessoas operando aquilo. Porque chega na pessoa, é igual... Por isso que o marketing pra mim foi perdendo o brilho, perdendo a graça, comecei nisso e foi perdendo a graça. A partir do momento que a gente cria uma coisa magnífica, bem estruturada, só que você precisa de dados pra alimentar aquilo, precisa de pessoas operando aquilo pra dar certo. E aí a decepção que o cliente traz pra gente de "o tráfego não tá dando certo, o marketing não funciona" e tá envolvido mais com a parte dele do que da gente.
>
> É o caminho que eu quero seguir. Eu contei o que você falou da questão da solução dos pedidos. É uma coisa que depende cada vez menos de você. Porque aí eles têm que fazer independente de qualquer coisa, a gente tá melhorando a vida deles. E o CRM pra eles também, eles vão operar porque eles não precisam tanto de argumento de vendas, porque como já vem meio pronto pro cara tirar o pedido, ele não precisa fazer toda aquela estrutura. E você fica na retaguarda, vendo se tá tudo funcionando e dando os mais possíveis as soluções pra melhorar cada vez aquele processo, ganhando numa recorrência em que você precisa se envolver cada vez menos com as pessoas envolvidas no processo. Entendeu? Eu penso isso.
>
> **Alex Campos:** Esse é o jogo.

---

### [90:00] Case Dr. Reinaldo: check-in semanal do paciente como produto SaaS

> **Alex Campos:** Vou mostrar aqui, abriu aqui. Estava mandando o código lá para a Cloudflare, eu nem lembrava. Vou mostrar aqui pra vocês o que eu fiz pro Dr. Reinaldo, que é uma clínica de nutrologia. Cara, solução simples, o cara usava tipo um formulário do Google. Esse cliente me paga R$497 na plataforma. E eu te pergunto: o processo deles...
>
> O que o cara faz? Todo dia ele tem uma funcionária, que é a secretária dele, que manda o link do check-in para os pacientes. O que é esse check-in? É um formulário pro cara preencher como foi a semana dele, se ele teve ansiedade. O que eu fiz aqui? Eu automatizei dentro do CRM, junto com os custom objects. Ele vai ter o check-in aqui. Aqui é o painel, deixa eu pegar aqui, ele não abriu o link. Eu quero o link que manda pro cliente. Imagina que isso aqui que eu criei, eu vou tirar 95% da função da funcionária dele. Porque ele tem uma funcionária só pra ficar mandando esses links pras pessoas.
>
> **Cinthia:** Ah, eu tenho um que manda pra mim também toda semana. Só que é manual. "É um prazer ter você como paciente", ela copia e cola. Eu já falei várias vezes pra ele, meu sonho é melhorar o negócio dele lá no display também. Eu acho que isso aí é uma super ideia, porque ela pergunta toda vez: "Como você passou a semana? Teve náusea? Passou mal?"
>
> **Alex Campos:** E olha que legal, ele criou de uma forma que eu não posso mandar pra outro. Ele pega tipo o ID do paciente, o ID do lead e coloca no link. E isso vai ser disparado automaticamente. Aí eu coloquei um cron e ele envia automaticamente todo dia das 15h, exatamente. Eu repliquei o que ela faz: das 15h, que é quando ela chega, ela trabalha das 15h às 21h, das 15h às 19h a automação vai ficar mandando os links dos pacientes do dia.
>
> Outra coisa, ele guardava isso dentro do... ele não tem relatório, então ele tem só os dados lá do próprio formulário do Google, na planilha do Google. Ficava tudo lá, tem lá duas mil informações e ele tem que ficar lendo aquilo de forma manual. Não tem gráfico, não tem nada. Ficou muito massa isso aqui. Isso aqui vira um produto, na verdade vai ser um produto que eu vou oferecer agora para várias outras clínicas de nutrição.
>
> Lucas, o seu paciente precisa fazer um checklist disso? Tipo uma anamnese?
>
> **Dr. Lucas Moraes:** Eu faço a anamnese com o cara, mas é algo muito personalizado. Existe um trilho, mas não é fixo. Eu sigo aquele trilho.
>
> **Alex Campos:** Pra utilização faz mais sentido, né? Pro emagrecimento, essa galera.
>
> **Dr. Lucas Moraes:** Ele depende de orientações específicas dentro do consultório pra exercícios, pra um direcionamento onde ele tem uma preferência de alguma direção de exercício. É algo bem personalizado mesmo, eu não acompanho virtualmente isso, eu acompanho por algum feedback que ele me dá. Até cheguei a criar uma época disso, mas não pus pra rodar. Mas eu não uso dessa maneira como você mostrou. Aqui top, da hora.
>
> **Alex Campos:** Aqui também não tá pronto, não tá funcional ainda. Mas aqui ele vai conseguir ver todos os check-ins dos pacientes, ele pode buscar o check-in específico. Quem tá sem check-in, quais são os check-ins com alertas, porque o próprio sistema vai gerar isso.

---

### [95:00] Demo do formulário de check-in (upload de fotos, voz, banco de dados)

> **Alex Campos:** Ficou muito massa isso aqui, galera, de verdade. Abriu. Mano, eu preciso melhorar a parte de brand, essas coisas. Mas aqui o cara vai lá e coloca. Olha a experiência. O cara mandava só a planilha do Google. O cara pode subir a foto dele de frente e verso, você já vai pra dentro do CRM. Isso aqui vai alimentar o CRM. Isso que é massa. E já fica pra vocês as possibilidades que vocês podem fazer de outras coisas.
>
> Ele já sobe aqui, ele vai subir as fotos de antes e depois. Vou colocar aqui algo que te aproximou, e pra academia, cinco meses, o que mudou na rotina.
>
> **Kleber Fernandes:** Essas respostas que você fazia antes em banco de dados?
>
> **Alex Campos:** Vai pro banco de dados também. É porque eu sou louco nas metas, então vai pro banco de dados também e vai pro CRM.
>
> **Cinthia:** Olha, dá pra apresentar uma parte de áudio, pra pessoa falar e digitar. Eu fiz isso no meu formulário.
>
> **Alex Campos:** Pronto, dá pra fazer também.
>
> **Cinthia:** Porque a pessoa tem preguiça, vai lá e responde.
>
> **Alex Campos:** Mas é que tá, onde tá o ouro do negócio? O cliente usava uma planilha. Aí eu entrego isso pra ele. O cara já amou, já ficou pirado. Daqui um mês, eu vou lá e crio uma nova feature pra ele. Agora dá pra fazer por áudio.
>
> **Cinthia:** Sabe?
>
> **Alex Campos:** É não entregar tudo.
>
> **Kleber Fernandes:** Exato.
>
> **Cinthia:** É ir dando aos poucos, né? Pra pessoa sempre falar: "Nossa, tem como ficar melhor ainda."
>
> **Alex Campos:** Um dia teve dificuldade, comer à noite. A segunda é difícil. Tipo, como foi a semana. Esse aqui é o ouro pra ele, o cara preenchia no Forms. Faltou um aqui, cadê? Nada, beleza. Feedback, sim. Comentário extra. Revisar. Pronto, aí já sai aqui os resultados e envia o check-in. Pronto, aí volta pro WhatsApp. E chega lá pro... como o cara vai estar? Eu já fiz pensando em mobile. Então já manda o check-in, e essas informações já caem dentro do painel.
>
> **Dr. Lucas Moraes:** Isso é pra antes da consulta dele?
>
> **Alex Campos:** Não, não. Você fechou o plano de negócio com ele, você fechou o pacote pra ele. Então toda semana ele manda pra você, pra acompanhar a sua evolução. Na sua conta, aí você vai ter quatro check-in. Vamos lá, você fechou o plano semestral pra ele, você vai ter 24, sei lá, toda semana você tem um check-in. E aí toda semana você precisa preencher, porque na próxima consulta ele vai analisar todos os seus resultados e vai melhorar o seu plano baseado no seu resultado. Traz toda a evolução do plano.
>
> Aqui não vai ter nenhum dado, porque eu só trouxe um. Mas aqui traz as fotos da semana, os gráficos do cara. Aqui ele já gera uma resposta que eu posso... a Erika pode só clicar aqui e enviar. Abriu o WhatsApp, vou clicar aqui já. Por isso que eu vou embedar dentro do CRM. Ela só clica aqui e já vai. Já tá no quadro. Aí o check-in, e os próximos check-ins, ter alguma nota. Aqui ela pode editar a frase, se quiser não mandar essa mensagem, pode mandar outra. Vou só copiar o texto e jogar no WhatsApp.
>
> **Kleber Fernandes:** E ele tem um relatório completo do paciente.
>
> **Alex Campos:** Relatório completo do paciente. Isso aqui vai pra dentro do... atrelado aos custom objects do paciente. Já tá integrado aqui.
>
> **Dr. Lucas Moraes:** Pô, tô implementando isso agora aqui, cara.
>
> **Alex Campos:** Já tá aqui. E aqui é caso real, galera. Vocês viram, eu fiz o teste, coloquei o meu aqui, já criou.

---

### [101:00] Banco de dados próprio: Postgres direto em vez de Supabase

> **Kleber Fernandes:** O banco de dados é do próprio GoHighLevel?
>
> **Alex Campos:** Aí vamos lá. Vou entregar o ouro aqui pra vocês agora. Eu joguei pra dentro de um banco de dados porque eu já tô indo além. Eu vou entregar esse aqui pra ele. Daqui dois, três meses eu tenho muito de dados, e eu vou vender uma IA pra ele que vai responder sobre o paciente dele, que ele não precisa ficar analisando, ele só pede pra IA ir atrás da estatística.
>
> **Kleber Fernandes:** E ela vai buscar no banco?
>
> **Alex Campos:** Vai buscar no banco de dados.
>
> **Kleber Fernandes:** Aí, no caso, você tá fazendo pelo Supabase?
>
> **Alex Campos:** Eu não uso mais Supabase, eu uso Postgres direto. Porque por trás do Supabase é Postgres, então eu já uso, eu eliminei mais uma ferramenta. Mas eu gosto muito do Supabase. A questão do Supabase é, se você começa a ter um volume muito de dados, você vai ter que pagar.
>
> **Kleber Fernandes:** É MVP, né?
>
> **Alex Campos:** É muito bom pra quem não tem muito conhecimento de banco de dados. Banco de dados é algo que eu já tenho trabalhado já há bastante tempo, então eu já tenho familiaridade com o banco de dados Postgres, que é o principal, que por trás do Supabase é o Postgres.

---

### [103:00] Custom Fields vs Custom Objects: a explicação definitiva

> **Dr. Lucas Moraes:** Alex, esse check-in que você está fazendo é algo específico para esse seu cliente? Eu não tenho essa opção de check-in aqui dentro do...
>
> **Alex Campos:** Não, esse aqui é exatamente onde está o grande uso: os custom objects. Aqui ó, são os custom objects do próprio GHL, valores personalizados.
>
> **Kleber Fernandes:** Mano, é por isso que eu fico louco. Às vezes eu vejo um tutorial e falo: "Pô, de onde o cara tirou isso?" Não explica. Eu falo: "Meu, onde é que tá isso?" Eu não acho aquilo.
>
> **Alex Campos:** Você cria. Você cria esses custom objects aqui. Vamos lá, pensa que são... o CRM padrão, ele vem com três entidades, que é contatos, empresas e oportunidades. Isso já é padrão de todo CRM.
>
> **Kleber Fernandes:** Certo.
>
> **Alex Campos:** E aí você consegue criar novas entidades atreladas ao contato, que são os custom objects.
>
> **Oceano Azul:** Cara, toda vez que vocês verem esses "mais opções" nessa primeira sessão, além das tradicionais, é objeto customizado.
>
> **Alex Campos:** Você consegue criar os custom objects, e você também consegue, a nível de agência, criar as listas inteligentes, o menu inteligente, onde você traz os links de menu personalizado, onde você vai embedar os seus apps.
>
> **Oceano Azul:** Você pode trazer as suas ferramentas pra dentro do CRM. As ferramentas que estão fora.
>
> **Alex Campos:** Eu coloco já o WhatsApp dentro da conta dele pra ele já conectar por dentro do GHS.
>
> **Dr. Lucas Moraes:** Sim, mas assim, que você mostrou o do check-ins...
>
> **Alex Campos:** O check-in vai entrar aqui.
>
> **Oceano Azul:** Não, não é custom fields, é custom objects. Objetos customizados, são os objetos personalizados ali.
>
> **Dr. Lucas Moraes:** Campos personalizados não é?
>
> **Alex Campos:** Não, objetos personalizados.
>
> **Kleber Fernandes:** Eu não localizei eles, não.
>
> **Oceano Azul:** É custom objects.
>
> **Dr. Lucas Moraes:** Tá em configurações?
>
> **Alex Campos:** Isso, configurações.
>
> **Dr. Lucas Moraes:** É, o meu tem objetos, deve ser...
>
> **Alex Campos:** Não, tá aí, objetos.
>
> **Dr. Lucas Moraes:** Objetos.
>
> **Alex Campos:** Tá vendo, aqui vem por padrão: oportunidades, contatos e empresas. Aí eu criei: programas, consultas, check-ins e avaliação do chat.
>
> **Kleber Fernandes:** Ah, tem lá, "adicionar objeto personalizado". "Cria um objeto personalizado para atender as necessidades dos negócios exclusivos."
>
> **Alex Campos:** Você cria os objetos associados a alguma coisa.
>
> **Oceano Azul:** Aí dentro desses objetos você cria campos personalizados. É como se fosse uma coisa à parte dos contatos.
>
> **Alex Campos:** É uma nova entidade. Aí vai aparecer aqui pra você criar. Programas, consultas, check-ins. Tudo que eu quero trazer personalizado no check-in tá aqui: a realidade da foto, fase do site, data da... entendeu?
>
> **Oceano Azul:** Assim como tem os campos personalizados das oportunidades, campo personalizado das empresas e dos contatos, tem o dos objetos personalizados.

---

### [109:00] Casos de uso de custom objects por nicho

> **Alex Campos:** Turma, agora eu quero ver vocês. O que vocês estão fazendo aí com o Claude Code? Me falem aí. Mostrem aí os projetos de vocês.
>
> **Cinthia:** Alex, eu precisava sair.
>
> **Alex Campos:** Não, vai lá. A gente vai finalizar aqui também já.
>
> **Cinthia:** Hora fria nos joelhos ele não dá mais.
>
> **Alex Campos:** Se vocês quiserem abrir o projeto de vocês, quiserem comentar alguma coisa, a gente vai ficar aqui até as nove.
>
> **Cinthia:** Eu quero que você lance depois o que você vai me mandar aí no final, tá bom?
>
> **Alex Campos:** É só pra quem fica até o final.
>
> **Cinthia:** 11 minutos?
>
> **Dr. Lucas Moraes:** Eu te mando. Fica tranquila que eu te mando. A hora que eu receber, eu te mando.
>
> **Cinthia:** Obrigada, parceiros.
>
> **Dr. Lucas Moraes:** Tchau, boa noite, gente.
>
> **Alex Campos:** Tchau.
>
> **Dr. Lucas Moraes:** O cara dá o bypass na frente, né? Isso aí, turma. Vocês querem mostrar alguma coisa, falar alguma coisa? Tem alguma dúvida?
>
> **Dr. Lucas Moraes:** Eu tô criando isso aí que você tá mostrando hoje. Fazendo a entrega daquele meu cliente que eu vendi esses dias. Eu já peguei esse estoque e estou fazendo o que você mostrou agora aqui. Só que pra mim é muito novidade. Eu tinha ouvido falar sobre os campos personalizados ali. Os objetos. Mas eu abri ele aqui e não entendi bem pra que servia. Acabei não evoluindo. Mas tô criando aqui.
>
> **Alex Campos:** Ela me inspirou, ela manja bastante com isso aí também.
>
> **Oceano Azul:** Cara, entende os campos personalizados, entende os objetos personalizados como se fossem... por exemplo, tu trabalha, tu implementou o CRM aí pra uma clínica multidisciplinar. Cara, pode ter o campo personalizado do ortopedista, do fisioterapeuta, do nutricionista. Os objetos personalizados pra cada um. Ou então pode ser algo geral da clínica. Os objetos personalizados, ele é na verdade o grande poder do GHL em comparação com outros CRMs. Porque com isso tu pode adaptar basicamente pra qualquer negócio. Negócio de carro: muita coisa. Porque se você for pensar em nível de hierarquia, depende muito de como é o negócio, mas por exemplo, carro. Às vezes o cliente quer vários modelos. Tu vai ficar colocando modelo por modelo com todas as informações pra cada contato? Não, tu pode vincular ele em um objeto customizado. E aí a mesma coisa, assim como você pode ter várias oportunidades pro mesmo contato, você pode ter várias entradas de objetos customizados pro mesmo contato. Por exemplo, se é pra uma clínica, o cara pode ter o mesmo lead, ele pode ter entrada em diversos campos customizados, objetos customizados na verdade. Cara, é só dar uma estudada, tem alguns vídeos no YouTube, pessoas falando sobre essas aplicações de objetos personalizados, que dá pra ter uma luz de como usar.
>
> **Alex Campos:** Não precisa nem estudar, é só você pegar, pedir pro Claude aí...
>
> **Oceano Azul:** É, ele pode te dar caso de uso, te explicar melhor o SQI da vida.
>
> **Alex Campos:** Você vai trazer o conceito do teu cliente e vai pedir pra ele analisar se faz sentido ou não você usar um custom object. Porque vai ter momentos que ele mesmo vai falar pra você que não precisa utilizar. Porque às vezes a gente quer criar um negócio mirabolante e às vezes nem vai precisar de um objeto customizado.

---

### [113:00] Demo do Dr. Lucas: clínica e prontuário do paciente

> **Dr. Lucas Moraes:** Olha o que eu perguntei aqui, cara. Pra essa implementação, como seria, como é que eu usaria isso na prática? Ele me deu aqui sete campos personalizados. Colocou aqui opções, por exemplo, particular ou individual. Ele me deu sete campos na prática pra eu criar esses campos. Como que é? Objetos personalizados. Ele passou ali por exemplo: opção de particular Unimed ou convênio, particular, opção de emagrecimento, diabetes, tireoide, check-up ou outros, valor de exames, esses exames são urgentes ou não urgentes, a data da receita. Isso ele tá fazendo na prática aqui.
>
> **Alex Campos:** O que eu penso pro teu nicho, pro teu negócio, a fisioterapia, onde entraria o custom object? Prontuário, área do cliente? Vamos lá, é que você tem um negócio muito específico. Às vezes o cara tá com dor nas costas, ele vai tratar e talvez nunca mais ele volte. Mas pra uma clínica, o prontuário é algo extremamente valioso. Por quê? Você concorda que o cliente vai ter um histórico tão alto? Pensa só, pra você ter essa rastreabilidade. Imagina você ter que criar uma oportunidade pra cada um deles. Não faz sentido. Aí é onde entra o custom object. Pensa que o custom object é sempre aquilo que o cara precisa ter mais de uma vez.
>
> Acabei de ter uma ideia. Eu tenho um cliente que vende salgados congelados e o cliente faz recorrência de pedidos a cada 10, 15 dias. Eu estou criando oportunidade. Daqui a um mês vai ter mais... quantas oportunidades esse cara vai ter? Muitas oportunidades. Eu já posso levar isso pro custom object, que é o pedido do cliente, que está atrelado ao contato. Então eu não preciso criar várias oportunidades, eu vou criando pedidos novos atrelados àquele contato. Conseguiu sacar como funciona o custom object?
>
> **Dr. Lucas Moraes:** Cara, tá ficando mais claro, sim. Tá clarificando.
>
> **Alex Campos:** Vou pegar outro caso de uso. Outro caso de uso pra custom object: o cliente da gráfica. Na verdade ele vem de uniforme. Vamos lá, sua empresa. Você tem quantos funcionários aí?
>
> **Dr. Lucas Moraes:** Aqui comigo direto são só três.
>
> **Alex Campos:** Vamos lá, são três. Então cada seis meses você precisa renovar o seu uniforme de jaleco, certo? Vamos dizer que você tivesse um volume mais alto. Vamos levar pra gráfica. O cliente hoje, ele pediu dez uniformes, daqui seis meses ele vai ter que renovar. Em vez de eu criar uma nova oportunidade, eu crio um novo pedido. E eu vou atrelando esses pedidos. Vamos lá, entrou mais dois funcionários, tem que pedir mais dois, então já atrela mais dois pedidos. Só que aí, dentro... eu preciso ter informações desse pedido. Exemplo: quantas camisas desse uniforme foram G? Quantas foram da cor vermelha? São granularidades de informações dentro de uma informação. Conseguiu clarear mais?

---

### [117:00] Case do Kleber: revisão automotiva preventiva via QR Code

> **Kleber Fernandes:** Eu fiz algo parecido, mas pra outro nicho. Eu fiz pro nicho automotivo.
>
> **Alex Campos:** Automotivo. Eu preciso saber qual é o estoque de carro que eu tenho.
>
> **Kleber Fernandes:** Na verdade foi assim, tá até aqui na minha tela. Eu tô validando, essa semana eu vou pro cliente pra validar a parte de pagamento que vai ser via Mercado Pago. Então o que acontece? O cara vende revisão preventiva. Dividiu em três modelos de veículos: 1.0, depois 1.4 a 1.8, depois 2.0 Turbo e Premium. Ele tem um valor de cada modalidade, mas é um valor já trancado. Por exemplo, 1.0 é 280 reais a revisão preventiva. O cara paga um sinal de 100 pra segurar a vaga e já põe lá no calendário. Quando ele paga esse sinal de 100, o cara recebe um QR Code pra ele levar. No dia que ele levar o carro na oficina, o funcionário lê o QR Code e inicia o processo de revisão. Ele vai fazendo a revisão, já tem os itens selecionados, vai falando pro dono pelo WhatsApp, criando um laudo no CRM sobre esse carro, que é puxado pela placa. Ou seja, os dados ficam nesse CRM. Terminou a revisão, ele tem os dados do cara, cria um laudo e uma nota fiscal, o cara vai embora.
>
> Só que digamos assim, o cara trocou o óleo, então dali seis meses, ou na quilometragem X, ele tem que voltar pra trocar o óleo. É uma forma dele ter um lead quente sem campanha. Ele tem lá a base de leads e o sistema mesmo já vai chamar o cara: "Ó, Alex, você veio aqui no dia tal, já faz seis meses, será que você não quer trocar o óleo novamente? A gente tem um voucher de 10% pra você."
>
> **Dr. Lucas Moraes:** É isso aí que eu vi aqui. Exatamente isso.
>
> **Alex Campos:** O objeto serve exatamente pra isso. Porque lá você vai ter a automatização do óleo, o modelo do carro, a cor do carro, o que o cara trocou. Onde vai estar a revisão. Imagina você ter que colocar isso dentro de uma oportunidade e vários campos personalizados. Em campos personalizados, mas aí você vai colocar informações do carro, então você vai criar um novo objeto que não é oportunidade.
>
> **Dr. Lucas Moraes:** Com vários... E aí você não usa o CRM?
>
> **Kleber Fernandes:** Não, dentro do CRM é no CRM, doutor. O próprio campo personalizado está dentro do CRM. Se foi isso que eu entendi.

---

### [120:00] SKU único pra associar objetos: CPF vs telefone vs placa

> **Dr. Lucas Moraes:** Cara, deixa eu compartilhar minha tela pra falar sobre isso. Vê se é sobre isso mesmo. Deixa eu pegar aqui, peraí. A tela inteira.
>
> **Sidney Faroldo:** Ô Alex, mas pra associar tem que pegar qualquer SKU único, né?
>
> **Alex Campos:** Você pode associar ao contato, que é uma informação única.
>
> **Sidney Faroldo:** Mas se eu vou associar ao contato, o cara toda hora preencher tipo "Maria preencher com um sobrenome, preencher com um ponto diferente", divergência? Tipo "Maria José da Vida".
>
> **Alex Campos:** Mas é o telefone, né? O telefone é único.
>
> **Kleber Fernandes:** Ah, boa.
>
> **Sidney Faroldo:** Tava pensando em como pegar um SKU único, porque a gente usa o CPF aqui.
>
> **Alex Campos:** Pode ser o CPF.
>
> **Kleber Fernandes:** A regra é ter um item único. No meu caso é a placa do veículo.
>
> **Sidney Faroldo:** Ah, sim.
>
> **Dr. Lucas Moraes:** Vê se é isso, sobre isso na prática. O que é o custom fields aqui?
>
> **Alex Campos:** Custom fields é uma coisa. Custom fields é um campo personalizado que você pode... vamos lá. Existem campos personalizados que vão ser campos personalizados que fazem parte do contato. Informações do contato, CPF, faz parte do contato. Endereço, faz parte do contato. O tipo de produto que o cara comprou faz parte da oportunidade, porque o cara pode voltar amanhã e comprar outro produto.
>
> **Dr. Lucas Moraes:** Eu acho que dá pra transferir isso, porque aqui, assim que eu entendi, é associado ao cliente, ao dono.
>
> **Alex Campos:** Atendimento, atendimento. Isso aí tá dentro da...
>
> **Dr. Lucas Moraes:** Emagrecimento.
>
> **Oceano Azul:** Os objetos customizados, existem basicamente três grandes entidades no GHL, que é o quê? Contatos, empresas e oportunidades. Tudo aquilo que dentro da operação em si não se encaixar dentro desses três, você pode construir um objeto personalizado. Dentro desse objeto personalizado, ele vai funcionar igual como se fossem os contatos. Você vai criar campos personalizados dentro dos objetos personalizados.
>
> **Dr. Lucas Moraes:** É isso que eu tô mostrando aqui. Isso é sobre o cliente, dados do cliente, só que nos objetos. É isso aqui, sobre a data de validade de uma receita, é isso aqui que vai aparecer dentro de uma ficha, dentro do GHL. Ficha do paciente com campos, mas aqui eu fiz com campos porque eu mapeei errado. Vou fazer agora com objetos.
>
> **Alex Campos:** Podemos pedir pra ele falar: "Escreve pra ele, baseado na documentação do GHL, não faz mais sentido eu criar um custom object?"
>
> **Oceano Azul:** Aqui, se você perguntar no SQI, ele pergunta quando usar os objetos customizados. Um dos usos é quando os dados rastreados não dizem respeito a uma pessoa ou empresa, mas a outras entidades, como algum ativo, uma listagem ou a policy. E quando você precisa de registro estruturado e repetível, como campos, visualizações, automações consistentes.
>
> **Dr. Lucas Moraes:** É que aqui ele pegou de dentro de uma reunião que a gente teve, o que eu iria entregar pra ela e quais são as opções que ela teve ali. Descreveu pra mim. Então aqui eu tenho sete coisas, isso já ficaria legal já o card dele usando como custom fields, como agora como objetos, eu acho que vai ficar melhor, vai ficar mais organizado, porque são as mesmas coisas: o tipo de atendimento, o motivo da consulta, o exame, o resumo que a IA vai fazer, o peso inicial. E aqui tem os drop downs onde a gente vai escolher o tipo de atendimento. Serão R$600 por dia particular. É sobre emagrecimento. O link pra gente pegar o exame desse cliente é esse. A validade da receita é essa. Vai ser mais ou menos isso. É tudo isso, só que levado pro objeto e não pro...
>
> **Oceano Azul:** Exato. O objeto customizado, você pode vincular ele ao contato. Eu não lembro agora se dá pra vincular também a empresa ou oportunidade. Por exemplo, no caso de uma clínica de nutrição, onde o paciente passa por ciclos. Ele faz um ciclo 1, que é de tantos meses, que é emagrecimento, depois vai pra hipertrofia, algum acordo do tipo. Porque se você tem essas partes só nas informações de contato, quando o cara voltar, tu vai ter que atualizar tudo, e meio que perder o que tava ali nos campos do contato. Já com o objeto customizado, você vai criando como se fossem linhas pra ele.
>
> **Dr. Lucas Moraes:** Entendi. Faz mais sentido. Como eu falei agora há pouco, tá ficando mais clarificado, já tô entendendo.
>
> **Oceano Azul:** Isso, os campos que você vai usar são os mesmos, mesma lógica, só que em outro local.

---

### [128:00] Encerramento e promessa da skill e do agente do GHL

> **Alex Campos:** Turma, sensacional, muito bom estar com vocês, muito bom mesmo. A gente encerra por aqui, um primeiro encontro de muitos. Nos vemos aí na próxima terça-feira, mesmo horário, 19 horas. Estou pedindo aqui pro Claudinho, assim que essa reunião renderizar, eu vou subir lá dentro da comunidade, vou mandar lá pra vocês o material complementar. Toda aula vai ter o material complementar pra vocês e pra gente, pra vocês poderem executar isso que a gente aprendeu aqui.
>
> **Dr. Lucas Moraes:** Manda a transcrição também, cara, se você puder, de hoje.
>
> **Alex Campos:** A transcrição é só pra quem faz parte da mentoria. Pra quem faz parte da comunidade, no caso você já faz parte, vai ter lá também, eu mando lá pra vocês transcrição, vídeo, skill e também material complementar.
>
> **Oceano Azul:** E a skill que você ia mandar no final, fiote?
>
> **Alex Campos:** A skill também vai estar tudo lá: material complementar, skill, transcrição. O lendário não é fácil.
>
> **Dr. Lucas Moraes:** Podia mandar essa skill agora, hein? Podia mandar essa skill agora. É skill tão falso.
>
> **Oceano Azul:** Você quer as skills do Alex, rapaz? Se cadastrem lá no site dele.
>
> **Alex Campos:** Pô, Alex, tem minha skill lá, pô.
>
> **Kleber Fernandes:** Hein, Alex? Manda a skill aí, hein, meu filho.
>
> **Alex Campos:** Alex, mas o PDF lá das skills.
>
> **Oceano Azul:** Não foi enviado não, hein?
>
> **Alex Campos:** Vocês só vão entrar lá agora. Vocês só vão mandar a skill se vocês entrarem lá agora. Entrar lá agora e pegar todas as inscrições, divulgar.
>
> **Oceano Azul:** Foi enviado no Instagram. Enviado ainda não.
>
> **Alex Campos:** Não está sendo enviado?
>
> **Oceano Azul:** Não, não recebi não.
>
> **Alex Campos:** Vou dar uma olhada aqui, mas acredito que não foi enviado na construção. Deixa eu mostrar aqui pra vocês, galera. Não, não, não vou mostrar não. Depois eu vou criar uma nova aula. Dentro dessa aula eu vou mostrar pra vocês esse Curso da IA. Mas entra lá pra vocês darem uma olhada. Curso-da-ia.com.br. É a nossa fortaleza. Vamos cantar aqui. Vamos cantar o último hino.
>
> **Kleber Fernandes:** Vamos cantar de uma.
>
> **Alex Campos:** Se vocês querem skill, tá aqui. Se vocês querem skill, tem mais 10 skills aqui dentro.
>
> **Oceano Azul:** Alex, não foi enviado não. Eu recebi só aquele primeiro email lá de boas-vindas.
>
> **Alex Campos:** Vamos ver. O prédio eu criei ele, depois eu não dei continuidade.
>
> **Dr. Lucas Moraes:** Onde que vocês tão falando isso, cara?
>
> **Alex Campos:** Vou mostrar, irmão. Calma aí.
>
> **Dr. Lucas Moraes:** Também não vi isso aí. Isso aí já é quentinho.
>
> **Kleber Fernandes:** Mano, quem que tá com a TV no último volume aí, vei?
>
> **Sidney Faroldo:** As culpas... tem alguém dentro da TV, vei. Tem alguém dentro da TV.
>
> **Alex Campos:** Acho que era o Anderson.

---

### [132:00] Pulso da IA: feed de 210 artigos + 3 mil skills gratuitas

> **Alex Campos:** Aqui ó, Pulso da IA. O que é o Pulso da IA, galera? Pra vocês terem noção, existem mais de 3 mil skills aqui, de forma gratuita pra vocês acessarem. São todas as 3 mil skills que eu tenho aqui no meu Claude. Mas o mais interessante é essa parada aqui, em feed. Existem aqui 210 artigos já de inteligência artificial. Se vocês querem ficar por dentro do mundo da inteligência artificial e quer ver isso, talvez só as headlines, as notícias. Porque vamos lá, todas essas notícias aqui, uma sai lá no blog do Gemini, a outra sai lá no blog da Anthropic, outra sai lá no OpenAI, sai lá no LinkedIn, no X, não sei de quem.
>
> O que eu fiz, só pra vocês entenderem: eu peguei todos os principais canais de divulgação de inteligência artificial e centralizei em um lugar só. Todas as novidades que vão lançando vão estar aqui. Todas as últimas notícias da inteligência artificial estão aqui, no Pulso da IA. Você pode assinar e ficar por dentro de todas as novidades. E de brinde, vocês têm mais de 3.000 skills pra vocês verem aquilo que faz sentido pro negócio de vocês. Não saia instalando qualquer skill no negócio de vocês, tá?
>
> **Dr. Lucas Moraes:** Essa skill do GHL tá aqui dentro? É isso?
>
> **Alex Campos:** Eu vou mandar ela pra vocês, mas tem aqui, é pra ter aqui também. Mas acho que aqui não, não tá. Aqui não, deixa eu ver. Ele tá guardando a skill, mano. Ele não quer postar. Tá aqui não. A GHL API, mas não é essa.
>
> **Dr. Lucas Moraes:** O cara falou no final e... até agora, tô aqui sem skill.
>
> **Kleber Fernandes:** Derrubou a montanha, bicho.
>
> **Dr. Lucas Moraes:** É, ele não falou que ia derrubar a montanha. Entendi errado.
>
> **Oceano Azul:** É, e a skill só aparece dentro do Pix. Estou achando que é... vou mandar a skill pra vocês lá dentro do grupo, galera.
>
> **Dr. Lucas Moraes:** Poxa, mediante a Pix aí, não.
>
> **Alex Campos:** A skill vai ser mandada lá dentro do grupo, fica tranquilo.
>
> **Dr. Lucas Moraes:** Pessoal, o Alex, olha aqui de novo. Olha como é que ele me atualizou aqui agora. Como que a gente vai visualizar dentro do GHL. O nome do cara, o nome do card ali. Então o custom objects, ele criou aqui então de exames, de receitas, de consultas, e aí vai ter eu acho que uns drop downs aqui pra gente colocar qual é a consulta do cara, qual é o valor, o peso dele. Então a gente já vai visualizar isso diferente de como ele mostrou aqui. Aqui estava só com campos personalizados, aqui ele já criou os objetos. Então vai ser assim que a gente vai conseguir ter a informação usando os objetos. E é assim que vocês veem dentro do GHL de vocês quando você cria um objeto?
>
> **Alex Campos:** Não entendi sua pergunta, Lucas.
>
> **Dr. Lucas Moraes:** Então, aqui eu pedi pra adicionar com os objetos personalizados e não os campos. Então ele deixou diferente aqui dentro do card, que seria os exames. As linhas, ele veio tal dia e tal dia e tal dia, como as linhas que você disse que eles seriam comprados. Ele comprou aqui...
>
> **Alex Campos:** É isso mesmo, exames, receitas, que são coisas que estão atreladas ao paciente. Quantas consultas o paciente fez? Quantas receitas você gerou pra ele? Qual é a receita dele? E ele gerou também os campos.
>
> **Dr. Lucas Moraes:** Os campos, no caso dos campos...
>
> **Oceano Azul:** Isso.
>
> **Dr. Lucas Moraes:** Isso seria a parte escolar, motivo emagrecimento, o peso dele que a gente vai colocar, e aí embaixo os objetos. Agora acho que ficou mais claro pra mim.

---

### [137:00] Despedida e revelação final: era um agente, não uma skill

> **Alex Campos:** Só pra poder, né? Eu falei que ia liberar pra vocês. Eu vou mandar lá no grupo. Não é nenhuma skill, é um agente, mano. É um agente do GHL. Tinha falado de skill, mas eu vi aqui, é um agente. Um agente DevOps e um agente do GHL, eu vou mandar pra vocês.
>
> **Kleber Fernandes:** Por isso que eu te perguntei se você tava orquestrando. Eu falei, meu, tá tão... o negócio não pode passar com agente.
>
> **Dr. Lucas Moraes:** Dá pra criar um time aqui, um squad de especialistas do GHL, pra fazer igual o pessoal faz com o ClickUp, só que aí a gente usa no GHL.
>
> **Kleber Fernandes:** Exatamente.
>
> **Dr. Lucas Moraes:** É?
>
> **Alex Campos:** Mas turma, até mais. Eu tô finalizando aqui, eu já subo e mando pra vocês lá.
>
> **Dr. Lucas Moraes:** Valeu, tamo junto.
>
> **Alex Campos:** Valeu, abraço, até mais.
>
> **Kleber Fernandes:** Valeu, pessoal.
>
> **Dr. Lucas Moraes:** Falou.

---

*Transcrição gerada a partir da gravação Fireflies do encontro. Material complementar da Aula 01.*

# Medição de SEO e conversão

## Estado atual

O site não carrega Google Analytics, Tag Manager ou cookies de publicidade. Os eventos abaixo são adicionados apenas ao `window.dataLayer` e a um evento DOM `temis:track`; eles permanecem na memória da página e não são enviados a um servidor pelo código atual.

## Eventos disponíveis

- `download_cta`: clique em um link para a seção de downloads.
- `app_download`: clique em um instalador no CDN oficial; inclui `asset` quando identificado.
- `access_request`: contato para consultar acesso ou condições do piloto.
- `guide_click`: acesso ao guia de categoria.
- `security_click`: acesso à página de segurança.
- `release_notes_click`: acesso às notas de versão.
- `contact_email`: clique em um canal de e-mail.

Cada evento inclui `location` e `page_path`. Eventos de download podem incluir `asset` e `link_url`. Não inclua texto de e-mails, dados de conta, prompts, processos ou outros dados pessoais nos parâmetros.

## Como ativar relatórios

1. Verifique a propriedade de domínio `temischat.com` no Google Search Console.
2. Envie `https://temischat.com/sitemap.xml` e inspecione as cinco URLs públicas.
3. Em Desempenho, compare períodos equivalentes de 28 dias e separe consultas contendo e não contendo `temis`. Revise manualmente variações de marca.
4. Se um Tag Manager for instalado, configure os eventos acima e atualize `privacidade.html` antes da coleta. Avalie consentimento e requisitos de LGPD com o responsável.
5. Meça cliques no CTA e cliques de download por `location`, `page_path` e `asset`.

Um clique em download não comprova que o arquivo foi baixado ou instalado. Para medir conclusão, use logs do CDN ou um evento de ativação devidamente documentado e consentido, sem criar identificadores ocultos.

## Indicadores para avaliar esta implementação

- Impressões e cliques de consultas não relacionadas à marca na homepage e no guia.
- CTR orgânico de `copiloto jurídico` e consultas relacionadas.
- Cliques em `app_download` por sistema e local do CTA.
- Cliques em `access_request` após visitas às seções de acesso e segurança.
- Leitura do guia seguida de `download_cta` ou `security_click`.
- Overflow horizontal igual a zero nos viewports de 320, 360, 390 e 768 px.

# 01 — Visão e contexto

## Visão

O Colecity é uma plataforma colaborativa que reúne relatos e manifestações sobre problemas urbanos na **cidade de São Paulo**, para que as pessoas acompanhem o que está acontecendo, entendam a extensão dos problemas e se mobilizem em torno de causas comuns.

## Público

Moradores e pessoas que utilizam serviços urbanos em São Paulo.

## Problema

Moradores e usuários de serviços urbanos de São Paulo têm dificuldade para encontrar informações reunidas sobre problemas que os afetam, compreender sua possível extensão e identificar outras pessoas afetadas ou mobilizadas.

Dores:
- **Informação atualizada:** a situação muda e previsões não se cumprem (ex.: o horário previsto para a volta da água passa e o abastecimento não retorna).
- **Reclamações isoladas:** em canais como o SP156 cada pessoa reclama sozinha, sem ver os relatos dos outros.
- **Extensão do problema:** não se sabe quais ruas, bairros ou trajetos estão afetados.
- **Força coletiva:** pessoas com o mesmo problema não têm como reunir suas manifestações.

Essas dores vêm de conversas da equipe com moradores e usuários de ônibus (alterações de rota sem aviso, horários, falta de água e energia, buracos, árvores caídas). Não são pesquisa representativa.

## Solução

O Colecity permite relatar, acompanhar e se mobilizar em torno de problemas urbanos:
- **Informação atualizada:** cada ocorrência tem linha do tempo e comentários de quem vive o problema.
- **Reclamações isoladas:** antes de registrar, a pessoa vê ocorrências semelhantes e pode entrar nelas.
- **Extensão:** mapa e lista com filtros, mapa de calor e Zona de atenção.
- **Força coletiva:** "Também estou sendo afetado" e "Apoiar manifestação", com contagens separadas.
- **Transporte ao vivo:** trajeto oficial das linhas, posição dos ônibus (SPTrans e passageiros) e detecção de desvio de rota.

Foco: acompanhar crises e serviços ao longo do tempo, com mobilização coletiva.

## Categorias da v1

Transporte, Água, Energia, Vias, Árvores, Segurança e Riscos e infraestrutura. Tipos em [07](07-regras-de-negocio-produto.md).

## Limites

- O Colecity não é um canal oficial da Prefeitura e não garante que órgãos públicos recebam ou respondam a manifestações.
- Contagens mostram participações na plataforma, não o total de pessoas afetadas.
- Informações da comunidade nunca são apresentadas como confirmação oficial.
- Território da v1: município de São Paulo.

## Ficha da CitizenTech

- **Nome:** Colecity.
- **Cidade:** São Paulo, SP.
- **Público:** moradores e usuários de serviços urbanos da cidade.
- **Problema:** dificuldade de conhecer e reunir informações e manifestações sobre problemas urbanos compartilhados.
- **Como funciona:** app em que o cidadão consulta, registra e acompanha ocorrências por categoria e localização, com participação coletiva.
- **Tecnologias:** app React Native/Expo, BFF em Node/TypeScript na Vercel, API de domínio em C#/.NET no Render, Firebase (Authentication e Firestore), Vercel Blob (fotos), Expo Push com FCM, dados da SPTrans (GTFS e Olho Vivo).
- **Indicadores:** ocorrências registradas, afetados e apoios por ocorrência, ocorrências concluídas, desvios de rota detectados.
- **ODS:** 11 (Cidades e comunidades sustentáveis), 10 (Redução das desigualdades), 9 (Indústria, inovação e infraestrutura).

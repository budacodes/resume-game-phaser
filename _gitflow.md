Para seguir GitFlow clássico, crie e use:

## Branches principais
- main (produção)
- develop (integração)

## Branches de trabalho:
- feature/_ (ex.: feature/inventory-refactor)
- release/_ (ex.: release/1.0.0)
- hotfix/\* (ex.: hotfix/1.0.1)

## Fluxo básico:
- cria develop a partir da main
- features saem da develop e voltam pra develop
- release sai da develop e volta pra main e develop
- hotfix sai da main e volta pra main e develop

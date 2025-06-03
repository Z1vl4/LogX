# LogX v1 – Proof-of-Concept

Denna version (1) av LogX utvecklas gemensamt av Olivia Meuller och Alva Nilsson Aspnor som en del av ett kandidatarbete i IT-forensik och informationssäkerhet vid Högskolan i Halmstad våren 2025.

- **Olivia Meuller** – [LinkedIn](https://se.linkedin.com/in/olivia-meuller-0b0759250)
- **Alva Nilsson Aspnor** – [LinkedIn](https://se.linkedin.com/in/alvanilssonaspnor)

## Syfte

Verktyget utvecklas för att automatisera logganalys med hjälp av AI samtidigt som säkerheten förstärks genom enkelriktad datainsamling (one-way communication). Fokus läggs på att minska behovet av manuell granskning utan att kompromissa med tillförlitlighet.

## Resultat
(Av totalt 2041 loggar, med en relativt jämn fördelning av normal trafik och potentiella attacker.)

- Precision: 98.35%
- Recall: 100%
- F1-score: 99.17%


## Begränsningar

- Endast SNMP- och syslog-loggar hanteras
- GPT-4o Mini används och uppdateras ej efter 2024
- Verktyget implementeras i en testmiljö 

För metodik, intervjuer och resultat hänvisas till den fullständiga uppsatsen.

## Dashboard
![](https://github.com/LogX/v1/LogX.gif)

## Installation

Python 3.10 eller senare används. Beroenden installeras enligt `requirements.txt`:

```bash
pip install -r requirements.txt

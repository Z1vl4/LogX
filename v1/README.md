# LogX v1 – Proof-of-Concept

Denna version utvecklas och utvärderas som en del av ett kandidatarbete inom IT-forensik och informationssäkerhet vid Högskolan i Halmstad, våren 2025.

## Syfte

Verktyget utvecklas för att automatisera logganalys med hjälp av AI samtidigt som säkerheten förstärks genom enkelriktad kommunikation (one-way communication). Fokus läggs på att minska behovet av manuell granskning utan att kompromissa med tillförlitlighet.

## Resultat

- Precision: 98.35%
- Recall: 100%
- F1-score: 99.17%
- >52% av loggarna klassificeras som låg risk

## Begränsningar

- Endast SNMP- och syslog-loggar hanteras
- GPT-4o Mini används och uppdateras ej efter 2024
- Verktyget implementeras i en testmiljö och är inte produktionssatt

För metodik, intervjuer och resultat hänvisas till den fullständiga uppsatsen.

## Installation

Python 3.10 eller senare används. Beroenden installeras enligt `requirements.txt`:

```bash
pip install -r requirements.txt

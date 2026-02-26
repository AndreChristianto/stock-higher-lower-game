# Data Refresh Prompt for Claude Desktop

Use this prompt in Claude Desktop (with Sectors MCP server connected) to generate/update the companies.json file.

---

## PROMPT TEMPLATE

```
Please fetch stock data from the Sectors MCP server for Indonesian (IDX) companies and create a companies.json file with the following structure:

Target file: `public/data/companies.json`

Required format: JSON array of objects with these fields:

- ticker (string): Stock ticker symbol
- name (string): Company name
- sector (string): Industry sector
- pe (number or null): Price-to-Earnings ratio
- roe (number): Return on Equity (as decimal, e.g., 0.2043 for 20.43%)
- roa (number): Return on Assets (as decimal)
- pb (number): Price-to-Book ratio
- profitMargin (number): Net Profit Margin (as decimal)
- market_cap (number): Market capitalization in billions
- total_assets (number): Total assets in billions
- total_equity (number): Total equity in billions
- total_liabilities (number): Total liabilities in billions
- revenue (number): Total revenue in billions
- earnings (number): Net earnings in billions
- der (number or null): Debt-to-Equity Ratio

Please include a diverse mix of sectors: Banks, Telecom, Consumer, Conglomerate, Auto Parts, Energy, Property, Tobacco, Pharma, Industrials, and Retail.

Fetch at least 30-40 companies for good variety in the game.

---

## Where to Place the file?

Write the output directly to: public/data/companies.json

```

---

## Quick Reference

**All percentage/ratio fields should be decimals:**
- ROE of 20.43% = 0.2043
- ROA of 3.63% = 0.0363
- Profit Margin of 51.37% = 0.5137

**Null values are acceptable for:**
- pe (if negative earnings or not available)
- der (if data not available)

---

## Example Entry

```json
{
  "ticker": "BBCA",
  "name": "Bank Central Asia",
  "sector": "Banks",
  "pe": 15.32,
  "roe": 0.2043,
  "roa": 0.0363,
  "pb": 3.13,
  "profitMargin": 0.5137,
  "market_cap": 881756,
  "total_assets": 1586830,
  "total_equity": 281688,
  "total_liabilities": 1305140,
  "revenue": 112006,
  "earnings": 57537,
  "der": 0.0085
}
```

"use client";

import { useState, useMemo } from "react";

// ============================================================
// STOCK HIGHER/LOWER v3 — Analytical Reasoning Game
// Escalating difficulty · Distractor data · 10 rounds
// ============================================================

const FONT = "'DM Sans', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

// --- Helper to highlight metrics in text ---
function highlightMetrics(text, companyTickers = []) {
  if (!text) return text;

  // Escape special regex characters in tickers
  const escapedTickers = companyTickers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Build pattern - include tickers if available
  const tickerPattern = escapedTickers.length > 0 ? escapedTickers.join('|') : '';
  const basePattern = '\\d+\\.?\\d*%|\\d+\\.?\\d*x|Rp\\d+|IDR \\d+[TBM]|\\d+\\.?\\d*T|\\d+\\.?\\d*B|\\d+\\.?\\d*M|\\bROE\\b|\\bROA\\b|\\bP\\/E\\b|\\bP\\/B\\b|profit margin|net profit margin|market cap|debt-to-equity|asset base|book value';

  const pattern = tickerPattern
    ? new RegExp(`(${basePattern}|${tickerPattern})`, 'gi')
    : new RegExp(`(${basePattern})`, 'gi');

  const parts = text.split(pattern).filter(p => p !== undefined);

  return parts.map((part, i) => {
    if (!part) return null;

    // Check if this part is a company ticker
    if (companyTickers.some(ticker => part.toUpperCase() === ticker.toUpperCase())) {
      return (
        <span key={i} style={{
          color: "#f59e0b",
          fontWeight: 700,
          background: "rgba(245, 158, 11, 0.1)",
          padding: "1px 4px",
          borderRadius: 3
        }}>
          {part}
        </span>
      );
    }
    // Check if this part matches a number/ratio pattern
    if (/(\d+\.?\d*%|\d+\.?\d*x|Rp\d+|IDR \d+[TBM]|\d+\.?\d*T|\d+\.?\d*B|\d+\.?\d*M)/.test(part)) {
      return (
        <span key={i} style={{
          color: "#fbbf24",
          fontWeight: 700,
          background: "rgba(251, 191, 36, 0.1)",
          padding: "1px 4px",
          borderRadius: 3
        }}>
          {part}
        </span>
      );
    }
    // Check if this part matches a metric name
    if (/(\bROE\b|\bROA\b|\bP\/E\b|\bP\/B\b|profit margin|net profit margin|market cap|debt-to-equity|asset base|book value)/i.test(part)) {
      return (
        <span key={i} style={{
          color: "#3b82f6",
          fontWeight: 700,
          background: "rgba(59, 130, 246, 0.1)",
          padding: "1px 4px",
          borderRadius: 3
        }}>
          {part}
        </span>
      );
    }
    return part;
  }).filter(p => p !== null);
}

// --- Dynamic insight generator ---
function generateInsight(metric, winner, loser, winVal, loseVal) {
  const w = winner.ticker;
  const l = loser.ticker;
  const wF = metric.format(winVal);
  const lF = metric.format(loseVal);
  const sameSector = winner.sector === loser.sector;
  const ratio = winVal !== 0 && loseVal !== 0 ? (winVal / loseVal).toFixed(1) : null;

  const insights = {
    roe: () => {
      const parts = [];
      if (winVal > 0.25) {
        parts.push(`${w}'s ROE of ${wF} is exceptionally high — it's generating serious returns for shareholders. When screening stocks, ROE above 15% is generally considered strong.`);
      } else if (loseVal < 0.05) {
        parts.push(`${l}'s ROE of ${lF} is quite low, meaning shareholders aren't getting much return on their invested capital. This could signal inefficiency or that the company is reinvesting heavily.`);
      } else {
        parts.push(`${w} generates ${wF} return on each rupiah of equity vs ${l}'s ${lF}.`);
      }
      if (sameSector && ratio && parseFloat(ratio) > 1.5) {
        parts.push(`Despite both being in ${winner.sector}, ${w} is ${ratio}x more efficient with shareholder equity. Analysts often compare ROE within sectors — this gap would be a red flag for ${l} investors.`);
      } else if (!sameSector) {
        parts.push(`Comparing ROE across different sectors (${winner.sector} vs ${loser.sector}) is tricky — capital-intensive industries naturally have different ROE ranges. Always compare within the same sector first.`);
      }
      if (winner.pb && loser.pb && winner.pb > loser.pb * 1.5) {
        parts.push(`Notice that ${w}'s higher ROE often justifies its higher P/B ratio (${winner.pb.toFixed(1)}x vs ${loser.pb.toFixed(1)}x) — investors pay a premium for companies that use equity efficiently.`);
      }
      return parts.join(" ");
    },
    roa: () => {
      const parts = [];
      if (winner.sector === "Banks" || loser.sector === "Banks") {
        parts.push(`Banks typically have ROA below 3% because they hold massive amounts of assets (deposits, loans). A bank with ${wF} ROA is actually strong by banking standards.`);
      } else if (winVal > 0.15) {
        parts.push(`${w}'s ROA of ${wF} is remarkably high — this is an asset-light business that squeezes a lot of profit from relatively few assets.`);
      } else {
        parts.push(`${w} earns ${wF} on its assets compared to ${l}'s ${lF}.`);
      }
      if (winner.total_assets && loser.total_assets) {
        const aRatio = (Math.max(winner.total_assets, loser.total_assets) / Math.min(winner.total_assets, loser.total_assets)).toFixed(0);
        if (parseFloat(aRatio) > 5) {
          parts.push(`A key insight: ${winner.total_assets > loser.total_assets ? w : l} has ${aRatio}x more total assets. Bigger asset base doesn't mean better returns — ROA helps you see through the size difference.`);
        }
      }
      parts.push(`When comparing ROA, also consider the industry: asset-heavy sectors like banking and property will naturally score lower than tech or pharma.`);
      return parts.join(" ");
    },
    pe: () => {
      const parts = [];
      const highPE = winVal > loseVal ? winner : loser;
      const lowPE = winVal > loseVal ? loser : winner;
      const highV = Math.max(winVal, loseVal);
      const lowV = Math.min(winVal, loseVal);
      if (highV > 20) {
        parts.push(`${highPE.ticker}'s P/E of ${metric.format(highV)} means investors are paying ${highV.toFixed(0)} years worth of current earnings for the stock. This premium usually means the market expects significant earnings growth ahead.`);
      }
      if (lowV < 8) {
        parts.push(`${lowPE.ticker}'s P/E of ${metric.format(lowV)} looks cheap on paper — but low P/E isn't always a bargain. It could mean the market expects earnings to decline, or there are risks priced in.`);
      }
      if (highV > lowV * 2) {
        parts.push(`The ${(highV / lowV).toFixed(1)}x gap in P/E between these two is significant. Before concluding one is "expensive," ask: is the high-P/E company growing faster? Does the low-P/E company face headwinds?`);
      } else {
        parts.push(`${w} trades at ${wF} while ${l} is at ${lF}. Similar P/E ratios within a sector suggest the market views their growth prospects comparably.`);
      }
      return parts.join(" ");
    },
    pb: () => {
      const parts = [];
      if (loseVal < 1.0) {
        parts.push(`${loser.ticker}'s P/B of ${lF} is below 1.0 — the market is literally valuing it below the net assets on its books. This could be a deep value opportunity, or the market is pricing in asset quality concerns.`);
      }
      if (winVal > 5) {
        parts.push(`${w}'s P/B of ${wF} means investors value it at ${winVal.toFixed(0)}x its book value. This extreme premium typically reflects intangible assets — brand power, market position, or IP — that don't show up on the balance sheet.`);
      } else {
        parts.push(`${w} trades at ${wF} book value vs ${l}'s ${lF}.`);
      }
      if (sameSector) {
        parts.push(`Within ${winner.sector}, this P/B gap often correlates with ROE differences — investors pay more for companies that generate higher returns on their equity base.`);
      } else {
        parts.push(`P/B varies hugely across sectors. Tech and consumer brands often trade at high P/B (intangible value), while property and banks trade closer to 1.0x (tangible asset-heavy).`);
      }
      return parts.join(" ");
    },
    profitMargin: () => {
      const parts = [];
      if (winVal > 0.20) {
        parts.push(`${w} keeps Rp${(winVal * 100).toFixed(0)} of every Rp100 in revenue as profit — that's a high-margin business with strong pricing power or low cost structure.`);
      }
      if (loseVal < 0.03 && loseVal > 0) {
        parts.push(`${l}'s razor-thin margin of ${lF} means almost all revenue goes to costs. This is common in distribution and retail — high volume, low margin. One bad quarter can tip them into losses.`);
      }
      if (winner.revenue && loser.revenue && loser.revenue > winner.revenue * 2 && loseVal < winVal) {
        parts.push(`Here's the key insight: ${l} has ${(loser.revenue / 1000).toFixed(0)}T in revenue vs ${w}'s ${(winner.revenue / 1000).toFixed(0)}T — but revenue means nothing if you can't keep it. ${w}'s higher margin makes it more profitable despite smaller top-line.`);
      } else {
        parts.push(`Margin differences tell you about business model quality. High margins create a buffer against downturns — if revenue dips 10%, a 30%-margin company survives while a 3%-margin company is in trouble.`);
      }
      return parts.join(" ");
    },
  };

  return insights[metric.key]?.() || `${w} scored ${wF} vs ${l}'s ${lF} on ${metric.label}.`;
}

// --- Metric definitions with formula clues + distractor fields ---
const METRICS = [
  {
    key: "roe",
    label: "Return on Equity",
    short: "ROE",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    formula: "Net Earnings ÷ Total Equity",
    clueKeys: ["earnings", "total_equity"],
    distractors: ["revenue", "total_assets", "total_liabilities"],
    hint: "Focus on earnings and equity — the rest is noise. Divide earnings by equity to get ROE.",
  },
  {
    key: "roa",
    label: "Return on Assets",
    short: "ROA",
    format: (v) => `${(v * 100).toFixed(2)}%`,
    formula: "Net Earnings ÷ Total Assets",
    clueKeys: ["earnings", "total_assets"],
    distractors: ["revenue", "total_equity", "market_cap"],
    hint: "You need earnings and total assets. Revenue looks tempting but it's a distractor!",
  },
  {
    key: "pe",
    label: "Price-to-Earnings",
    short: "P/E",
    format: (v) => v === null || v < 0 ? "N/A" : `${v.toFixed(1)}x`,
    formula: "Market Cap ÷ Net Earnings",
    clueKeys: ["market_cap", "earnings"],
    distractors: ["revenue", "total_assets", "total_equity"],
    hint: "Market cap divided by earnings. Don't get distracted by revenue or assets — P/E is about what investors pay for profits.",
  },
  {
    key: "pb",
    label: "Price-to-Book",
    short: "P/B",
    format: (v) => `${v.toFixed(2)}x`,
    formula: "Market Cap ÷ Total Equity",
    clueKeys: ["market_cap", "total_equity"],
    distractors: ["total_assets", "earnings", "total_liabilities"],
    hint: "Compare market cap to equity (book value). Assets and liabilities are tempting but not what you need here.",
  },
  {
    key: "profitMargin",
    label: "Net Profit Margin",
    short: "Margin",
    format: (v) => v < 0 ? "Negative" : `${(v * 100).toFixed(1)}%`,
    formula: "Net Earnings ÷ Revenue",
    clueKeys: ["earnings", "revenue"],
    distractors: ["total_assets", "market_cap", "total_equity"],
    hint: "Simple ratio: how much of each rupiah of revenue becomes profit? Earnings divided by revenue.",
  },
];

const FIELD_LABELS = {
  earnings: "Net Earnings",
  revenue: "Total Revenue",
  total_equity: "Total Equity",
  total_assets: "Total Assets",
  total_liabilities: "Total Liabilities",
  market_cap: "Market Cap",
};

function formatBillion(v) {
  if (v === null || v === undefined) return "N/A";

  const addCommas = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatWithSuffix = (num, suffix, color) => {
    return (
      <>
        {addCommas(num)}
        {" "}
        <span style={{ color }}>{suffix}</span>
      </>
    );
  };

  // If value is very large (> 100,000), assume it's in raw IDR and convert
  if (Math.abs(v) >= 100000) {
    // Convert from raw IDR to billions
    const billions = v / 1000000000;
    if (Math.abs(billions) >= 1000) return formatWithSuffix((billions / 1000).toFixed(1), "T", "#f59e0b");
    if (Math.abs(billions) >= 1) return formatWithSuffix(billions.toFixed(0), "B", "#3b82f6");
    return formatWithSuffix((billions * 1000).toFixed(0), "M", "#10b981");
  }

  // Otherwise assume it's already in billions
  if (Math.abs(v) >= 1000) return formatWithSuffix((v / 1000).toFixed(1), "T", "#f59e0b");
  if (Math.abs(v) >= 1) return formatWithSuffix(v.toFixed(0), "B", "#3b82f6");
  return formatWithSuffix((v * 1000).toFixed(0), "M", "#10b981");
}

// --- Difficulty-aware matchmaking ---
function getMetricDiff(a, b, metric) {
  const va = a[metric.key];
  const vb = b[metric.key];
  if (va === null || vb === null || va === undefined || vb === undefined) return Infinity;
  if (metric.key === "pe" && (va < 0 || vb < 0)) return Infinity;
  const avg = (Math.abs(va) + Math.abs(vb)) / 2;
  if (avg === 0) return Infinity;
  return Math.abs(va - vb) / avg;
}

function generateRound(companies, difficulty) {
  const thresholds = [
    { min: 0.5, max: Infinity },
    { min: 0.15, max: 1.0 },
    { min: 0.01, max: 0.5 },
  ];
  const { min, max } = thresholds[difficulty] || thresholds[1];
  const distractorCount = [1, 2, 3][difficulty] || 2;

  let best = null;
  let bestDiff = Infinity;

  for (let attempt = 0; attempt < 200; attempt++) {
    const shuffled = [...companies].sort(() => Math.random() - 0.5);
    const a = shuffled[0];
    const b = shuffled[1];
    const metric = METRICS[Math.floor(Math.random() * METRICS.length)];

    const va = a[metric.key];
    const vb = b[metric.key];
    if (va === null || vb === null || va === undefined || vb === undefined) continue;
    if (va === vb) continue;
    if (metric.key === "pe" && (va < 0 || vb < 0)) continue;
    if (metric.key === "profitMargin" && (va < 0 || vb < 0)) continue;

    const diff = getMetricDiff(a, b, metric);

    if (diff >= min && diff <= max) {
      const target = (min + Math.min(max, 2)) / 2;
      const dist = Math.abs(diff - target);
      if (dist < bestDiff) {
        bestDiff = dist;
        best = { companyA: a, companyB: b, metric, diff, distractorCount };
      }
    }
  }

  if (!best) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const shuffled = [...companies].sort(() => Math.random() - 0.5);
      const a = shuffled[0];
      const b = shuffled[1];
      const metric = METRICS[Math.floor(Math.random() * METRICS.length)];
      const va = a[metric.key];
      const vb = b[metric.key];
      if (va === null || vb === null || va === undefined || vb === undefined) continue;
      if (va === vb) continue;
      if (metric.key === "pe" && (va < 0 || vb < 0)) continue;
      if (metric.key === "profitMargin" && (va < 0 || vb < 0)) continue;
      best = { companyA: a, companyB: b, metric, diff: getMetricDiff(a, b, metric), distractorCount };
      break;
    }
  }

  if (!best) return null;

  const va = best.companyA[best.metric.key];
  const vb = best.companyB[best.metric.key];
  best.answer = vb > va ? "higher" : "lower";

  return best;
}

function generateAllRounds(companies, totalRounds = 10) {
  const rounds = [];
  for (let i = 0; i < totalRounds; i++) {
    let diff;
    if (i < 3) diff = 0;
    else if (i < 7) diff = 1;
    else diff = 2;

    const round = generateRound(companies, diff);
    if (round) {
      round.roundNum = i + 1;
      round.difficulty = diff;
      rounds.push(round);
    }
  }
  return rounds;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// COMPONENTS
// ============================================================

function DataField({ label, value, delay = 0 }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 13px", borderRadius: 9,
      background: "rgba(255,255,255,0.025)",
      border: `1px solid rgba(255,255,255,0.05)`,
      animation: `fadeSlideIn 0.35s ease ${delay}s both`,
    }}>
      <span style={{
        fontSize: 11.5, color: "#9ca3af", fontWeight: 500, fontFamily: FONT,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 14, color: "#e5e7eb", fontWeight: 700, fontFamily: MONO,
      }}>
        {value}
      </span>
    </div>
  );
}

function CompanyPanel({ company, metric, revealed, isWinner, distractorCount }) {
  const sectorColors = {
    Banks: "#3b82f6", Telecom: "#8b5cf6", Consumer: "#f59e0b",
    Conglomerate: "#6b7280", "Auto Parts": "#ef4444", Energy: "#10b981",
    Property: "#ec4899", Tobacco: "#a855f7", Pharma: "#14b8a6",
    Industrials: "#f97316", Retail: "#06b6d4",
  };
  const sColor = sectorColors[company.sector] || "#6b7280";

  const metricColors = {
    roe: "#10b981",      // Green - profitability
    roa: "#3b82f6",      // Blue - efficiency
    pe: "#f59e0b",       // Orange - valuation
    pb: "#ec4899",       // Pink - book value
    profitMargin: "#8b5cf6",  // Purple - margins
  };
  const metricColor = metricColors[metric.key] || "#e5e7eb";

  // Memoize the shuffled fields so they don't change on every render
  const allFields = useMemo(() => {
    const clueKeys = metric.clueKeys;
    const selectedDistractors = shuffle(metric.distractors).slice(0, distractorCount);
    return shuffle([...clueKeys, ...selectedDistractors]);
  }, [company.ticker, metric.key, distractorCount]);

  const val = company[metric.key];

  return (
    <div style={{
      flex: 1, minWidth: 280, padding: "24px 20px", borderRadius: 16,
      background: revealed && isWinner
        ? "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.015))"
        : "rgba(255,255,255,0.015)",
      border: `1.5px solid ${revealed && isWinner ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)"}`,
      transition: "all 0.5s ease",
    }}>
      <div style={{
        display: "inline-block", padding: "3px 9px", borderRadius: 6, marginBottom: 14,
        background: `${sColor}15`, border: `1px solid ${sColor}30`,
      }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: sColor, fontFamily: FONT, letterSpacing: "0.04em" }}>
          {company.sector}
        </span>
      </div>

      <div style={{ marginBottom: 18, minHeight: 68 }}>
        <span style={{
          fontSize: 12, fontFamily: MONO, fontWeight: 700, color: "#f59e0b",
          background: "rgba(245,158,11,0.08)", padding: "2px 7px", borderRadius: 5,
        }}>
          {company.ticker}
        </span>
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: "#f9fafb", margin: "8px 0 0",
          fontFamily: FONT, letterSpacing: "-0.015em", lineHeight: 1.25,
        }}>
          {company.name}
        </h3>
      </div>

      <p style={{
        fontSize: 9.5, fontWeight: 600, color: "#4b5563", margin: "0 0 8px",
        fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.12em",
      }}>
        Financial Data
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {allFields.map((key, i) => (
          <DataField
            key={key}
            label={FIELD_LABELS[key]}
            value={formatBillion(company[key])}
            delay={i * 0.06}
          />
        ))}
      </div>

      {revealed && (
        <div style={{
          marginTop: 16, padding: "14px", borderRadius: 10, textAlign: "center",
          background: isWinner ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${isWinner ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)"}`,
          animation: "popIn 0.4s ease",
        }}>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 4px", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {metric.short}
          </p>
          <p style={{
            fontSize: 28, fontWeight: 800, margin: 0, fontFamily: MONO,
            color: metricColor,
            opacity: isWinner ? 1 : 0.6,
          }}>
            {metric.format(val)}
          </p>
        </div>
      )}
    </div>
  );
}

function FormulaBar({ metric, metricColor }) {
  // Convert hex to rgba for background
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div style={{
      padding: "10px 16px", borderRadius: 10,
      background: hexToRgba(metricColor, 0.04),
      border: `1px solid ${hexToRgba(metricColor, 0.12)}`,
      display: "flex", alignItems: "center", gap: 10,
      justifyContent: "center", flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 10.5, color: hexToRgba(metricColor, 0.7), fontWeight: 600, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Formula
      </span>
      <span style={{ fontSize: 13.5, color: metricColor, fontFamily: MONO, fontWeight: 600 }}>
        {metric.short} = {metric.formula}
      </span>
    </div>
  );
}

function DifficultyBadge({ difficulty }) {
  const configs = [
    { label: "EASY", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
    { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { label: "HARD", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  ];
  const c = configs[difficulty] || configs[0];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, padding: "3px 8px", borderRadius: 5,
      fontFamily: FONT, letterSpacing: "0.06em",
    }}>
      {c.label}
    </span>
  );
}

// --- Start Screen ---
function StartScreen({ onStart, highScore, companies }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "linear-gradient(150deg, #07080d 0%, #0d1117 40%, #0a0f1a 100%)",
      fontFamily: FONT,
    }}>
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 84, height: 84, margin: "0 auto 24px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
          border: "1.5px solid rgba(245,158,11,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "float 3s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 40 }}>📈</span>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 800, color: "#f9fafb", margin: "0 0 6px", letterSpacing: "-0.04em" }}>
          Higher or Lower
        </h1>
        <p style={{ fontSize: 16, color: "#f59e0b", fontWeight: 600, margin: "0 0 20px" }}>
          Stock Analyst Edition
        </p>

        <p style={{ fontSize: 13.5, color: "#6b7280", margin: "0 auto 32px", maxWidth: 400, lineHeight: 1.7 }}>
          Two companies. Financial data on the table. One hidden metric. Use the formula to calculate which company scores higher — but watch out for <span style={{ color: "#9ca3af" }}>distractor data</span> that's designed to throw you off.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 28 }}>
          {[
            { icon: "📊", text: "Read data" },
            { icon: "🧮", text: "Find the clues" },
            { icon: "➗", text: "Do the math" },
            { icon: "📈", text: "Higher or Lower" },
          ].map((s) => (
            <div key={s.text} style={{
              padding: "12px 6px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: 20, display: "block", marginBottom: 5 }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>{s.text}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 28,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          textAlign: "left",
        }}>
          <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            10 rounds · Escalating Difficulty
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { r: "1–3", d: "Easy", desc: "Big gaps, fewer distractors", color: "#10b981" },
              { r: "4–7", d: "Medium", desc: "Tighter margins, more noise", color: "#f59e0b" },
              { r: "8–10", d: "Hard", desc: "Very close numbers, max distractors", color: "#ef4444" },
            ].map((item) => (
              <div key={item.r} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: item.color, fontFamily: MONO,
                  minWidth: 32,
                }}>
                  R{item.r}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: item.color, minWidth: 52 }}>{item.d}</span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {highScore > 0 && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            Best score: <span style={{ color: "#f59e0b", fontWeight: 700, fontFamily: MONO }}>{highScore}/10</span>
          </p>
        )}

        <button
          onClick={onStart}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%", maxWidth: 240, height: 52, borderRadius: 12, border: "none",
            background: hovered ? "linear-gradient(135deg, #d97706, #b45309)" : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0f", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            boxShadow: hovered ? "0 8px 28px rgba(245,158,11,0.35)" : "0 4px 18px rgba(245,158,11,0.2)",
            transform: hovered ? "translateY(-2px)" : "translateY(0)",
            transition: "all 0.2s ease",
          }}
        >
          Start Game →
        </button>

        <p style={{ fontSize: 10.5, color: "#2d3748", marginTop: 24 }}>
          {companies.length} IDX companies · {METRICS.length} metrics
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@500;600;700;800&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// --- Results Screen ---
function ResultsScreen({ score, total, answers, rounds, highScore, onRestart }) {
  const pct = Math.round((score / total) * 100);
  let grade, gColor, msg;
  if (pct === 100) { grade = "S+"; gColor = "#f59e0b"; msg = "Perfect analyst. Wall Street is calling. 🏆"; }
  else if (pct >= 80) { grade = "A"; gColor = "#10b981"; msg = "Excellent analytical skills! 📈"; }
  else if (pct >= 60) { grade = "B"; gColor = "#3b82f6"; msg = "Solid fundamentals knowledge. 👍"; }
  else if (pct >= 40) { grade = "C"; gColor = "#f59e0b"; msg = "Getting there — practice the formulas! 📚"; }
  else { grade = "D"; gColor = "#ef4444"; msg = "Keep learning, analyst in training! 💪"; }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "linear-gradient(150deg, #07080d 0%, #0d1117 40%, #0a0f1a 100%)",
      fontFamily: FONT,
    }}>
      <div style={{ maxWidth: 500, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 22, margin: "0 auto 20px",
            background: `${gColor}10`, border: `2px solid ${gColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${gColor}15`,
          }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: gColor, fontFamily: MONO }}>{grade}</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f9fafb", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Final Results
          </h2>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>{msg}</p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24,
        }}>
          <div style={{
            padding: "18px", borderRadius: 12, textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Score</p>
            <p style={{ fontSize: 32, fontWeight: 800, margin: 0, fontFamily: MONO, color: "#f9fafb" }}>
              {score}<span style={{ fontSize: 16, color: "#6b7280" }}>/{total}</span>
            </p>
          </div>
          <div style={{
            padding: "18px", borderRadius: 12, textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Best</p>
            <p style={{ fontSize: 32, fontWeight: 800, margin: 0, fontFamily: MONO, color: "#f59e0b" }}>
              {Math.max(score, highScore)}<span style={{ fontSize: 16, color: "#6b7280" }}>/{total}</span>
            </p>
          </div>
        </div>

        <div style={{
          padding: "16px", borderRadius: 14,
          background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: 24, maxHeight: 300, overflowY: "auto",
        }}>
          <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Round Breakdown
          </p>
          {answers.map((a, i) => {
            const r = rounds[i];
            if (!r) return null;
            const diffLabels = ["Easy", "Med", "Hard"];
            const diffColors = ["#10b981", "#f59e0b", "#ef4444"];
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 0",
                borderBottom: i < answers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: a.isCorrect ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  color: a.isCorrect ? "#10b981" : "#ef4444",
                }}>
                  {a.isCorrect ? "✓" : "✗"}
                </span>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, color: diffColors[r.difficulty],
                  minWidth: 30,
                }}>
                  {diffLabels[r.difficulty]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#e5e7eb", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.metric.short}: {r.companyA.ticker} vs {r.companyB.ticker}
                  </p>
                  <p style={{ fontSize: 10, color: "#4b5563", margin: "1px 0 0", fontFamily: MONO }}>
                    {r.metric.format(r.companyA[r.metric.key])} vs {r.metric.format(r.companyB[r.metric.key])}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onRestart}
          style={{
            width: "100%", height: 50, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0f", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            boxShadow: "0 4px 18px rgba(245,158,11,0.2)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN GAME
// ============================================================
export default function StockGame({ companies }) {
  const [screen, setScreen] = useState("start");
  const [rounds, setRounds] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState("guessing");
  const [guess, setGuess] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const TOTAL_ROUNDS = 10;
  const round = rounds[currentIdx];

  function startGame() {
    const rs = generateAllRounds(companies, TOTAL_ROUNDS);
    setRounds(rs);
    setCurrentIdx(0);
    setScore(0);
    setAnswers([]);
    setPhase("guessing");
    setGuess(null);
    setIsCorrect(null);
    setShowHint(false);
    setScreen("playing");
  }

  function handleGuess(g) {
    if (phase !== "guessing" || !round) return;
    setGuess(g);
    setPhase("revealing");

    const correct = g === round.answer;
    setIsCorrect(correct);

    setTimeout(() => {
      setPhase("result");
      if (correct) setScore((s) => s + 1);
      setAnswers((a) => [...a, { guess: g, isCorrect: correct }]);
    }, 1000);
  }

  function handleNext() {
    if (currentIdx + 1 >= rounds.length) {
      setHighScore((h) => Math.max(h, score + (isCorrect ? 1 : 0)));
      setScreen("results");
    } else {
      setCurrentIdx((i) => i + 1);
      setPhase("guessing");
      setGuess(null);
      setIsCorrect(null);
      setShowHint(false);
    }
  }

  function handleQuit() {
    setScreen("start");
  }

  if (screen === "start") {
    return (
      <StartScreen
        onStart={startGame}
        highScore={highScore}
        companies={companies}
      />
    );
  }

  if (screen === "results") {
    return (
      <ResultsScreen
        score={score}
        total={TOTAL_ROUNDS}
        answers={answers}
        rounds={rounds}
        highScore={highScore}
        onRestart={startGame}
      />
    );
  }

  if (!round) return null;

  const { companyA, companyB, metric, answer, distractorCount, difficulty } = round;
  const aVal = companyA[metric.key];
  const bVal = companyB[metric.key];
  const revealed = phase === "revealing" || phase === "result";
  const aWins = aVal > bVal;
  const progress = (currentIdx / TOTAL_ROUNDS) * 100;

  const metricColors = {
    roe: "#10b981",      // Green - profitability
    roa: "#3b82f6",      // Blue - efficiency
    pe: "#f59e0b",       // Orange - valuation
    pb: "#ec4899",       // Pink - book value
    profitMargin: "#8b5cf6",  // Purple - margins
  };
  const metricColor = metricColors[metric.key] || "#f59e0b";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #07080d 0%, #0d1117 40%, #0a0f1a 100%)",
      fontFamily: FONT, padding: "0 0 40px",
    }}>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleQuit}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 7, padding: "4px 10px", cursor: "pointer",
                  fontSize: 11, color: "#6b7280", fontFamily: FONT, fontWeight: 500,
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#9ca3af"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#6b7280"; }}
              >
                ← Menu
              </button>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                Round {currentIdx + 1}/{TOTAL_ROUNDS}
              </span>
              <DifficultyBadge difficulty={difficulty} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: "#4b5563" }}>Score</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#f9fafb", fontFamily: MONO }}>{score}</span>
              <span style={{ fontSize: 11, color: "#4b5563" }}>/{TOTAL_ROUNDS}</span>
            </div>
          </div>
          <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "linear-gradient(90deg, #f59e0b, #d97706)",
              borderRadius: 2, transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 style={{
            fontSize: 20, fontWeight: 700, color: "#f9fafb", margin: "0 0 4px", letterSpacing: "-0.02em",
          }}>
            Which company has the higher{" "}
            <span style={{ color: metricColor }}>{metric.label}</span>?
          </h2>
          <p style={{ fontSize: 12, color: "#4b5563", margin: 0 }}>
            Not all data shown is relevant — find what matters
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <FormulaBar metric={metric} metricColor={metricColor} />
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
          <CompanyPanel
            company={companyA}
            metric={metric}
            revealed={revealed}
            isWinner={aWins}
            distractorCount={distractorCount}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, width: 40,
            alignSelf: "center",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151", fontFamily: MONO }}>VS</span>
            </div>
          </div>
          <CompanyPanel
            company={companyB}
            metric={metric}
            revealed={revealed}
            isWinner={!aWins}
            distractorCount={distractorCount}
          />
        </div>

        {phase === "guessing" && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button
              onClick={() => setShowHint(!showHint)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11.5, color: "#4b5563", fontFamily: FONT,
                textDecoration: "underline", textDecorationStyle: "dotted",
                textUnderlineOffset: "3px",
              }}
            >
              {showHint ? "Hide hint" : "💡 Need a hint?"}
            </button>
            {showHint && (
              <p style={{
                fontSize: 12.5, color: "#9ca3af", marginTop: 6, fontStyle: "italic",
                animation: "fadeSlideIn 0.25s ease", maxWidth: 500, margin: "6px auto 0",
              }}>
                {metric.hint}
              </p>
            )}
          </div>
        )}

        {phase === "guessing" && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => handleGuess("higher")}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "1.5px solid rgba(16,185,129,0.25)",
                background: "rgba(16,185,129,0.04)", color: "#10b981",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(16,185,129,0.04)";
                e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ▲ {companyB.ticker} Higher
            </button>
            <button
              onClick={() => handleGuess("lower")}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "1.5px solid rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.04)", color: "#ef4444",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.04)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ▼ {companyB.ticker} Lower
            </button>
          </div>
        )}

        {phase === "revealing" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              display: "inline-block", width: 36, height: 36, borderRadius: 9,
              border: "3px solid #f59e0b", borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }} />
          </div>
        )}

        {phase === "result" && (
          <div style={{ textAlign: "center", padding: "16px 0", animation: "fadeSlideIn 0.35s ease" }}>
            <div style={{
              display: "inline-block", padding: "7px 18px", borderRadius: 10, marginBottom: 14,
              background: isCorrect ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              border: `1.5px solid ${isCorrect ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: isCorrect ? "#10b981" : "#ef4444" }}>
                {isCorrect ? "✓ Correct!" : "✗ Wrong!"}
              </span>
            </div>

            <div style={{
              maxWidth: 560, margin: "0 auto 16px", padding: "14px 18px", borderRadius: 11,
              background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "left",
            }}>
              <p style={{ fontSize: 10, color: "#f59e0b", margin: "0 0 5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                📊 Analyst's Take
              </p>
              <p style={{ fontSize: 12.5, color: "#9ca3af", margin: 0, lineHeight: 1.7 }}>
                {highlightMetrics(
                  generateInsight(
                    metric,
                    aWins ? companyA : companyB,
                    aWins ? companyB : companyA,
                    aWins ? aVal : bVal,
                    aWins ? bVal : aVal,
                  ),
                  [companyA.ticker, companyB.ticker]
                )}
              </p>
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)", fontFamily: MONO, fontSize: 11.5,
              }}>
                <span style={{ color: "#6b7280" }}>{companyA.ticker}:</span>{" "}
                <span style={{ color: aWins ? "#10b981" : "#e5e7eb" }}>{metric.format(aVal)}</span>
                <span style={{ color: "#374151", margin: "0 8px" }}>vs</span>
                <span style={{ color: "#6b7280" }}>{companyB.ticker}:</span>{" "}
                <span style={{ color: !aWins ? "#10b981" : "#e5e7eb" }}>{metric.format(bVal)}</span>
              </div>
            </div>

            <button
              onClick={handleNext}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#0a0a0f", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {currentIdx + 1 >= TOTAL_ROUNDS ? "See Final Results" : "Next Round →"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@500;600;700;800&display=swap');
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

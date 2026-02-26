import StockGame from './components/StockGame';
import fs from 'fs';
import path from 'path';

export default function Home() {
  // Read companies data from JSON file
  const filePath = path.join(process.cwd(), 'public', 'data', 'companies.json');
  let companies = [];

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    companies = JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading companies data:', error);
    // Return empty array if file doesn't exist
    companies = [];
  }

  return <StockGame companies={companies} />;
}

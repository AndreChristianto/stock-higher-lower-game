export const metadata = {
  title: 'Stock Higher/Lower - Analyst Edition',
  description: 'Test your financial analysis skills with real IDX company data',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

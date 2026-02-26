# Deployment Guide

## Local Development

### Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Run the development server**:
```bash
npm run dev
```

3. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

The game will work immediately with the included sample data.

## Updating Game Data

To use fresh or different company data:

1. Replace `public/data/companies.json` with your own data
2. Reload the browser

See the [main README](README.md) for the required data format.

## Production Deployment

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

The app will be available at http://localhost:3000

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (if you haven't already):
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Production deployment**:
```bash
vercel --prod
```

### Deploy to Netlify

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Build the app**:
```bash
npm run build
```

3. **Deploy**:
```bash
netlify deploy --prod
```

### Deploy to Your Own Server

1. **Build the application**:
```bash
npm run build
```

2. **Copy files to your server**:
   - `.next/` folder
   - `public/` folder
   - `package.json`
   - `node_modules/` (or run `npm install --production` on the server)

3. **Start the server**:
```bash
npm start
```

4. **Use a process manager** like PM2 for production:
```bash
npm install -g pm2
pm2 start npm --name "stock-game" -- start
pm2 save
pm2 startup
```

## Troubleshooting

### Port 3000 already in use

Change the port:
```bash
PORT=3001 npm run dev
```

### Build errors

Make sure you have Node.js 18 or higher:
```bash
node --version
```

## Performance

- The game loads all company data on the server side at page load
- No API calls during gameplay (instant response)
- All calculations happen in the browser

## Support

For issues or questions:
- Check the [README.md](README.md) for general information
- Open an issue on GitHub if you find bugs

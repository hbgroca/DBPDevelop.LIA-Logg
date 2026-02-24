# WIN 24 LIA Logg

En personlig arbetslogg för att dokumentera dagliga aktiviteter under en 24-veckors LIA-period.

## Kom igång

Applikationen kräver att både frontend och backend körs samtidigt.

### Krav

- [Node.js](https://nodejs.org/) installerat

### Installation

**Steg 1 – Installera frontend-paket** (i rotkatalogen):
```bash
npm install
```

**Steg 2 – Installera backend-paket** (i `server/`-katalogen):
```bash
cd server && npm install
```

### Starta applikationen

**Backend** (port 3001) – kör i ett terminalfönster:
```bash
cd server && node index.js
```

**Frontend** (port 5173) – kör i ett annat terminalfönster:
```bash
npm run dev
```

Öppna sedan [http://localhost:5173](http://localhost:5173) i din webbläsare.

Du kan även använda genvägarna `_install.bat`, `_startBackend.bat` och `_startFrontend.bat` på Windows.

## Viktigt

- All data sparas lokalt i mappen `public/` — gör regelbundna säkerhetskopior.
- Bilder lagras i `public/images/` och loggdata i `public/data.json`.

## Utseende

<img src="/LIA_Logg.png" alt="Nuvarande design av applikationen">

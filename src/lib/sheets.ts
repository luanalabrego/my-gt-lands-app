  // src/lib/sheets.ts
  import { google } from 'googleapis';
  import path from 'path';

  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  const SPREADSHEET_ID = '1RKsyNuRT61ERq_PBdgirNaACXqgXyMuMoNwaXQ30Fqs';
  const RANGE = 'Cadastro de Propriedades!A8:BG';

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'src/lib/credentials.json'),
    scopes: SCOPES,
  });

  export async function getPropriedadesFromSheet() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    return res.data.values || [];
  }

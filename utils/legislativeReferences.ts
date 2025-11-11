export const italianMonths: { [key: string]: string } = {
  'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
  'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
  'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
};

export interface LinkifierRule {
  name: string;
  regex: RegExp;
  urlFormatter: (match: RegExpExecArray) => string;
  titleFormatter: (match: RegExpExecArray) => string;
}

export const linkifierRules: LinkifierRule[] = [
  {
    name: 'GazzettaUfficiale',
    regex: /(Gazzetta\s*Ufficiale(?:[\s\w\p{P}-]*?)n\.\s*(\d+)\s*del\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4}))/gi,
    urlFormatter: (match) => {
      const gazzettaNum = match[2];
      const day = match[3];
      const month = match[4];
      const year = match[5];
      const formattedDate = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
      return `https://www.gazzettaufficiale.it/do/gazzetta/serie_generale/0/pdfPaginato?dataPubblicazioneGazzetta=${formattedDate}&numeroGazzetta=${gazzettaNum}&tipoSerie=SG&tipoSupplemento=GU&numeroSupplemento=0&progressivo=0&numPagina=1&edizione=0&elenco30giorni=true`;
    },
    titleFormatter: (match) => `Visualizza la ${match[0]}`,
  },
  {
    name: 'DecretoLeggeConData',
    regex: /(Decreto\s*Legge|D\.L\.)\s*(\d+)\s*del\s*(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s*(\d{4})/gi,
    urlFormatter: (match) => {
      const num = match[2];
      const day = match[3].padStart(2, '0');
      const monthName = match[4].toLowerCase();
      const month = italianMonths[monthName];
      const year = match[5];
      return `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:${year}-${month}-${day};${num}!vig=`;
    },
    titleFormatter: (match) => `Consulta il ${match[0]} su Normattiva`,
  },
  {
    name: 'LeggeConAnno',
    regex: /(Legge|L\.)\s*(\d+)\s*\/\s*(\d{4})/gi,
    urlFormatter: (match) => {
      const num = match[2];
      const year = match[3];
      return `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:${year};${num}!vig=`;
    },
    titleFormatter: (match) => `Consulta la ${match[0]} su Normattiva`,
  },
  {
    name: 'LeggeConDataCompleta',
    regex: /(Legge|L\.)\s*(\d+)\s*del\s*(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s*(\d{4})/gi,
    urlFormatter: (match) => {
        const num = match[2];
        const day = match[3].padStart(2, '0');
        const monthName = match[4].toLowerCase();
        const month = italianMonths[monthName];
        const year = match[5];
        return `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:${year}-${month}-${day};${num}!vig=`;
    },
    titleFormatter: (match) => `Consulta la ${match[0]} su Normattiva`,
  },
];

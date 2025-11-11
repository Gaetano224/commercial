import { ExtractedPdfLink } from '../types'; // Ensure this type is correctly defined and imported
import { linkifierRules, italianMonths } from './legislativeReferences'; // Import centralized rules

export const extractPdfLinks = (text: string): ExtractedPdfLink[] => {
  const allPdfLinks: ExtractedPdfLink[] = [];
  const processedUrls = new Set<string>();

  // 1. Regex for direct .pdf links
  const directPdfRegex = /https?:\/\/[^\s"'<>]+\.pdf(\?[^\s"'<>]+)?/gi;
  let directMatch;

  while ((directMatch = directPdfRegex.exec(text)) !== null) {
    const url = directMatch[0];
    if (processedUrls.has(url)) continue;

    let fileName = 'documento.pdf'; 
    try {
      const urlPath = new URL(url).pathname;
      const nameFromPath = urlPath.substring(urlPath.lastIndexOf('/') + 1);
      if (nameFromPath) {
        fileName = decodeURIComponent(nameFromPath);
      }
    } catch (e) {
      const simpleFileMatch = url.match(/[^/\\&?]+\.pdf(?=[?&]|$)/i);
      if (simpleFileMatch) {
        fileName = simpleFileMatch[0];
      }
      // console.warn(`Could not parse URL ${url} for filename, using fallback or simple match. Error: ${e}`);
    }
    
    allPdfLinks.push({
      url,
      fileName,
      title: fileName, 
    });
    processedUrls.add(url);
  }

  // 2. Process legislative references using linkifierRules
  for (const rule of linkifierRules) {
    let legislativeMatch;
    rule.regex.lastIndex = 0; // Reset lastIndex for global regexes

    while ((legislativeMatch = rule.regex.exec(text)) !== null) {
      const url = rule.urlFormatter(legislativeMatch);
      if (processedUrls.has(url)) continue;

      const title = legislativeMatch[0]; // Use the full matched text as the title
      let fileName = '';

      // Generate fileName based on rule name
      // Group indices are based on the specific regex in linkifierRules
      try {
        if (rule.name === 'GazzettaUfficiale') {
          const gazzettaNum = legislativeMatch[2]; 
          const day = legislativeMatch[3].padStart(2, '0');
          const month = legislativeMatch[4].padStart(2, '0');
          const year = legislativeMatch[5];
          fileName = `GU_SG_N${gazzettaNum}_${year}-${month}-${day}.pdf`;
        } else if (rule.name === 'DecretoLeggeConData') {
          const num = legislativeMatch[2];
          const day = legislativeMatch[3].padStart(2, '0');
          const monthName = legislativeMatch[4].toLowerCase();
          const month = italianMonths[monthName];
          const year = legislativeMatch[5];
          fileName = `DL_${num}_${year}-${month}-${day}.html`;
        } else if (rule.name === 'LeggeConAnno') {
          const num = legislativeMatch[2];
          const year = legislativeMatch[3];
          fileName = `Legge_${num}_${year}.html`;
        } else if (rule.name === 'LeggeConDataCompleta') {
          const num = legislativeMatch[2];
          const day = legislativeMatch[3].padStart(2, '0');
          const monthName = legislativeMatch[4].toLowerCase();
          const month = italianMonths[monthName];
          const year = legislativeMatch[5];
          fileName = `Legge_${num}_${year}-${month}-${day}.html`;
        } else {
          // Fallback filename for any other rule type
          fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
        }
      } catch (e) {
          // console.warn(`Error generating filename for rule ${rule.name} and match ${title}: ${e}`);
          fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
      }


      allPdfLinks.push({
        url,
        fileName,
        title,
      });
      processedUrls.add(url);
    }
  }
  
  return allPdfLinks;
};

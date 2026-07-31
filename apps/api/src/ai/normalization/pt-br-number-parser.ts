export function normalizePtBrText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9$\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePtBrNumber(value: string): number | undefined {
  const normalized = normalizePtBrText(value);
  if (/^\d+$/.test(normalized)) {
    const asNumber = Number(normalized);
    return Number.isFinite(asNumber) && asNumber >= 0 && asNumber <= 999 ? asNumber : undefined;
  }

  const numberWords = normalized
    .split(/\s+/)
    .filter((token) => token.length > 0 && token !== 'e');
  if (numberWords.length === 0) {
    return undefined;
  }

  const units: Record<string, number> = {
    zero: 0,
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10,
    onze: 11,
    doze: 12,
    treze: 13,
    catorze: 14,
    quatorze: 14,
    quinze: 15,
    dezesseis: 16,
    dezassete: 17,
    dezesete: 17,
    dezoito: 18,
    dezenove: 19,
  };

  const tens: Record<string, number> = {
    vinte: 20,
    trinta: 30,
    quarenta: 40,
    cinquenta: 50,
    sessenta: 60,
    setenta: 70,
    oitenta: 80,
    noventa: 90,
  };

  const hundreds: Record<string, number> = {
    cem: 100,
    cento: 100,
    duzentos: 200,
    trezentos: 300,
    quatrocentos: 400,
    quinhentos: 500,
    seiscentos: 600,
    setecentos: 700,
    oitocentos: 800,
    novecentos: 900,
  };

  let result = 0;
  for (const word of numberWords) {
    if (
      word === 'por' ||
      word === 'de' ||
      word === 'do' ||
      word === 'da' ||
      word === 'no' ||
      word === 'na' ||
      word === 'ao' ||
      word === 'a'
    ) {
      continue;
    }

    if (hundreds[word] !== undefined) {
      result += hundreds[word];
      continue;
    }

    if (tens[word] !== undefined) {
      result += tens[word];
      continue;
    }

    if (units[word] !== undefined) {
      result += units[word];
      continue;
    }

    return undefined;
  }

  if (!Number.isFinite(result) || result < 0 || result > 999) {
    return undefined;
  }

  return result;
}

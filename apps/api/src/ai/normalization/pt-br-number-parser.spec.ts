import { parsePtBrNumber } from './pt-br-number-parser';

describe('parsePtBrNumber', () => {
  it('parses simple units and tens', () => {
    expect(parsePtBrNumber('duas')).toBe(2);
    expect(parsePtBrNumber('quarenta e dois')).toBe(42);
  });

  it('parses hundreds up to 999', () => {
    expect(parsePtBrNumber('cento e quarenta')).toBe(140);
    expect(parsePtBrNumber('novecentos e noventa e nove')).toBe(999);
  });

  it('accepts numeric string within supported range', () => {
    expect(parsePtBrNumber('230')).toBe(230);
  });

  it('returns undefined for unsupported inputs', () => {
    expect(parsePtBrNumber('mil')).toBeUndefined();
    expect(parsePtBrNumber('1000')).toBeUndefined();
    expect(parsePtBrNumber('')).toBeUndefined();
  });
});

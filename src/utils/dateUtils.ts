/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário local.
 * Isso evita bugs de "virada de dia" precoce quando se usa .toISOString() (UTC).
 */
export const getLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

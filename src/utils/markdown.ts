import { marked } from 'marked';
import { decode } from 'html-entities';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);
const newline = /\n/g;
const ws = /\s{2,}/g;

/**
 * Extract only the text content from markdown
 * @param markdown Text formatted in markdown
 * @param options Text cleanup options
 * @returns Text content extracted from markdown
 */
export const getMdInnerText = (
  markdown: string,
  options: { keep?: { newline?: boolean; whitespace?: boolean } } = {}
) => {
  const html = marked.parse(markdown);
  const purifiedHtml = purify.sanitize(html);
  let innerText = purifiedHtml
    .split(/\s*<[^>]+>\s*/)
    .map((node) => node.trim())
    .join(' ')
    .trim();
  if (!options?.keep?.newline) {
    innerText = innerText.replace(newline, ' ');
  }
  if (!options?.keep?.whitespace) {
    innerText = innerText.replace(ws, ' ');
  }
  const decoded = decode(innerText);
  return decoded;
};

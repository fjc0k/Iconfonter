import prettier from 'prettier/standalone'

const tsParser = require('prettier/parser-typescript')
const jsParser = require('prettier/parser-babel')

export interface FormatCodePayload {
  language: 'typescript' | 'javascript',
  code: string,
}

export function formatCode(payload: FormatCodePayload): string {
  return prettier.format(payload.code, {
    parser: payload.language === 'javascript' ? 'babel' : 'typescript',
    plugins: [tsParser, jsParser],
    semi: false,
    singleQuote: true,
    quoteProps: 'consistent',
    jsxSingleQuote: true,
    jsxBracketSameLine: true,
  })
}

// NOTE: 将 Prism 提前，防止其插件找不到宿主
import Prism from 'prismjs'

import 'prismjs/components/prism-css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'

import _ from './index.module.less'
import React, { useMemo } from 'react'

export interface XCodeProps {
  language: 'css' | 'json' | 'typescript',
  code: string,
  wrap?: boolean,
}

export function XCode(props: XCodeProps) {
  const highlightedCode = useMemo(() => {
    return !props.code ? '' : Prism.highlight(
      props.code,
      Prism.languages[props.language],
    )
  }, [props.language, props.code])

  return (
    <pre
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      className={`language-${props.language} ${props.wrap && _.wrap}`}
    />
  )
}

import _ from './index.module.less'
import React, { useCallback } from 'react'
import { XIcon } from '../Icon'

export interface XDialogProps {
  visible: boolean,
  title: string,
  footer?: React.ReactNode,
  children?: any,
  onVisibleChange: (visible: boolean) => any,
}

export function XDialog(props: XDialogProps) {
  const handleToggle = useCallback(() => {
    props.onVisibleChange(!props.visible)
  }, [props.visible])

  return (
    <div className={`${_.dialog} ${!props.visible && _.hidden}`}>
      <div className={_.mask} onClick={handleToggle} />
      <div className={_.content}>
        <div className={_.title}>
          {props.title}
        </div>
        <div className={_.main}>
          {props.children}
        </div>
        <div className={_.footer}>
          {props.footer}
        </div>
        <XIcon
          className={_.close}
          name='close'
          onClick={handleToggle}
        />
      </div>
    </div>
  )
}

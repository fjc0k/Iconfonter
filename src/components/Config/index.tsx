import React from 'react'
import { Popover, Checkbox } from 'antd'
import XIcon from '../Icon'
import _ from './index.module.less'

export type ConfigOptions = Array<{
  name: string,
  title: string,
  type: 'check' | 'input',
}>

export default class XConfig extends React.Component<{
  config: ConfigOptions,
  value: object,
  onChange: (key: string, value: any) => any,
  }> {
  render() {
    const { config, value, onChange } = this.props
    return (
      <span>
        <Popover
          placement='bottom'
          content={(
            <div className={_.list}>
              {config.map((item, index) => (
                <div className={_.item} key={index}>
                  {item.type === 'check' ? (
                    <Checkbox
                      checked={!!(value as any)[item.name]}
                      onChange={e => onChange(item.name, e.target.checked)}>
                      <span className={_.title}>
                        {item.title}
                      </span>
                    </Checkbox>
                  ) : (
                    // todo
                    <div></div>
                  )}
                </div>
              ))}
            </div>
          )}>
          <XIcon className={_.icon} name='config' />
        </Popover>
      </span>
    )
  }
}

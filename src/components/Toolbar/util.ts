import type { toolbarInfo } from './interface'

export function createDefaultToolbarItemInfo(type: string) {
  let info: toolbarInfo;

  switch (type) {
    case 'undo':
      info = {
        name: 'undo',
        className: 'mu-picture__toolbar-undo',
        command: 'undo',
        tooltip: 'undo',
      }
      break
    case 'redo':
      info = {
        name: 'redo',
        className: 'mu-picture__toolbar-redo',
        command: 'redo',
        tooltip: 'redo',
      }
      break
    case 'text':
      info = {
        name: 'text',
        className: 'text',
        tooltip: '添加文字',
      }
      break
    case 'mosaic':
      info = {
        name: 'mosaic',
        className: 'mosaic',
        command: 'mosaic',
        tooltip: '马赛克',
      }
      break
    case 'clip':
      info = {
        name: 'clip',
        className: 'clip',
        tooltip: '裁剪',
        command: 'clip'
      }

    default:
    // do nothing
  }
  return info
}
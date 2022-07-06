import type { Parameters } from './interface'

/**
 * Add mosaic in canvas
 */
export function Mosaic(params: Parameters) {
  const { top, right, bottom, left } = params.rect
  const { size, degree } = params.mosaic
  const x = params.event.clientX
  const y = params.event.clientY

  if (x < left || x > right || y < top || y > bottom) return

  if (params.position.x - x > size / 2 || x - params.position.x > size / 2 || params.position.y - y > size / 2 || y - params.position.y > size / 2) {
    const image = params.context.getImageData(x - left, y - top, size, size)
    const { width, height } = image
    // 等分画布
    const stepW = width / degree
    const stepH = height / degree
    // 这里是循环画布的像素点
    for(let i = 0; i < stepH; i++) {
      for(let j = 0; j < stepW; j++) {
        // 获取一个小方格的随机颜色，这是小方格的随机位置获取的
        const color = getXY(image, j * degree + Math.floor(Math.random() * degree), i * degree + Math.floor(Math.random() * degree))
        // 这里是循环小方格的像素点，
        for(let k = 0; k < degree; k++) {
          for(let l = 0; l < degree; l++) {
            // 设置小方格的颜色
            setXY(image, j * degree + l, i * degree + k, color)
          }    
        }
      }    
    }
    params.callback({ image, x, y, left, top })
  }
}

function getXY(obj: ImageData, x: number, y: number){
  const w = obj.width
  const h = obj.height
  const d = obj.data
  const color = []
  color[0] = d[4 * ( y * w + x )]
  color[1] = d[4 * ( y * w + x ) + 1]
  color[2] = d[4 * ( y * w + x ) + 2]
  color[3] = d[4 * ( y * w + x ) + 3]
  return color
}

function setXY(obj: ImageData, x: number, y: number, color: any[]){
  const w = obj.width
  const h = obj.height
  const d = obj.data
  d[4 * ( y * w + x )] = color[0]
  d[4 * ( y * w + x ) + 1] = color[1]
  d[4 * ( y * w + x ) + 2] = color[2]
  d[4 * ( y * w + x ) + 3] = color[3]
}
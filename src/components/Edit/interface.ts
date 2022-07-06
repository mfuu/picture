export interface Position {
  x: number;
  y: number;
}

export interface MosaicParam {
  size: number; // mosaic size
  degree: number; // The degree of mosaic, the larger the number, the more blurred
}

export interface Parameters {
  event: PointerEvent;
  rect: ClientRect;
  position: Position;
  mosaic: MosaicParam;
  context: CanvasRenderingContext2D;
  callback: Function; // 
}
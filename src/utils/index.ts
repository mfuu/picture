function userAgent(pattern) {
	if (typeof window !== 'undefined' && window.navigator) {
		return !!/*@__PURE__*/navigator.userAgent.match(pattern);
	}
}

export const IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
export const Edge = userAgent(/Edge/i);
export const FireFox = userAgent(/firefox/i);
export const Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
export const IOS = userAgent(/iP(ad|od|hone)/i);
export const ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);

export function isBase64(str: string) {
  const RegExp = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
  return RegExp.test(str)
}

export function isUrl(str: string) {
  const reg = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$','i')
  return reg.test(str)
}

export function blobToUrl(Blob: Blob) {
  if (window.createObjectURL !== undefined) {
    // basic
    return window.createObjectURL(Blob)
  } else if (window.URL.createObjectURL !== undefined) {
    // mozilla(firefox)
    return window.URL.createObjectURL(Blob)
  } else if (window.webkitURL?.createObjectURL !== undefined) {
    // webkit or chrome
    return window.webkitURL.createObjectURL(Blob)
  }
}

export function base64ToBlob(str: string) {
  let arr = str.split(',')
  let mime = arr[0].match(/:(.*?);/)[1]
  let bstr = atob(arr[1])
  let n = bstr.length
  let u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export function base64ToUrl(str: string) {
  return blobToUrl(base64ToBlob(str))
}

export function getImageUrl(img: Blob | string) {
  if (img instanceof Blob) {
    return blobToUrl(img)
  } else if (typeof img === 'string') {
    if (isUrl(img)) return img
    else if (isBase64(img)) return base64ToUrl(img)
    else throw new TypeError('Type Error: is not a valid image format')
  } else {
    throw new TypeError('Type Error: is not a valid image format')
  }
}


const captureMode = { capture: false, passive: false }

/**
* add specified event listener
*/
export function on(el: HTMLElement, event: string, fn: EventListenerOrEventListenerObject) {
  if (window.addEventListener) {
    el.addEventListener(event, fn, !IE11OrLess && captureMode)
  } else if (window.attachEvent) {
    el.addEventListener('on' + event, fn)
  }
 }
 
/**
* remove specified event listener
*/
export function off(el: HTMLElement, event: string, fn: EventListenerOrEventListenerObject) {
  if (window.removeEventListener) {
    el.removeEventListener(event, fn, !IE11OrLess && captureMode)
  } else if (window.detachEvent) {
    el.detachEvent('on' + event, fn)
  }
}

export function css(el: HTMLElement, prop: string, val: any) {
  let style = el && el.style
  if (style) {
    if (val === void 0) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, '')
      } else if (el.currentStyle) {
        val = el.currentStyle
      }
      return prop === void 0 ? val : val[prop]
    } else {
      if (!(prop in style) && prop.indexOf('webkit') === -1) {
        prop = '-webkit-' + prop
      }
      style[prop] = val + (typeof val === 'string' ? '' : 'px')
    }
  }
}

export function assign(targetObj: object, obj: object) {
  Object.keys(obj).forEach((prop) => {
    if (targetObj.hasOwnProperty(prop) && typeof targetObj[prop] === 'object') {
      if (Array.isArray(obj[prop])) {
        targetObj[prop] = obj[prop];
      } else {
        assign(targetObj[prop], obj[prop]);
      }
    } else {
      targetObj[prop] = obj[prop];
    }
  })
  return targetObj
}
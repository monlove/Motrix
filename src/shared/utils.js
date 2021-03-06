import {
  isEmpty,
  isNaN,
  parseInt,
  isFunction,
  camelCase,
  kebabCase
} from 'lodash'
import { userKeys, systemKeys } from './configKeys'

export function bytesToSize (bytes) {
  const b = parseInt(bytes, 10)
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (b === 0) { return '0 KB' }
  const i = parseInt(Math.floor(Math.log(b) / Math.log(1024)), 10)
  if (i === 0) { return `${b} ${sizes[i]}` }
  return `${(b / (1024 ** i)).toFixed(1)} ${sizes[i]}`
}

export function calcProgress (totalLength, completedLength) {
  const total = parseInt(totalLength, 10)
  const completed = parseInt(completedLength, 10)
  if (total === 0 || completed === 0) {
    return 0
  }
  const percentage = completed / total * 100
  const result = parseFloat(percentage.toFixed(2))
  return result
}

export function timeRemaining (totalLength, completedLength, downloadSpeed) {
  const remainingLength = totalLength - completedLength
  return Math.ceil(remainingLength / downloadSpeed)
}

export function timeFormat (seconds, prefix = '', suffix = '') {
  let result = ''
  let hours = ''
  let minutes = ''
  let secs = seconds || 0

  if (secs <= 0) {
    return ''
  }
  if (secs > 86400) {
    return `${prefix} 超过一天 ${suffix}`
  }
  if (secs > 3600) {
    hours = `${Math.floor(secs / 3600)}时 `
    secs %= 3600
  }
  if (secs > 60) {
    minutes = `${Math.floor(secs / 60)}分 `
    secs %= 60
  }
  secs += '秒'
  result = hours + minutes + secs
  return result ? `${prefix} ${result} ${suffix}` : result
}

export function getTaskName (task, defaultName = '') {
  let result = defaultName
  if (!task) {
    return result
  }

  const { files, bittorrent } = task

  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    result = bittorrent.info.name
    return result
  }

  if (files && files.length === 1) {
    result = getFileName(files[0])
  }

  if (files.length > 1) {
    let cnt = 0
    for (let i = 0; i < files.length; i += 1) {
      if (files[i].selected === 'true') {
        cnt += 1
      }
    }
    if (cnt > 1) {
      result += ` (${cnt} 文件...)`
    }
  }

  return result
}

export function getFileName (file) {
  if (!file) {
    return ''
  }

  let { path } = file
  if (!path && file.uris && file.uris.length > 0) {
    path = decodeURI(file.uris[0].uri)
  }

  const index = path.lastIndexOf('/')

  if (index <= 0 || index === path.length) {
    return path
  }

  return path.substring(index + 1)
}

export function getTaskFullPath (task) {
  const { dir, files, bittorrent } = task
  let result = ''

  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    result = `${dir}/${bittorrent.info.name}`
    return result
  }

  const [file] = files
  const { path } = file
  result = path

  if (!path && files && files.length === 1) {
    result = `${dir}/${getFileName(file)}`
  }

  return result
}

export function getTaskUri (task) {
  const { files } = task
  let result = ''
  if (checkTaskIsBT(task)) {
    result = '种子任务'
    return result
  }

  if (files && files.length === 1) {
    const { uris } = files[0]
    result = uris[0].uri
  }

  return result
}

export function checkTaskTitleIsEmpty (task) {
  const { files, bittorrent } = task
  const [file] = files
  const { path } = file
  let result = path
  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    result = bittorrent.info.name
  }
  return result === ''
}

export function checkTaskIsBT (task) {
  const { bittorrent } = task
  return !!bittorrent
}

export function isTorrent (file) {
  const { name, type } = file
  return name.endsWith('.torrent') || type === 'application/x-bittorrent'
}

export function getAsBase64 (file, callback) {
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    const result = reader.result.replace('data:;base64,', '')
    callback(result)
  })
  reader.readAsDataURL(file)
}

export function mergeTaskResult (response = []) {
  let result = []
  for (const res of response) {
    result = result.concat(...res)
  }
  return result
}

export function changeKeysCase (obj, caseConverter) {
  const result = {}
  if (isEmpty(obj) || !isFunction(caseConverter)) {
    return result
  }

  for (const [k, value] of Object.entries(obj)) {
    const key = caseConverter(k)
    result[key] = value
  }

  return result
}

export function changeKeysToCamelCase (obj) {
  return changeKeysCase(obj, camelCase)
}

export function changeKeysToKebabCase (obj) {
  return changeKeysCase(obj, kebabCase)
}

export function validateNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n) && Number(n) === n
}

export function fixValue (obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === 'true') {
      result[k] = true
    } else if (v === 'false') {
      result[k] = false
    } else if (validateNumber(v)) {
      result[k] = Number(v)
    } else {
      result[k] = v
    }
  }
  return result
}

export function separateConfig (options) {
  // user
  const user = {}
  // system
  const system = {}
  // others
  const others = {}
  for (const [k, v] of Object.entries(options)) {
    if (userKeys.indexOf(k) !== -1) {
      user[k] = v
    } else if (systemKeys.indexOf(k) !== -1) {
      system[k] = v
    } else {
      others[k] = v
    }
  }
  return {
    user, system, others
  }
}

export function compactUndefined (arr = []) {
  return arr.filter((item) => {
    return item !== undefined
  })
}

export function splitTextRows (text = '') {
  return text.replace(/\r\n/g, '\n').split('\n') || []
}

const audioSuffix = ['.aac', '.mp3', '.ogg', '.ape', '.flac', '.m4a', '.wav', '.wma', '.flav']
const videoSuffix = ['.avi', '.mkv', '.rmvb', '.wmv', '.mp4', '.m4a', '.vob', '.mov', '.mpg']
export function isAudioOrVideo (uri = '') {
  const suffixs = [...audioSuffix, ...videoSuffix]
  const result = suffixs.some((suffix) => {
    return uri.includes(suffix)
  })
  console.warn('isAudioOrVideo===>', result)
  return result
}

export function needCheckCopyright (uris) {
  const avs = uris.filter(uri => {
    return isAudioOrVideo(uri)
  })

  const result = avs.length > 0
  return result
}

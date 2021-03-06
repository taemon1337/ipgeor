let valueTypes = ['INPUT', 'TEXTAREA']
let booleanTypes = ['checkbox', 'radio']

export default function serializeForm (form) {
  if (!form || form.nodeName !== 'FORM') {
    return null
  }
  let i = null
  let j = null
  let obj = {}

  for (i = form.elements.length - 1; i >= 0; i = i - 1) {
    let el = form.elements[i]
    if (el.name === '') {
      continue
    }
    if (valueTypes.indexOf(el.nodeName) >= 0) {
      if (booleanTypes.indexOf(el.type) >= 0) {
        obj[el.name] = el.checked
      } else {
        obj[el.name] = el.value
      }
    } else if (el.nodeName === 'SELECT') {
      if (el.type === 'select-multiple') {
        let arr = []
        for (j = 0; j < el.options.length; j += 1) {
          if (el.options[j].selected) {
            arr.push(el.options[j].value)
          }
        }
        obj[el.name] = arr
      } else {
        obj[el.name] = el.value
      }
    }
  }
  return obj
}

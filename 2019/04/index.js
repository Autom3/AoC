const START = 254032
const END = 789860

function * range (start, end) {
  for (let i = start; i <= end; i++) {
    yield i
  }
}

function sixDigitCriteria (x) {
  return x >= 100000 && x <= 999999
}

const adjacentSameRegex = /(\d)\1/
function twoAdjacentDigits (x) {
  return adjacentSameRegex.test(x.toString())
}

function exactlyTwoAdjacentDigits (x) {
  return twoAdjacentDigits(x) && Object.values(x.toString().split('').reduce((a, b) => { a[b] ? a[b]++ : a[b] = 1; return a }, {})).some(a => a === 2)
}

function digitsIncrease (x) {
  return x.toString().split('').map(i => parseInt(i)).reduce((a, b) => (a === null ? null : (a <= b ? b : null))) !== null
}

function meetsCriteria (criteria, x) {
  return criteria.every(c => c(x))
}

function one () {
  const criteria = [twoAdjacentDigits, digitsIncrease]
  return [...range(START, END)].filter(x => meetsCriteria(criteria, x)).length
}

function two () {
  const criteria = [exactlyTwoAdjacentDigits, digitsIncrease]
  return [...range(START, END)].filter(x => meetsCriteria(criteria, x)).length
}

console.log(one())
console.log(two())

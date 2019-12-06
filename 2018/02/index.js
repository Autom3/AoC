const fs = require('fs')
const path = require('path')

const testing = true

const real_input_file = path.join(__dirname, 'puzzle_input.txt')
const real_input = fs.readFileSync(real_input_file, 'utf-8')
const test_input = ['abcdef', 'bababc', 'abbcde', 'abcccd', 'aabcdd', 'abcdee', 'ababab']


let _input
function getInput(){
    if (_input !== undefined) {
        return _input
    }
    if (testing) {
        _input = test_input
    } else {
        _input = real_input.split('\n')
    }
    return _input
}

function toCharDict(x) {
    let d = {}
    x.split('').forEach(x => {
        if (d[x] === undefined) {
            d[x] = 1
        } else {
            d[x]++
        }
    })
    return d
}

function reverseDict(d) {
    let r = {}
    for (let c in d) {
        r[d[c]] = c
    }
    return r
}

function partOne() {
    return getInput().map(x => {
        return {
            str: x,
            chars: reverseDict(toCharDict(x))
        }
    })
}

function partTwo() {

}

console.log(partOne())
console.log(partTwo())
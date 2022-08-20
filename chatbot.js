const fs = require('fs')
const markov = require('./markov.js')

let lastMessage = false 
let sentenceData
let wordData

if(fs.existsSync(__dirname+'\\sentence_data.txt')){
    const sentence_data = fs.readFileSync(__dirname+'\\sentence_data.txt')
    sentenceData = sentence_data.toString().split('\n')
    console.log('sentence_data file found with '+sentenceData.length+' entries.')
    console.log(sentenceData)
}else{
    sentenceData = []
    console.log('sentence_data file NOT found.')
}
if(fs.existsSync(__dirname+'\\word_data.txt')){
    const word_data = fs.readFileSync(__dirname+'\\word_data.txt')
    wordData = JSON.parse(word_data)
    console.log('word_data file found with '+Object.keys(wordData).length+' entries.')
}else{
    wordData = {}
    console.log('word_data file NOT found.')
}

function log(message){
    if(!message)return
    if(!lastMessage)return lastMessage = message

    const index = sentenceData.push(message)-1 // get the index of the newly saved sentence
    const words = lastMessage.split(/[ |]/) // split the last message into words, the sentence the word is in doesn't matter here
    for(let x=0;x<words.length;x++){
        (wordData[words[x]]??=[]).push(index) // for each word in the previous message, save the index of the response to it
    }
    lastMessage = message
}

function respond(message){
    const words = message.split(' ')
    const allSentences = []
    for(let x=0;x<words.length;x++){
        if(!Object.hasOwn(wordData,words[x]))continue // if no logged response to a word exists, skip it
        const sentenceIndexes = wordData[words[x]]
        for(let y=0;y<sentenceIndexes.length;y++)
        allSentences.push(...sentenceData[sentenceIndexes[y]].split('|')) // save each sentence as a separate message
    }
    if(allSentences.length > 0){ // check if the pool of responses is not empty
        return markov(allSentences) // generate a new unique response from the pool of responses
    }
    return null // if no logged responses to any of the words in the message exist, return null
}

function close(code){
    console.log('Closing with code: '+code)
    if(sentenceData.length>0)fs.writeFileSync(__dirname+'\\sentence_data.txt',sentenceData.join('\n'))
    if(Object.keys(wordData).length>0)fs.writeFileSync(__dirname+'\\word_data.txt',JSON.stringify(wordData))
    console.log('Saved.')
    process.exit()
}
['exit', 'SIGIN', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM','SIGHUP'].forEach((event) => {
    process.on(event,close);
}) // save the files if user closes the window / exception occurs
module.exports = {log,respond,close}
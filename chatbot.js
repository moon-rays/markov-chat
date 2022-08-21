const fs = require('fs')
const path = require('path')
const markov = require('./markov.js')
const exitEvents = ['exit', 'SIGIN', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM','SIGHUP']

class Chatbot{
    lastMessage = false
    #autoSaveVal = false
    #boundSave = this.save.bind(this,true) // to use in the process event listener

    constructor({wordData={},sentenceData=[],sentenceDataFile='sentenceData.txt',wordDataFile='wordData.txt',doClean=true}={}){
        this.wordData = wordData
        this.sentenceData = sentenceData
        this.sentenceDataFile = sentenceDataFile
        this.wordDataFile = wordDataFile
        this.doClean = doClean
    }

    log(message){
        if(!(message instanceof Array)) message = [message]
        if(this.doClean) message = message.map(e=>Chatbot.clean(e)) // if doClean is set to true, clean the sentences (keep only a-z, 0-9 and spaces)
        message = message.filter(e=>e) // keep only sentences that aren't empty
        if(message.length === 0) return false // if no sentences are left
        if(!this.lastMessage) return this.lastMessage = message

        const index = this.sentenceData.push(message.join('|'))-1 // get the index of the newly saved sentences ( | is used to split sentences when saved )
        const words = this.lastMessage.join(' ').split(' ') // split the last message into words, the sentence the word is in doesn't matter here
        for(let x=0;x<words.length;x++){
            (this.wordData[words[x]]??=[]).push(index) // for each word in lastMessage, save the index of the response to it
        }
        return this.lastMessage = message
    }

    respond(message){
        const words = message.toString().split(' ')
        const allSentences = []
        for(let x=0;x<words.length;x++){
            if(!Object.hasOwn(this.wordData,words[x])) continue // if no logged response to a word exists, skip it
            const sentenceIndexes = this.wordData[words[x]]
            for(let y=0;y<sentenceIndexes.length;y++)
                allSentences.push(...this.sentenceData[sentenceIndexes[y]].split('|')) // treat each sentence as a separate message
            }
        if(allSentences.length > 0){ // check if the pool of responses is not empty
            return markov(allSentences) // generate a new unique response from the pool of responses
        }
        return null // if no logged responses to any of the words in the message exist, return null
    }

    say(){
            if(this.sentenceData.length === 0) return null
            const everySentence = this.sentenceData.flatMap(e=>e.split('|')) // separate the joined sentences
            return markov(everySentence)
    }

    load(){
        if(fs.existsSync(path.join(__dirname,this.sentenceDataFile))){
            var sentence_data = fs.readFileSync(path.join(__dirname,this.sentenceDataFile)).toString().split('\n')
            if(!sentence_data[0]) return false // file is empty
        }else{
            return false
        }
        if(fs.existsSync(path.join(__dirname,this.wordDataFile))){
            var word_data = fs.readFileSync(path.join(__dirname,this.wordDataFile))
            if(!word_data) return false // file is empty
        }else{
            return false
        }
        this.sentenceData = sentence_data
        this.wordData = JSON.parse(word_data)
        return true
    }

    set autoSave(value){
        if(value){
            exitEvents.forEach((event) => {
                process.on(event,this.#boundSave);
            }) // save the files if user closes the window / exception occurs
            this.#autoSaveVal = true
        }else{
            exitEvents.forEach((event) => {
                process.removeListener(event,this.#boundSave);
            }) // remove the added listeners upon setting the value to false
            this.#autoSaveVal = false
        }
    }
    get autoSave(){
        return this.#autoSaveVal
    }
    save(exit){
        if(this.sentenceData.length>0) fs.writeFileSync(path.join(__dirname,this.sentenceDataFile),this.sentenceData.join('\n'))
        if(Object.keys(this.wordData).length>0) fs.writeFileSync(path.join(__dirname,this.wordDataFile),JSON.stringify(this.wordData))
        if(exit) process.exit(0)
    }
    static clean(str){ //keep only a-z, 0-9 and spaces
        return str.toString().toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/ {2,}/g, ' ').trim()
    }
}
module.exports = Chatbot
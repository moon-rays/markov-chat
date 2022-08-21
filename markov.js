function quickMarkov(sentences){
    if(sentences.length === 0) return null
    const startwords = []
    const chain = {}
    for(x=0;x<sentences.length;x++){
        const words = sentences[x].split(' ')
        startwords.push(words[0])
        for(y=0;y<words.length-1;y++){
            (chain[words[y]] ??= []).push(words[y+1])
        }
        (chain[words[words.length-1]] ??= []).push(false)
    }
    function choice(options){
        return options[Math.floor(Math.random()*options.length)]
    }
    const result = []
    let current = choice(startwords)
    while(current !== false){
        result.push(current)
        current = choice(chain[current])
    }
    return result.join(' ')
}
module.exports = quickMarkov
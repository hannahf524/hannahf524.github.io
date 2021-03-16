define('util', [
    'jquery',
    'app.config'
], function ($, Config)
{
    var Util = {};

    Util.displayError = function (messageHead, messageBody)
    {
        Config.poem.html('<h3 class="text-danger">' + messageHead + '</h3>' + 
                         '<p>' + messageBody + '</p>');
    };

    Util.randomChoice = function (array)
    {
        return array[Math.floor(Math.random()*array.length)];
    };

    Util.stripWord = function (word)
    {
        return word.trim()
                   .replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()\s]/g, '')
                   .toLowerCase();
    };

    Util.getSyllableWord = function (word)
    {
        var wordData = Config.iphodCorpus[Util.stripWord(word)];
        
        if (wordData !== undefined)
        {
            return wordData.numSyllables;
        } 
        else if (Util.stripWord(word) === '')
        {
            return 0;
        }
        else 
        {
            return -1;
        }

    };

    Util.getSyllableTuple = function (tuple)
    {
        var count = 0,
            wordData,
            i;

        for (i = 0; i < tuple.length; i++)
        {
            wordData = Config.iphodCorpus[Util.stripWord(tuple[i])];
            if (wordData !== undefined)
            {
                count += wordData.numSyllables;
            } 
            else if (Util.stripWord(tuple[i]) !== '')
            {
                return -1;
            }
        }

        return count;
    };

    Util.addWhitespace = function (context, string, frequency)
    {
        var i;

        for (i = 0; i < frequency; i++)
        {
            context.WHITESPACE.push(string);
        }
    };

    Util.setUpWhitespace = function (context)
    {
        context.WHITESPACE = [];

        switch (context.enjambmentLevel)
        {
            case 'most':
            {
                Util.addWhitespace(context, '&#160;', 50);
                Util.addWhitespace(context, '&#160;&#160;', 25);
                Util.addWhitespace(context, '&#160;&#160;&#160;&#160;&#160;', 
                                   25);
                Util.addWhitespace(context, '<br>', 20);
                Util.addWhitespace(context, '<br><br>', 20);
                Util.addWhitespace(context, '<br>&#160;', 20);
                Util.addWhitespace(context, '<br>&#160;&#160;', 20);
                Util.addWhitespace(context, '<br>&#160;&#160;&#160;&#160;', 20);
                break;
            }

            case 'medium':
            {
                Util.addWhitespace(context, '&#160;', 100);
                Util.addWhitespace(context, '&#160;&#160;', 25);
                Util.addWhitespace(context, '<br>', 25);
                Util.addWhitespace(context, '<br>&#160;', 25);
                Util.addWhitespace(context, '<br>&#160;&#160;', 25);
                break;
            }

            default:
            {
                Util.addWhitespace(context, '&#160;', 175);
                Util.addWhitespace(context, '<br>', 25);
                break;
            }
        }

    };

    Util.getTuple = function (context, index)
    {
        var tuple = [],
            i;

        for (i = 0; i < context.chainLevel; i++)
        {
            tuple.push(context.words[index + i]);
        }

        return tuple;
    };

    Util.makeNextTuple = function (context)
    {
        return context.currentTuple
                .slice(1, context.chainLevel)
                .concat(Util.randomChoice(
                        context.model[context.currentTuple].nextWords));
    };

    Util.makeAllNextTuples = function (context)
    {
        var tuples = [],
            nextWords,
            i, j;

        if (context.model[context.currentTuple] === undefined) 
        {
            return tuples;
        }

        nextWords = context.model[context.currentTuple].nextWords;

        for (i in nextWords)
        {
            var potentialWord = nextWords[i],
                numSyllables = Util.getSyllableWord(potentialWord);

            if (numSyllables > context.syllablesLeft || numSyllables === -1)
            {
                continue;
            }

            tuples.push(context.currentTuple.slice(1, context.chainLevel)
                                    .concat(potentialWord));
        }

        return tuples;
    };

    Util.completeLine = function (context)
    {
        var nextTuple,
            nextWord,
            allNextTuples;

        while (context.syllablesLeft > 0)
        {
            allNextTuples = Util.makeAllNextTuples(context);

            if (allNextTuples.length === 0)
            {
                return -1;
            }
            else 
            {
                nextTuple = Util.randomChoice(allNextTuples);
                nextWord = nextTuple[context.chainLevel - 1];
                context.poem += ' ' + nextWord;
                context.syllablesLeft -= Util.getSyllableWord(nextWord);

                context.currentTuple = nextTuple;
            }
        }

        context.poem += '<br>';

        return 0;
    };


    return Util;

});
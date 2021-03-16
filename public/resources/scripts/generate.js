define('generate', [
    'app.config',
    'util'
], function (Config, Util) {

    'use strict';

    var Generate = {},
        DEBUG = false,
        NUM_ATTEMPTS = 50,
        NOT_ENOUGH_WORDS_H = 
            'There\'s not enough words for Markomposition to make poetry!',
        NOT_ENOUGH_WORDS_B =
            'You need at least 2-4 words, depending on the fusion level, but ' +
            'the more words the better!',
        CANNOT_GENERATE_POEM_H = 
            'Whoops! Markomposition couldn\'t generate a poem using the ' +
            'given text and poem parameters. ',
        CANNOT_GENERATE_POEM_B = 
            '<p>You might try adding more text ' +
            'as this gives the generator more choices to work with. </p>' + 
            'Also, be sure that your text has a variety of words with ' + 
            'different word lengths and ending sounds if you are using a' + 
            'poetic form that is defined by rhyme scheme or syllables! </p> ' +
            '<p>You can also try increasing the fusion level or trying a ' +
            'different poetic form. </p>' +
            '<p>Additionally, Markomposition cannot create poems based on  ' +
            'syllable or rhyme if it does not recognize the word. Currently, ' +
            'only words in the <a href="http://www.iphod.com/">Irvine ' + 
            'Phototactic Online Dictionary</a> are recognized.</p>';

    Generate.generate = function () 
    {
        $('#feedbackPoem').show();

        var context = {},
            text = Config.textInput.val(),
            poem,
            i;

        text.replace('\n', '<br>');
        text.replace('\t', '&#160;&#160;&#160;&#160;');

        context.words = text.split(/\s+/);

        context.chainLevel = parseInt($('input[name="chainInput"]:checked')
                                      .val());

        if (context.words.length <= context.chainLevel)
        {
            Util.displayError(NOT_ENOUGH_WORDS_H, NOT_ENOUGH_WORDS_B);
            $('#feedbackPoem').hide();
            return;
        }

        if ($('#freeVerseTab').hasClass('active'))
        {
            Generate.freeVerse(context);
        }
        else if ($('#haikuTab').hasClass('active'))
        {
            poem = '';

            var numHaikuRequested = parseInt($('#numHaikuInput').val());

            for (i = 0; i < numHaikuRequested; i++)
            {
                context.meterScheme = [5, 7, 5];
                
                if (Generate.meter(context) === 0)
                {
                    poem += context.poem + '<br>';
                }
            }

            if (poem === '')
            {
                Util.displayError(CANNOT_GENERATE_POEM_H, 
                                      CANNOT_GENERATE_POEM_B); 
            }
            else
            {
                Config.poem.html(poem);
            }

        }
        else if ($('#tankaTab').hasClass('active'))
        {
            poem = '';

            var numTankaRequested = parseInt($('#numTankaInput').val());

            for (i = 0; i < numTankaRequested; i++)
            {
                context.meterScheme = [5, 7, 5, 7, 7];
                
                if (Generate.meter(context) === 0)
                {
                    poem += context.poem + '<br>';
                }
            }

            if (poem === '')
            {
                Util.displayError(CANNOT_GENERATE_POEM_H, 
                                      CANNOT_GENERATE_POEM_B); 
            }
            else
            {
                Config.poem.html(poem);
            }

        }
        else if ($('#sonnetTab').hasClass('active'))
        {
            context.meterScheme = [];

            for (i = 0; i < 10; i++)
            {
                context.meterScheme.push(10);
            }
            
            if (Generate.meter(context) === 0)
            {
                Config.poem.html(context.poem);
            }
            else
            {
                Util.displayError(CANNOT_GENERATE_POEM_H, 
                                      CANNOT_GENERATE_POEM_B); 
            }
        }

        $('#feedbackPoem').hide();

    };

    Generate.freeVerse = function (context) {

        var allTuples = [],
            i;

        context.numWords = parseInt(Config.numWordsInput.val());
        context.enjambmentLevel = $('input[name="enjambmentInput"]:checked')
                                    .val();

        Util.setUpWhitespace(context);

        if (DEBUG) 
        { 
            console.log('Words: ', context.words);
            console.log('Chain Length: ', context.chainLevel);
            console.log('numWords: ', context.numWords);
        }

        context.model = {};

        /* Build the Markov model. */
        for (i = 0; i < context.words.length - context.chainLevel; i++)
        {
            var tuple = Util.getTuple(context, i);

            if (context.model[tuple] === undefined)
            {
                context.model[tuple] = {tuple: tuple, 
                                nextWords:[]};
            }

            context.model[tuple].nextWords
                .push(context.words[i + context.chainLevel]);
        }

        if (DEBUG) 
        {
            console.log('Model: ', context.model);
        }

        /* Build the poem from the model. */

        for (var t in context.model)
        {
            if (context.model.hasOwnProperty(t) && 
                context.model[t].tuple !== undefined)
            {
                allTuples.push(context.model[t].tuple);
            }
        }

        if (DEBUG)
        {
            console.log('allTuples: ', allTuples);   
        }

        context.currentTuple = Util.randomChoice(allTuples);
        
        context.poem = context.currentTuple[0];

        if (DEBUG)
        {
            console.log(context.currentTuple);
        }

        for (i = 1; i < context.currentTuple.length; i++)
        {
            context.poem += Util.randomChoice(context.WHITESPACE) + 
                            context.currentTuple[i];
        }

        if (DEBUG) 
        {
            console.log('Poem (begin): ', context.poem);   
        }

        for (i = 0; i < context.numWords - context.chainLevel; i++)
        {
            if (context.model[context.currentTuple] === undefined)
            {
                break;
            }

            var nextTuple = Util.makeNextTuple(context);
            context.poem += Util.randomChoice(context.WHITESPACE) + 
                            nextTuple[context.chainLevel - 1];
            context.currentTuple = nextTuple;
        }

        if (DEBUG) 
        {
            console.log('Poem: ', context.poem);
        }

        Config.poem.html(context.poem);

    };

    Generate.meter = function (context)
    {
        var attempt, 
            line, 
            numSyllables, 
            i;

        context.MAX_SYLLABLES = Math.max.apply(Math, context.meterScheme);

        if (DEBUG) 
        { 
            console.log('Words: ', context.words);
            console.log('Chain Length: ', context.chainLevel);
        }

        /* Build the Markov model. */
        if (context.model === undefined)
        {
            context.model = {};
        
            for (i = 0; i < context.words.length - context.chainLevel; i++)
            {
                var tuple = Util.getTuple(context, i);

                if (context.model[tuple] === undefined)
                {
                    context.model[tuple] = {tuple: tuple, 
                                            nextWords:[]};
                }

                var nextWord = context.words[i + context.chainLevel],
                    syllables = Util.getSyllableWord(nextWord);

                if (syllables >= 0) {
                    context.model[tuple].nextWords.push(nextWord);   
                }
            }

            if (DEBUG) 
            {
                console.log('Model: ', context.model);
            }

            context.allTuples = [];

            for (var t in context.model)
            {
                if (context.model.hasOwnProperty(t) && 
                    context.model[t].tuple !== undefined)
                {
                    context.allTuples.push(context.model[t].tuple);
                }
            }
        }

        /* Build the poem from the model. */

        if (DEBUG)
        {
            console.log('allTuples: ', context.allTuples);   
        }

        attemptLoop:
        for (attempt = 0; attempt < NUM_ATTEMPTS; attempt++)
        {
            if (DEBUG)
            {
                console.debug('attempt: ' + attempt);
            }

            /* Choose first tuple randomly from all available tuples. */
            context.currentTuple = Util.randomChoice(context.allTuples); 
            numSyllables = Util.getSyllableTuple(context.currentTuple);

            if (numSyllables > context.meterScheme[0])
            {
                if (DEBUG)
                {
                    console.debug('first tuple too long');   
                }
                continue;
            }

            context.syllablesLeft = context.meterScheme[0] - numSyllables;
            context.poem = context.currentTuple.join(' ');

            /* Complete each line with its meter scheme. */
            for (line = 0; line < context.meterScheme.length; line++)
            {

                if (Util.completeLine(context) === -1)
                {
                    if (DEBUG)
                    {
                        console.debug('no options on line ' + line);
                    }
                    continue attemptLoop;
                }

                if (line < context.meterScheme.length - 1)
                {
                    context.syllablesLeft = context.meterScheme[line + 1];
                }

            }

            return 0;
        }

        return -1;
    };

    return Generate.generate;

});
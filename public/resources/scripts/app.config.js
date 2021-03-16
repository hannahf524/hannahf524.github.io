define('app.config', [
    'jquery'
], function ($) {

    'use strict';

    return {

        submitBtn:          $('#submitBtn'),
        textInput:          $('#textInput'),
        numWordsInput:      $('#numWordsInput'),
        poem:               $('#poem'),

        iphodCorpus:        {}
    	
    };

});
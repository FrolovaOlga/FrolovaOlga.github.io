if(!Array.prototype.filter){

    Array.prototype.filter= function(fun, scope){
        var T= this, A= [], i= 0, itm, L= T.length;
        if(typeof fun=== 'function'){
            while(i<L){
                if(i in T){
                    itm= T[i];
                    if(fun.call(scope, itm, i, T)) A[A.length]= itm;
                }
                ++i;
            }
        }
        return A;
    };
}

if(!Array.prototype.diff){
    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return !(a.indexOf(i) > -1);});
    };
}

if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}

if (!Array.prototype.unique){
    Array.prototype.unique=function(a) {
        return this.filter(function(itm,i,a) {
            return i===a.indexOf(itm);
        });
    };
}

if (!Array.prototype.remove) {
    Array.prototype.remove = function(from, to) {
      var rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
    };
}

var cleartext = function(text) {
    return text
            .replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()\"\'…©▼•—–\\\[\]<>»×?\|0-9¿˘¯˜ı◊˛¸`»ˆ¨ˇ‰´⁄€‹›‡°·‚—~±√∞»”’„†“\@♦\+«®]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^\s+|\s+$/g, '');
};

var numwords = function(text) {
    return cleartext(text).split(' ').length;
};

// sort the uniques array in descending order by frequency
function compareFrequency(a, b) {
    return b[1] - a[1];
}

var freqwords = function(words, minfreq, onlyval) {
    var frequency = {}, value;
    if (!minfreq) minfreq = 1;

    // compute frequencies of each value
    for(var i = 0; i < words.length; i++) {
        value = words[i];
        if(value in frequency) {
            frequency[value]++;
        }
        else {
            frequency[value] = 1;
        }
    }

    if (onlyval) {
        var uniques = [];
        for(value in frequency) {
            if (frequency[value] >= minfreq)
                uniques.push(value);
        }

        // sort the uniques array in descending order by frequency
        function compareFrequency(a, b) {
            return frequency[b] - frequency[a];
        }
    } else {

        // make array from the frequency object to de-duplicate
        var uniques = [];
        for(value in frequency) {
            if (frequency[value] >= minfreq)
                uniques.push([value, frequency[value]]);
        }
    }
    

    return uniques.sort(compareFrequency);
};

function fill_multi_matrix(words, n) {
    var result = [];
    
    if (n > words.length) 
        return result;
    
    for (var i = 0; i < words.length-n+1; i++) {
        var m_word = [];
        for (var j=0; j < n; j++) {
            m_word[j] = words[i+j];
        }
        result[i] = m_word.join(' ');
    }

    result = $.grep(result, function(el, ind){
        if (el.split(' ').diff(stopwords).length === 0)
            return false;

        return true;
    });

    return result;
}

$(document).ready(function() {

    $('input#analyze').click(function(){
        var source = $('textarea#text').val(),
            stat = {};
        
        stat.length = source.length;
        stat.length_clear = source.replace(/[\s\t]/g, '').length;
        
        var inline = source.split(/[\r\n]+/).join('. ').toLowerCase();
        var clear = cleartext(inline);
        var words = clear.split(' ');
        
        stat.words = words.length;
        stat.words_uniq = words.unique().length;
        var words_clear = words.diff(stopwords);
        stat.words_stopwords = $(words).filter(stopwords).length;
        
        if (stat.words) {
            stat.words_water = Math.round(stat.words_stopwords/stat.words*1000)/10;
        } else {
            stat.words_water = 0;
        }
        
        var word_len_avg = 0;
        $.each(words, function(){
            word_len_avg += this.length;
        });
    
        if (stat.words) {
            word_len_avg /= stat.words;
        } else {
            word_len_avg = 0;
        }
    
        stat.word_len = Math.round(word_len_avg*10)/10;
        
        var sentences = inline.split(/[\.\?\!][\s\t]/);
        stat.sentences = sentences.length;
        
        var min = numwords(sentences[0]),
            max = numwords(sentences[0]),
            avg = 0;
        $.each(sentences, function(){
            var wc = numwords(this);
            if (wc < min)
                min = wc;
            if (wc > max)
                max = wc;
            avg += wc;
        });
    
        if (stat.sentences) {
            avg /= stat.sentences;
        } else {
            avg = 0;
        }
        
        stat.sentence_min = min;
        stat.sentence_max = max;
        stat.sentence_avg = Math.round(10*avg)/10;
        
        stat.commas = inline.length - inline.replace(/,/g, '').length;
        stat.commas_avg = stat.sentences ? Math.round(10*stat.commas/stat.sentences)/10 : 0;
        
        // вычисление последовательностей
        /*
        var two_words = [], three_words = [];
        
        for (i = 0; i < words.length-1; i++) {
            two_words[i] = [words[i], words[i+1]].join(' ');
            
            if (i < words.length-2)
                three_words[i] = [words[i], words[i+1], words[i+2]].join(' ');
        }
        */
       var multi_words_matrix = [], multi_words, multi_words_dic = [];
       
       var mx_max = 6;
       for(var n_mx = mx_max; n_mx > 1; n_mx--) {
            multi_words = fill_multi_matrix(words, n_mx);
            
            var freq = freqwords(multi_words, 2);
//            console.log(freq); exit;
            
            if (n_mx !== mx_max) {
                freq = $.grep(freq, function(el, ind){
                    for(var i = 0; i < multi_words_dic.length; i++) {
                        if (multi_words_dic[i][0].indexOf(el[0]) !== -1) {
                            return (multi_words_dic[i][1] < el[1]);
                        }
                    }

                    return true;
                });

            }
        
            multi_words_dic = $.merge(multi_words_dic, freq);
       }
   
       multi_words_dic = multi_words_dic.sort(compareFrequency);
       
//    two_words = ['после того', 'создание сайтов', 'того как', 'того как', 'после того'];
//    three_words = ['после того как', 'после того как'];
//    
    
                
        // заполнение частотного словаря
        var freq = freqwords(words_clear, 2),
            freq = freq.sort(compareFrequency);
            cont = '';
    
        for(var i = 0; i < Math.min(20, freq.length); i++) {
            cont += '<tr><th><span>'+ freq[i][0] +'</span></th><td><span>'+ freq[i][1] +'</span></td></tr>';
        }
    
        $('table#wordfreq tbody').html(cont);

        /*
        var freq_two_words = freqwords(two_words, 2);
        var freq_three_words = freqwords(three_words, 2);
        
        // удаление двойных последовательностей, которые есть в тройных
        freq_two_words = $.grep(freq_two_words, function(el, ind){
            
            if (el[0].split(' ').diff(stopwords).length === 0)
                return false;
            
            for(var i = 0; i < freq_three_words.length; i++) {
                if (freq_three_words[i][0].indexOf(el[0]) !== -1)
                    return false;
            }
        
            return true;
        });
    
        freq_three_words = $.grep(freq_three_words, function(el, ind){
            if (el[0].split(' ').diff(stopwords).length === 0)
                return false;
            
            return true;
        });


        // заполнение таблицы частых связок
        var freq = freq_two_words.concat(freq_three_words),
            cont = '';
        */

        var freq = multi_words_dic;
            cont = '';
    
        for(var i = 0; i < Math.min(20, freq.length); i++) {
            cont += '<tr><th><span>'+ freq[i][0] +'</span></th><td><span>'+ freq[i][1] +'</span></td></tr>';
        }
    
        $('table#seqfreq tbody').html(cont);
        
        for (i in stat) {
            $('span#' + i).html(stat[i]);
        }
    
        $('html, body').animate({
            scrollTop: $("#results").offset().top
        }, 500);
    
        ga('send', 'event', 'button', 'click', 'analyze', stat.words);
    });




});


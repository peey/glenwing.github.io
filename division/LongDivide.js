function LongDivide(A, B, options) {
    //console.log('BEGIN:', A, '÷', B)
    if (A == '' || B == '') { return ''; }
    if ( Number.isNaN(parseFloat(A)) || Number.isNaN(parseFloat(B)) || !Number.isFinite(parseFloat(A)) || !Number.isFinite(parseFloat(B)) || !Number.isFinite(parseFloat(A)/parseFloat(B)) || Number.isNaN(parseFloat(A)/parseFloat(B)) ) { console.log('Error in function LongDivide(): One or both inputs is NaN or Infinity. Function aborted.'); return 'Error'; }

    A = new Decimal(A);
    B = new Decimal(B);

    if (typeof(options) === 'number') { // If 3rd argument is a number rather than a dictionary, use it as the P_Max value
        var P_Max = options;
    }
    else {
        if (typeof(options) === 'string') { options = LongDivide.parseFormatString(options); }
        else if ('format' in options) { options = LongDivide.parseFormatString(options); }

        // Overline markup opening tag
        var OL_open =            options['OL_open'] !== undefined ? options['OL_open'] :
            '<span style="text-decoration:overline;">'; // Default value

        // Overline markup closing tag. Used in conjunction with OL_open to surround the repeating numbers. May be set to control markup, separate it with parentheses, or simply left blank, etc.
        var OL_close =           options['OL_close'] !== undefined ? options['OL_close'] :
            '</span>';
        
        // Maximum number of decimal places; option 'p' (for setting both min and max precision together) takes priority if set
        var P_Max =              options['p'] !== undefined ? options['p'] : options['p_max'] !== undefined ? options['p_max'] : options['pmax'] !== undefined ? options['pmax'] :
            8;

        // Minimum number of decimal places; option 'p' (for setting both min and max precision together) takes priority if set
        var P_Min =              options['p'] !== undefined ? options['p'] : options['p_min'] !== undefined ? options['p_min'] : options['pmin'] !== undefined ? options['pmin'] :
            0;

        // Minimum number of digits in the integer part of the number. Leading zeros are added if necessary.
        var Leading_Digits =     options['leading'] !== undefined ? options['leading'] :
            1;

        // Character to use for the radix point (decimal point)
        var Decimal_Point_Char = options['decimal'] !== undefined ? options['decimal'] :
            '.';

        // Characters used for grouping thousands (i.e. 10000 -> 10,000)
        var Thousands_Char =     options['thousands'] !== undefined ? options['thousands'] :
            '';

        // Character used for grouping thousandths (i.e. 1.0000000001 -> 1.000 000 000 1)
        var Thousandths_Char =   options['thousandths'] !== undefined ? options['thousandths'] :
            '';

        // Number base system to use
        var Base =               options['base'] !== undefined ? options['base'] :
            10;

        // Character to preceed negative numbers
        var Minus_Char =         options['minus'] !== undefined ? options['minus'] :
            '\u2212';

        // Character to preceed positive numbers; blank string by default
        var Plus_Char =          options['plus'] !== undefined ? options['plus'] :
            '';

        // Symbol to be used for "approximately equal to". Can be set to '~' or blank if desired, etc.
        var Approx_Char =        options['approx'] !== undefined ? options['approx'] : options['~'] !== undefined ? options['~'] :
            '\u2248';

        // Currency symbol to be inserted between the sign and number. Leave blank to have no currency.
        var Currency_Char =      options['currency'] !== undefined ? options['currency'] :
            '';

        // Flag indicating whether SI prefixes are desired or not
        var SI =                 options['si'] !== undefined ? options['si'] : options['SI'] !== undefined ? options['SI'] :
            false;

        // Flag indicating whether single-digit repeating patterns should be doubled; i.e. display as 1.(33) instead of 1.(3)
        var RepeatSinglesFlag =  options['2_singles'] !== undefined ? options['2_singles'] :
            true;

        // Flag indicating whether repeating decimal detection should be enabled or not
        var RepeatEnableFlag =   options['repeat'] !== undefined ? options['repeat'] :
            true;

        // If OL open and closing tags are blanked, assume the user means to disable repeating decimal detection
        if (OL_open == '' && OL_close == '') { RepeatEnableFlag = false; options['repeat'] = false; }
    }

    if (Decimal_Point_Char === Thousands_Char) { console.log('Error in function LongDivide(): Decimal point character and thousands grouping character cannot be the same.\ndecimal_point_char:' + Decimal_Point_Char + '\nthousands_char:' + Thousands_Char); return 'Error'; }
    if (Decimal_Point_Char === Thousandths_Char) { console.log('Error in function LongDivide(): Decimal point character and thousandths grouping character cannot be the same.\ndecimal_point_char:' + Decimal_Point_Char + '\nthousandths_char:' + Thousandths_Char); return 'Error'; }
    if (Decimal_Point_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Decimal point character cannot be a number.\nDecimal_Point_Char:', Decimal_Point_Char); return 'Error'; }
    if (Thousands_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Thousands grouping character cannot be a number.\nThousands_Char:', Thousands_Char); return 'Error'; }
    if (Thousandths_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Thousandths grouping character cannot be a number.\nThousandths_Char:', Thousandths_Char); return 'Error'; }
    if (Minus_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Minus sign character cannot be a number.\nMinus_Char:', Minus_Char); return 'Error'; }
    if (Plus_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Plus sign character cannot be a number.\nPlus_Char:', Plus_Char); return 'Error'; }
    if (Approx_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Approximation sign character cannot be a number.\nApprox_Char:', Approx_Char); return 'Error'; }
    if (Currency_Char.match(/[0-9]/g)) { console.log('Error in function LongDivide(): Currency symbol cannot be a number.\nCurrency_Char:', Currency_Char); return 'Error'; }

    //console.log('options:', options);

    // Variables containing characters to be added when the final result is constructed
    var SI_Prefix = '';
    var Sign = Plus_Char;
    var Approx = '';

    // Integerize variables for safety
    P_Max = Math.round(P_Max);
    P_Min = Math.round(P_Min);
    Base = Math.round(Base);
    // Validity checks for precision and base
    if (P_Max < 0 || P_Min < 0 || P_Max < P_Min || isNaN(P_Max) || isNaN(P_Min) || !isFinite(P_Max) || !isFinite(P_Min)) {
        console.log('Error in function LongDivide(): Invalid P_Max and P_Min values. Both values must be non-negative numbers, and P_Min cannot be greater than P_Max.\nP_Max:', P_Max, 'P_Min', P_Min)
        return 'Error';
    }
    if (isNaN(Base)) {
        console.log('Error in function LongDivide(): Invalid Base value. Must be an integer number.\nBase:', Base);
        return 'Error';
    }

    // Adjust numerator for metric prefixes
    if (SI == true) {
        var Power = 0;
        var watchdog = 0;
        while (Power < 24 && Power > -24 && watchdog < 10) {
            //console.log('A/B: ' + A.div(B) + '\nPower: ' + Power);
            if (A.div(B).abs() >= 1000) {
                A = A.div(1000); Power += 3;
            }
            else if (Math.abs(A.div(B)) < 1) {
                A = A.times(1000); Power -= 3;
            }
            else {
                break;
            }
            watchdog += 1;
            if (watchdog == 10) {
                console.log('Warning in function LongDivide(): Runaway loop in the SI prefix section has hit the watchdog threshold (10 loop cycles) and was aborted. Check your code!\n', 'A:', A, 'B:', B, 'Power:', Power);
            }
        }
        var SI_Prefix_Table = {
            '24':  'Y',
            '21':  'Z',
            '18':  'E',
            '15':  'P',
            '12':  'T',
            '9':   'G',
            '6':   'M',
            '3':   'k',
            '0':   '',
            '-3':  'm',
            '-6':  '&mu;',
            '-9':  'n',
            '-12': 'p',
            '-15': 'f',
            '-18': 'a',
            '-21': 'z',
            '-24': 'y',
        }
        SI_Prefix = (Power == 0 ? '' : '&nbsp;' + SI_Prefix_Table[Power]); // Ternary check avoids prefix being set to just "&nbsp;" when the power is 0 (no prefix required)
    }

    // If precision is set to 0, then the standard division operator can be used to obtain the result.
    if (P_Max == 0) { //console.log('P_Max is zero. Performing standard division operation. Preliminary Result:\n' + Result.toString() + '\n' + typeof(Result));
        if (A.div(B).round().isZero()) { Sign = ''; }
        if (A.div(B).round().isNegative()) { Sign = Minus_Char; } // If the number is negative, attach the Minus sign character set in options
        else { Sign = Plus_Char; } // Otherwise, attach the Plus sign character set in options (blank string by default)
        var Result = Sign.concat(A.div(B).round().abs().toString());
        // Result is now a string
        if (!(A.div(B).equals(A.div(B).round()))) { Result = Approx_Char.concat(Result); } // If input numbers are not evenly divisible, attach the approximation sign set in options
        return Result.concat(SI_Prefix);
    }

    // Handle floating point numbers by multiplying them by 10 until they are integers        
    A = A.toString();
    B = B.toString();
    if (A.indexOf('.') != -1 || B.indexOf('.') != -1) {
        if (A.indexOf('.') == -1) { A = A + '.'; }
        if (B.indexOf('.') == -1) { B = B + '.'; }
        Multiplier = Math.max(A.length - A.indexOf('.') - 1, B.length - B.indexOf('.') - 1); // Find the power of 10 to multiply by to ensure both numbers are ints
        if (Multiplier - (A.length - A.indexOf('.') - 1) > 0) A = A + '0'.repeat(Multiplier - (A.length - A.indexOf('.') - 1)); // Pad the necessary number of zeros onto the number with fewer decimal places
        if (Multiplier - (B.length - B.indexOf('.') - 1) > 0) B = B + '0'.repeat(Multiplier - (B.length - B.indexOf('.') - 1));
        A = A.slice(0, A.indexOf('.')) + A.slice(A.indexOf('.') + 1, A.length); // Remove the decimal point from each number
        B = B.slice(0, B.indexOf('.')) + B.slice(B.indexOf('.') + 1, B.length);
        console.log('Warning in function LongDivide(): Float inputs detected. Results multiplied by 10^' + Multiplier + '.', 'A =', A, 'B =', B);
    }
    // End floating point section

    A = new Decimal(A);
    B = new Decimal(B);

    // Determine if answer will be negative, set Sign to the appropriate sign, then take the absolute value for the rest of the calculations.
    if ((A.lessThan(0)) ? !(B.lessThan(0)) : (B.lessThan(0))) { Sign = Minus_Char; } // If (A is negative) XOR (B is negative) then final result will be negative.
    else { Sign = Plus_Char; } // Plus_Char is a blank string by default, but can be set to '+' to force sign for positive numbers
    A = A.abs();
    B = B.abs();


    /********  Long Division Algorithm  ********/

    
    var Dividend = A;
    var Divisor  = B;
    var Quotient;
    var Remainder;
    var Integer;

    var Decimal_Digits = '';
    var Previous_Dividends = {};
    var Prefix = '';
    var Repetend = '';
    var RepeatFlag = false;
    var ApproxFlag = true;

    Quotient  = Dividend.dividedBy(Divisor).floor();
    Remainder = Dividend.modulo(Divisor);
    Dividend = Remainder.times(Base);

    // The initial Quotient floor division above determines the front part of the number immediately
    Integer = Quotient.toString();

    //console.log('Quotient:', Quotient.toNumber(), 'Remainder:', Remainder.toNumber(), 'Dividend:', Dividend.toNumber(), 'Decimal_Digits:', Decimal_Digits, 'Previous Dividends:', Previous_Dividends);

    var i = 0;
    // Compute terms up to the specified precision (P_Max) + 2. Going 1 decimal beyond P_Max is required to facilitate rounding, but 2 beyond P_Max is...
    // ...required for correct detection of exact division results (such as 1/8 = 0.125 exactly). 2 extra decimal places are necessary so that...
    // ...the algorithm can identify the implicit repeating 0 pattern that follows the last digit, which characterizes an exact result.
    while (i < P_Max + 2) {
        // When you encounter a dividend that you have already seen, it indicates an infinitely repeating pattern
        if (!(Dividend.toNumber() in Previous_Dividends)) {
            // Stores the position (relative to the decimal point) of where each dividend was encountered. This is used for determining which digits are part of the prefix and which are part of the repetend
            Previous_Dividends[Dividend.toNumber()] = i;

            Quotient  = Dividend.dividedBy(Divisor).floor();
            Remainder = Dividend.modulo(Divisor);
            Dividend  = Remainder.times(Base);

            Decimal_Digits += Quotient.toString();

            //console.log('i:', i, 'Quotient:', Quotient.toNumber(), 'Remainder:', Remainder.toNumber(), 'Dividend:', Dividend.toNumber(), 'Result:', Result, 'Decimal_Digits:', Decimal_Digits);
        }
        else {
            RepeatFlag = true;
            Approx = '';

            //console.log('Repeating Pattern Detected');
            Prefix = Decimal_Digits.substring(0, Previous_Dividends[Dividend]);
            Repetend = Decimal_Digits.substring(Previous_Dividends[Dividend], Decimal_Digits.length); //console.log('Prefix:', Prefix, '; Repetend:', Repetend);

            // A "repeating" pattern of 0s signals a non-repeating result
            if (Repetend == '0') { //console.log('Removing Repetend of 0...');
                Repetend = '';
                RepeatFlag = false;
                Decimal_Digits = Prefix;
            }
            if (Decimal_Digits.length > P_Max) { //console.log('Repetend is longer than P_Max; reverting to standard rounded result.');
                Repetend = '';
                RepeatFlag = false;
            }
            if (RepeatFlag == true && RepeatEnableFlag == false) {
                var watchdog = 0;
                while (Decimal_Digits.length <= P_Max) {
                    Decimal_Digits = Decimal_Digits.concat(Repetend);
                    watchdog += 1;
                    if (watchdog > 1000) { console.log('Warning in function LongDivide(): Runaway loop has hit the watchdog threshold in the RepeatEnableFlag section (1 thousand loop cycles) and was aborted. Check your code!\nDecimal_Digits.length:', Decimal_Digits.length, 'Repetend:', Repetend, 'P_Max:', P_Max); break; }
                }
                Repetend = '';
                RepeatFlag = false;
            }

            break;
        }
        i += 1;
    }

    // Handles rounding and padding (P_Max and P_Min options) for standard non-repeating results
    if (RepeatFlag == false) {
        // Rounds result when Decimal_Digits is longer than P_Max (to obey the maximum precision specified in the options)
        if (Decimal_Digits.length > P_Max) { //console.log('Rounding decimals.'); //console.log('Decimal_Digits:', Decimal_Digits.toNumber(), 'Decimal_Digits.toString().length:', Decimal_Digits.toString().length);
            Decimal_Digits = Decimal_Digits.slice(0, P_Max).concat('.').concat(Decimal_Digits.slice(P_Max)); // console.log('Decimal_Digits 1:', Decimal_Digits); // console.log('Decimal_Digits.slice(0, Decimal_Digits.indexOf(\'.\')):', Decimal_Digits.slice(0, Decimal_Digits.indexOf('.')));
            Decimal_Digits = '0'.repeat(P_Max - parseFloat(Decimal_Digits).toFixed(0).toString().length).concat((new Decimal(Decimal_Digits)).round().toFixed(0).toString())
            // An approximation sign is added when the result is rounded, to indicate a non-exact result
            Approx = Approx_Char;
        }
        // Adds trailing zeros if Decimal_Digits is shorter than P_Min (to obey the minimum precision specified in the options)
        if (Decimal_Digits.length < P_Min) { //console.log('Decimal_Digits.length: ' + Decimal_Digits.length + '; P_Min: ' + P_Min);
            if (P_Min - Decimal_Digits.length > 0) { //console.log('Padding end with zeroes. Decimal Digits:', Decimal_Digits.length, 'P_Min:', P_Min);
                // Adds trailing zeros if Decimal_Digits is shorter than P_Min (to obey the minimum precision specified in the options)
                Decimal_Digits += '0'.repeat(P_Min - Decimal_Digits.length);
            }
        }
    }

    // Handles rounding and padding (P_Max and P_Min options) for results with repeating decimals
    if (RepeatFlag == true) {
        if (Prefix.length + Repetend.length > P_Max) {
            if (Prefix.length > P_Max) {
                Prefix = new Decimal(Prefix.substr(0, P_Max) + '.' + Prefix.substr(P_Max));
                Prefix = Prefix.round().toString();
                if (P_Max - Prefix.length >= 0) {
                    // Leading zeros in the prefix are lost in string<->number conversions above. This adds them back in.
                    Prefix = '0'.repeat(P_Max - Prefix.length).concat(Prefix);
                }
            }
            else {
                Prefix = Prefix.concat(Repetend.substr(0, P_Max - Prefix.length));
            }
            Decimal_Digits = Prefix;
            RepeatFlag = false;
            Approx = Approx_Char;
        }
        if (Prefix.length + Repetend.length < P_Min) { //console.log('Decimal Count is lower than P_Min. Prefix length:', Prefix.length, 'Repetend length:', Repetend.length);
            if ((P_Min - (Prefix.length + Repetend.length)) >= Repetend.length) { //console.log('Multiplying repetend. Remaining space:', P_Min - (Prefix.length + Repetend.length), 'Repetend length:', Repetend.length, 'Multiply by:', Math.floor((P_Min - (Prefix.length + Repetend.length)) / Repetend.length));
                Repetend += Repetend.repeat(Math.floor((P_Min - (Prefix.length + Repetend.length)) / Repetend.length)); //console.log('New Repetend:', Repetend);
            }
            while (Prefix.length + Repetend.length < P_Min) {
                Prefix = Prefix.concat(Repetend[0]);
                Repetend = Repetend.slice(1).concat(Repetend[0]);
            }
        }
    }


    /********  Construction of final result  ********/

    var Result = Integer.concat('.');

    // Add or remove leading zeros as specified by the Leading_Digits option
    if((Result.length - 1) < Leading_Digits) { Result = '0'.repeat(Leading_Digits - Result.length + 1).concat(Result); }
    if(Result == '0.' && Leading_Digits == 0) { Result = '.'; }

    if (RepeatFlag == true) {
        // Single-digit repeating patterns are now doubled if selected in the options; i.e. 4/3 will result in 1.(33) rather than 1.(3)
        if (Repetend.length == 1 && (Prefix.length + Repetend.length < P_Max) && RepeatSinglesFlag == true) { Repetend = Repetend.repeat(2); }

        // Construct final number (for repeating results) and add digit grouping
        Result = LongDivide.GroupDigits(Result.concat(Prefix).concat(Repetend), Thousands_Char, Thousandths_Char, Decimal_Point_Char);

        // Adds overline tags; Some fancy footwork is needed here to skip over the thousandths separators
        Result = Result.slice(0, Result.indexOf(Decimal_Point_Char) + 1 + Prefix.length + (Thousandths_Char.length * Math.floor(Prefix.length / 3))) + OL_open + Result.slice(Result.indexOf(Decimal_Point_Char) + 1 + Prefix.length + (Thousandths_Char.length * Math.floor(Prefix.length / 3))) + OL_close;
        //Result += Prefix + OL_open + Repetend + OL_close;
    }
    else {
        // Construct final number (for non-repeating results) and add digit grouping
        Result = LongDivide.GroupDigits(Result + Decimal_Digits, Thousands_Char, Thousandths_Char, Decimal_Point_Char);
    }

    // Remove decimal point if there are no digits after it
    if (Result[Result.length - 1] == Decimal_Point_Char) { Result = Result.replace(Decimal_Point_Char, ''); }

    // Add currency symbol (will be a blank string if no currency symbol was set in the options)
    Result = Currency_Char.concat(Result);

    // Attach SI prefix (it's a blank string if N/A)
    Result = Result.concat(SI_Prefix);
    
    // Attach sign (set to negative sign earlier if answer is supposed to be negative, or plus sign if forced sign on positive numbers is desired)
    if (Sign == '()') { Result = '('.concat(Result).concat(')'); }
    else              { Result = Sign.concat(Result); }

    // Attach approximation sign (will be a blank string if no approximation flags were tripped)
    Result = Approx.concat(Result);

    return Result;

}




LongDivide.parseFormatString = function(options) {
    if (typeof(options) === string) { var string = options; options = {}; }
    else { var string = options['format']; }

    string = string.toLowerCase();

    // Check for invalid characters
    check = string.match(/[^-+!0.,si\[\]\(\) ]/g) || [];
    if (check.length > 1) {
        console.log('Error in LongDivide.parseFormatString(): Input contains invalid character(s): ', check);
        return options;
    }

    if (string.indexOf('.' == -1)) {
    // If string does not have a decimal point, add one at the end
        string = string.concat('.');
    }

    // Determine the minimum number of integer digits from the number of zeros in front of the decimal point
    options['leading'] = (string.slice(0, string.indexOf('.')).match(/0/g) || []).length;

    if (string.indexOf(',') != -1) { options['thousands'] = ','; }
    if (string.indexOf('!') != -1) { options['approx'] = ''; }
    if (string.indexOf('-') != -1) { options['minus'] = '\u2212'; }
    if (string.indexOf('+') != -1) { options['plus'] = '+'; }
    if (string.indexOf('si') != -1) { options['si'] = true; }

    options['p_max'] = (string.slice(string.indexOf('.')).match(/0/g) || []).length;
    options['p_min'] = options['p_max'];

    if (string.indexOf('[') != -1 || string.indexOf(']') != -1) {
        if (string.indexOf('[') == -1) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Closing bracket used without an open bracket'); return options; }
        if (string.indexOf(']') == -1) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Open bracket used without a closing bracket'); return options; }
        if (string.indexOf('[') < string.indexOf('.')) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Bracket appears in front of decimal point.'); return options; }
        if (string.indexOf('[') > string.indexOf(']')) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Open bracket (\'[\') appears after closing bracket (\']\')'); return options; }
        if ((string.match(/\[/g) || []).length > 1) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Multiple open brackets detected'); return options; }
        if ((string.match(/\]/g) || []).length > 1) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Multiple closing brackets detected'); return options; }
        if (string.lastIndexOf('0') > string.indexOf(']')) { console.log('Error in LongDivide.parseFormatString(): Invalid syntax: Zeros detected after closing bracket'); return options; }

        options['p_min'] = options['p_max'] - (string.slice(string.indexOf('[') + 1, string.indexOf(']')).match(/0/g) || []).length;
    }

    if (string.indexOf('(') != -1 && string.indexOf(')') != -1 && string.indexOf('(') < string.indexOf(')')) {
        options['minus'] = '()';
    }

    return options;
}


LongDivide.GroupDigits = function(number, thousands, thousandths, decimal) {
    // Modified from https://stackoverflow.com/a/2901298
    console.log('GroupDigits():\nnumber:', number, '\nthousands:', thousands, '\nthousandths', thousandths, '\ndecimal', decimal);
    var parts = number.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    parts[1] = parts[1].split('').reverse().join('').replace(/\B(?=(\d{3})+(?!\d))/g, thousandths.split('').reverse().join('')).split('').reverse().join('');
    console.log('LongDivide.GroupDigits(): ' + parts.join(decimal));
    return parts.join(decimal);
}
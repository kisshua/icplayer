function AddonGrid_Scene_create(){

    var presenter = function(){};

    presenter.playerController = null;
    presenter.eventBus = null;

    presenter.ERROR_CODES = {
        GS01: "Columns and rows must be a positive integer",
        GS02: "Delay have to be a positive integer",
        GS03: "Commands have to be a valid JSON string",
        GS04: "Error while getting file with commands. Check url.",
        WA01: "Point in answer must have two values",
        WA02: "Answer have non number value",
        CE01: "All commands must have name",
        CE02: "All commands must have code",
        CP01: "Custom Command must have command_arguments property",
        CP02: "Custom Command must have is_disabled property",
        CP03: "Custom Command must have command_code property",
        CP04: "Custom Command must have command_name property",
        CP05: "Custom Command must have valid JS name",
        CP06: "Custom Command arguments must have valid JS name",
        CP07: "Multiple Custom Command declared",
        AE01: "Multiple alias declaration in default commands",
        DA01: "Default Command alias must have valid JS name",
        DA02: "Default Command Arguments aliases must have valid JS names"
    };

    presenter.configuration = {
        isError : true,
        isVisible : true,
        isPreview: false,
        visibleByDefault : true,
        addonID : null,
        rows : null,
        columns : null,
        color : null,
        hasDelay: false,
        isErrorMode: false,
        isSavingAnswer: false,
        delay: 0,
        queLoopTimer: null,
        commandQueue: [],
        blockLabels: {},
        commandsLabels: {},
        excludedCommands: {},
        answerCode: "",
        isShowingAnswers: false
    };
    
    presenter.LABELS = {
        "command_clear": "clear",
        "command_mark": "mark",
        "command_drawLeft": "drawLeft",
        "command_drawRight": "drawRight",
        "command_drawUp": "drawUp",
        "command_drawDown": "drawDown",
        "command_drawLeftFrom": "drawLeftFrom",
        "command_drawRightFrom": "drawRightFrom",
        "command_drawUpFrom": "drawUpFrom",
        "command_drawDownFrom": "drawDownFrom",
        "command_setColor": "setColor",
        "command_setCursor": "setCursor",
        "command_clearMark": "clearMark",
        "block_mark": "mark",
        "block_x": "x",
        "block_y": "y",
        "block_clear": "clear",
        "block_steps": "steps",
        "block_drawLeft": "drawLeft",
        "block_drawRight": "drawRight",
        "block_drawUp": "drawUp",
        "block_drawDown": "drawDown",
        "block_drawLeftFrom": "drawLeftFrom",
        "block_drawRightFrom": "drawRightFrom",
        "block_drawUpFrom": "drawUpFrom",
        "block_drawDownFrom": "drawDownFrom",
        "block_setColor": "setColor",
        "block_setCurstor": "setCursor",
        "block_clearMark": "clearMark"
    };


    presenter.originalCommands = null;

    presenter.commandsArgs = {
        "command_clear": "",
        "command_mark": "x, y",
        "command_drawLeft": "steps",
        "command_drawRight": "steps",
        "command_drawUp": "steps",
        "command_drawDown": "steps",
        "command_drawLeftFrom": "x, y, steps",
        "command_drawRightFrom": "x, y, steps",
        "command_drawUpFrom": "x, y, steps",
        "command_drawDownFrom": "x, y, steps",
        "command_setColor": "color",
        "command_setCursor": "x, y",
        "command_clearMark": "x, y"
    };

    presenter.coloredGrid = [];
    presenter.actualCursorPosition = [1,1];

    function delayDecorator(func) {
        if (presenter.configuration.hasDelay) {
            return function () {
                presenter.configuration.commandQueue.push({
                    function: func,
                    args: arguments
                });
            }
        } else {
            return func;
        }
    }

    function applyDecorator (func) {
        return function (args) {
            return func.apply(null, args);
        };
    }

    function applyDelayDecorator (func) {
        if (presenter.configuration.hasDelay) {
            return function (args) {
                presenter.configuration.commandQueue.push({
                    function: func,
                    args: args
                });
            };
        } else {
            return function (args) {
                return func.apply(null, args);
            };
        }
    }

    function isValidName (name) {
        if (name.trim().match(/^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/) === null)
            return false;
        return true;
    }

    var gridContainerWrapper;
    var gridContainer;

    presenter.initColoredGridArray = function Grid_Addon_initColoredGridArray(rows, columns) {
        for (var rows_index = 0; rows_index < rows; rows_index++) {
            presenter.coloredGrid[rows_index] = [];
            for (var columns_index = 0; columns_index < columns; columns_index++) {
                presenter.coloredGrid[rows_index][columns_index] = "Empty";
            }
        }
    };

    presenter.setColoredGridArray = function Grid_Addon_set_colored_grid_array (array) {
        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        for (var rows_index = 0; rows_index < rows; rows_index++) {
            for (var columns_index = 0; columns_index < columns; columns_index++) {
                if (array[rows_index][columns_index] != "Empty") {
                    presenter.setColor(array[rows_index][columns_index]);
                    presenter.mark(columns_index+1, rows_index+1);
                }
            }
        }
    };

    function initGrid(model) {
        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;

        presenter.initColoredGridArray(rows,columns);
        for(var row = 0; row < rows; row++) {
            for(var column = 0; column < columns; column++) {
                var wrapperElement = $(document.createElement('div'));
                wrapperElement.addClass('cell-element-wrapper');

                var selectableElement = $(document.createElement('div'));
                selectableElement.addClass('cell-element');
                selectableElement.attr('coordinates', (column+1)+"-"+((rows-row)));

                wrapperElement.append(selectableElement);
                gridContainer.append(wrapperElement);
            }
        }

        var gridContainerWrapperDimensions = getElementDimensions(gridContainerWrapper);
        var gridContainerWrapperDistances = calculateInnerDistance(gridContainerWrapperDimensions);

        var wrapperDimensions = getElementDimensions(gridContainerWrapper.find('.cell-element-wrapper:first')[0]);
        var wrapperDistances = calculateInnerDistance(wrapperDimensions);

        var elementDimensions = getElementDimensions(gridContainerWrapper.find('.cell-element:first')[0]);
        var elementDistances = calculateInnerDistance(elementDimensions);

        var wrapperWidth = parseInt((model.Width - gridContainerWrapperDistances.horizontal - (wrapperDistances.horizontal * columns)) / columns, 10);
        var wrapperHeight = parseInt((model.Height - gridContainerWrapperDistances.vertical - (wrapperDistances.vertical * rows)) / rows, 10);

        var elementWidth = wrapperWidth - elementDistances.horizontal;
        var elementHeight = wrapperHeight - elementDistances.vertical;

        var newContainerWrapperHeight = wrapperHeight * rows + wrapperDistances.vertical * rows;
        var newContainerWrapperWidth = wrapperWidth * columns + wrapperDistances.horizontal * columns;

        var verticalGapHeight = model.Height - newContainerWrapperHeight;
        var horizontalGapHeight = model.Width - newContainerWrapperWidth;

        gridContainerWrapper.css('height', model.Height + 'px');
        gridContainerWrapper.css('width', model.Width + 'px');
        gridContainer.css('height', model.Height + 'px');
        gridContainer.css('width', (parseInt(model.Width)+parseInt(elementWidth/2)) + 'px');

        var vertical = verticalGapHeight / rows;
        var horizontal = horizontalGapHeight / columns;

        gridContainer.find(".cell-element-wrapper").each(function() {
            var index = $(this).index();
            var selectedRow = parseInt(index / columns, 10);

            $(this).width(wrapperWidth + horizontal + 2);
            $(this).height(wrapperHeight + vertical + 2);

            var selectableElement = $(this).find('.cell-element:first');

            var lineHeight = selectedRow === rows -1 ? elementHeight + verticalGapHeight : elementHeight;
            selectableElement.css('line-height', lineHeight + "px");
        });
    }

    function getElementDimensions(element) {
        element = $(element);

        return {
            border:{
                top:parseInt(element.css('border-top-width'), 10),
                bottom:parseInt(element.css('border-bottom-width'), 10),
                left:parseInt(element.css('border-left-width'), 10),
                right:parseInt(element.css('border-right-width'), 10)
            },
            margin:{
                top:parseInt(element.css('margin-top'), 10),
                bottom:parseInt(element.css('margin-bottom'), 10),
                left:parseInt(element.css('margin-left'), 10),
                right:parseInt(element.css('margin-right'), 10)
            },
            padding:{
                top:parseInt(element.css('padding-top'), 10),
                bottom:parseInt(element.css('padding-bottom'), 10),
                left:parseInt(element.css('padding-left'), 10),
                right:parseInt(element.css('padding-right'), 10)
            }
        };
    }

    function calculateInnerDistance(elementDimensions) {
        var vertical = elementDimensions.border.top + elementDimensions.border.bottom;
        vertical += elementDimensions.margin.top + elementDimensions.margin.bottom;
        vertical += elementDimensions.padding.top + elementDimensions.padding.top;

        var horizontal = elementDimensions.border.left + elementDimensions.border.right;
        horizontal += elementDimensions.margin.left + elementDimensions.margin.right;
        horizontal += elementDimensions.padding.left + elementDimensions.padding.right;

        return {
            vertical : vertical,
            horizontal : horizontal
        };
    }

    presenter.validateInstructions = function (modelInstructions) {
        var instructions = modelInstructions.split("\n");
        for(var i=0; i < instructions.length; i++) {
            var instruction = instructions[i].split(' ');
            presenter.colorSquare(instruction[0], instruction[1]);
        }
    };

    presenter.colorSquare = function (x, y){
        if (!presenter.configuration.isSavingAnswer) {
            var coordinates = x + "-" + y;
            var element = presenter.$view.find('.cell-element[coordinates="' + coordinates + '"]');

            element.css('background-color', presenter.configuration.color);
            element.attr('colored', 'true');
        }
    };

    presenter.resetMark = function (x, y){
        presenter.actualCursorPosition = [x,y];
        var coordinates = x+"-"+ y;
        var element = presenter.$view.find('.cell-element[coordinates="'+ coordinates +'"]');
        if (ModelValidationUtils.validateIntegerInRange(x, presenter.configuration.columns + 1, 1).isValid != false) {
            if (ModelValidationUtils.validateIntegerInRange(y, presenter.configuration.rows + 1, 1).isValid != false) {
                presenter.coloredGrid[y - 1][x - 1] = "Empty";
            }
        }
        element.css('background-color', '');
        element.attr('colored', 'false');
    };
    
    
    presenter.setPlayerController = function(controller) {
        presenter.playerController = controller;
        presenter.eventBus = controller.getEventBus();
    };

    presenter.run = function(view, model){
        presenterLogic(view, model, false);
        presenter.eventBus.addEventListener('ShowAnswers', this);
        presenter.eventBus.addEventListener('HideAnswers', this);
    };

    presenter.createPreview = function(view, model){
        presenterLogic(view, model, true);
    };

    function returnErrorObject(errorCode) {
        return { isError: true, errorCode: errorCode };
    }

    presenter.generateOriginalCommands = function (withDelay) {
        if (withDelay) {
            presenter.originalCommands = {
                command_clear: delayDecorator(presenter.reset),
                command_mark: delayDecorator(presenter.mark),
                command_drawLeft: delayDecorator(presenter.drawLeft),
                command_drawRight: delayDecorator(presenter.drawRight),
                command_drawUp: delayDecorator(presenter.drawUp),
                command_drawDown: delayDecorator(presenter.drawDown),
                command_drawLeftFrom: delayDecorator(presenter.drawLeft),
                command_drawRightFrom: delayDecorator(presenter.drawRight),
                command_drawUpFrom: delayDecorator(presenter.drawUp),
                command_drawDownFrom: delayDecorator(presenter.drawDown),
                command_setColor: delayDecorator(presenter.setColor),
                command_setCursor: delayDecorator(presenter.setCursor),
                command_clearMark: delayDecorator(presenter.resetMark)
            };
        } else {
            presenter.originalCommands = {
                command_clear: (presenter.reset),
                command_mark: (presenter.mark),
                command_drawLeft: (presenter.drawLeft),
                command_drawRight: (presenter.drawRight),
                command_drawUp: (presenter.drawUp),
                command_drawDown: (presenter.drawDown),
                command_drawLeftFrom: (presenter.drawLeft),
                command_drawRightFrom: (presenter.drawRight),
                command_drawUpFrom: (presenter.drawUp),
                command_drawDownFrom: (presenter.drawDown),
                command_setColor: (presenter.setColor),
                command_setCursor: (presenter.setCursor),
                command_clearMark: (presenter.resetMark)
            };
        }
    };

    presenter.saveAnswer = function Grid_Scene_save_answer(isPreview) {
        if (!isPreview) {
            presenter.configuration.isSavingAnswer = true;
        }

        presenter.generateOriginalCommands(false);
        presenter.executeCode(presenter.configuration.answerCode);
        presenter.generateOriginalCommands(true);
        presenter.configuration.answer = $.extend(true,[], presenter.coloredGrid);

        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        presenter.initColoredGridArray(rows,columns);

        presenter.configuration.isSavingAnswer = false;

    };

    function presenterLogic(view, model, isPreview) {

        presenter.configuration.isPreview = isPreview;

        presenter.view = view;
        presenter.$view = $(view);

        presenter.configuration = $.extend({}, presenter.configuration, presenter.validateModel(model));
        if (presenter.configuration.isError) {
            DOMOperationsUtils.showErrorMessage(view, presenter.ERROR_CODES, presenter.configuration.errorCode);
            return;
        }

        presenter.generateOriginalCommands(true);

        gridContainerWrapper = presenter.$view.find(".grid-scene-wrapper:first");
        gridContainer = gridContainerWrapper.find(".grid-cell:first");

        initGrid(model);
        presenter.setVisibility(presenter.configuration.isVisible);

        presenter.view.addEventListener('DOMNodeRemoved', function onDOMNodeRemoved(ev) {
            if (ev.target === this) {
                presenter.destroy();
            }
        });



        if (!isPreview) {
            presenter.setQueLoopTimer();
        }

        presenter.saveAnswer(isPreview);
    }

    presenter.setQueLoopTimer = function () {
        if(presenter.configuration.hasDelay) {
            presenter.configuration.queLoopTimer = setInterval(presenter.queLoop, presenter.configuration.delay)
        }
    };

    presenter.queLoop = function () {
        if (presenter.configuration.commandQueue.length > 0) {
            var task = presenter.configuration.commandQueue.shift();
            task.function.apply(null, task.args);
        }
    };
    presenter.destroy = function () {
        presenter.view.removeEventListener('DOMNodeRemoved', presenter.destroy);
        clearInterval(presenter.configuration.queLoopTimer);
        presenter.$view = null;
        presenter.view = null;
        presenter.configuration = null;
        presenter.originalCommands = null;
        presenter.commandsArgs = null;
        presenter.coloredGrid = null;
        presenter.actualCursorPosition = null;
        presenter.lastState = null;
    };


    function haveDuplicatedValue(firstDict, secondDict) {
        for (var key in firstDict) {
            for (var comparedKey in secondDict) {
                if (firstDict.hasOwnProperty(key) && secondDict.hasOwnProperty(comparedKey)) {
                    if (key != comparedKey) {
                        if (firstDict[key] == secondDict[comparedKey]) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    presenter.validateModel = function(model) {
        var validatedIsVisible = ModelValidationUtils.validateBoolean(model['Is Visible']);
        var addonID = model['ID'];
        var rows = ModelValidationUtils.validatePositiveInteger(model['Rows']);
        var columns = ModelValidationUtils.validatePositiveInteger(model['Columns']);

        if(!rows.isValid || !columns.isValid){
            return returnErrorObject('GS01');
        }

        var color = model['Color'];
        if(color == ''){
            color = 'black';
        }

        var validatedDelay = presenter.validateDelay(model);
        if (!validatedDelay.isValid) {
            return validatedDelay;
        }
        var validatedDefaultCommands = presenter.validateDefaultCommands(model);
        if (!validatedDefaultCommands.isValid) {
            return validatedDefaultCommands;
        }

        var validatedTranslations = validatedDefaultCommands.value.translations;
        if (haveDuplicatedValue(validatedTranslations, validatedTranslations)) {
            return presenter.getErrorObject("AE01");
        }

        presenter.commandsArgs = $.extend(presenter.commandsArgs, validatedDefaultCommands.value.argumentsTranslation);

        var validatedCustomCommands = presenter.validateCustomCommands(model['custom_commands']);
        if (!validatedCustomCommands.isValid) {
            return validatedCustomCommands;
        }

        var validatedCommandsFromFile = presenter.validateCommandsJSON(model['json_commands']);
        if (!validatedCommandsFromFile.isValid) {
            return validatedCommandsFromFile;
        }

        var mergedCustomCommands = $.merge(validatedCustomCommands.value.commands,
                                 validatedCommandsFromFile.value.commands);

        var customCommandsNames = {};
        for (var i = 0; i < mergedCustomCommands.length; i++) {
            customCommandsNames[i] = mergedCustomCommands[i].name;
        }

        if (haveDuplicatedValue(customCommandsNames, customCommandsNames)) {
            return presenter.getErrorObject("CP07");
        }

        return {
            'isError' : false,
            'isVisible' : validatedIsVisible,
            'visibleByDefault' : validatedIsVisible,
            'addonID' : addonID,
            'rows' : rows.value,
            'columns' : columns.value,
            'color' : color,
            'startPoint': null,
            'hasDelay': validatedDelay.hasDelay,
            'delay': validatedDelay.delay,
            'labels': validatedTranslations,
            'customCommands': mergedCustomCommands,
            'excludedCommands': $.extend({},validatedCustomCommands.value.excludedCommands,
                                    validatedDefaultCommands.value.excludedCommands,
                                    validatedCommandsFromFile.value.excludedCommands),
            'answerCode': model['answer']
        };
    };

    presenter.validateDefaultCommand = function Grid_Scene_validate_default_command (key, command) {
        if (!ModelValidationUtils.isStringEmpty(command['alias'].trim())) {
            if (!isValidName(command['alias'])) {
                return presenter.getErrorObject("DA01");
            }
        }
        return {
            isValid: true,
            value : {
                validatedTranslation: command['alias'],
                validatedIsExcluded: ModelValidationUtils.validateBoolean(command['is_disabled']),
                validatedArgumentsTranslation: command['arguments_aliases']
            }
        };
    };

    presenter.validateDefaultCommands = function Grid_Scene_validate_default_commands (model) {
        var translations = {};
        var excludedCommands = {};
        var argumentsTranslation = {};
        var defaultCommands = model['default_commands'];
        for (var key in defaultCommands) {
            if (defaultCommands.hasOwnProperty(key)) {
                var validatedDefaultCommand = presenter.validateDefaultCommand(key, defaultCommands[key]);
                if (!validatedDefaultCommand.isValid) {
                    return validatedDefaultCommand;
                }
                if (!ModelValidationUtils.isStringEmpty(validatedDefaultCommand.value.validatedTranslation)) {
                    translations[key] = validatedDefaultCommand.value.validatedTranslation;
                }
                if (validatedDefaultCommand.value.validatedIsExcluded) {
                    excludedCommands[key] = true;
                }
                if (!ModelValidationUtils.isStringEmpty(validatedDefaultCommand.value.validatedArgumentsTranslation)){
                    argumentsTranslation[key] = validatedDefaultCommand.value.validatedArgumentsTranslation;
                }
            }
        }

        return {
            isValid: true,
            value: {
                translations: translations,
                excludedCommands: excludedCommands,
                argumentsTranslation: argumentsTranslation
            }
        }
    };

    presenter.validateCustomCommand = function Grid_Scene_validate_command (command) {

        if (!command.hasOwnProperty('command_arguments')) {
            return presenter.getErrorObject("CP01");
        }
        if (!command.hasOwnProperty('is_disabled')) {
            return presenter.getErrorObject("CP02");
        }
        if (!command.hasOwnProperty('command_code')) {
            return presenter.getErrorObject("CP03");
        }
        if (!command.hasOwnProperty('command_name')) {
            return presenter.getErrorObject("CP04");
        }

        if (ModelValidationUtils.isStringEmpty(command['command_name'])) {
            return {
                isValid: true,
                name: null
            };
        }

        if (!isValidName(command['command_name'])) {   //REGEX to check name
            return presenter.getErrorObject("CP05");
        }

        if (!ModelValidationUtils.isStringEmpty(command['command_arguments'].trim())) {
            var argumentsSplited = command['command_arguments'].split(",");
            for (var key in argumentsSplited) {
                if(argumentsSplited.hasOwnProperty(key)) {
                    if(!isValidName(argumentsSplited[key])) { //REGEX to check name
                        return presenter.getErrorObject("CP06");
                    }
                }
            }
        }


        return {
            isValid: true,
            name: command['command_name'],
            arguments: command['command_arguments'],
            code: command['command_code'],
            isExcluded: ModelValidationUtils.validateBoolean(command['is_disabled'])
        };
    };

    presenter.validateCustomCommands = function Grid_Scene_validate_commands (commands) {
        var validatedCommands = [];
        var excludedCommands = {};

        for (var key in commands) {
            if (commands.hasOwnProperty(key)) {
                var validatedCommand = presenter.validateCustomCommand(commands[key]);
                if (!validatedCommand.isValid) {
                    return validatedCommand;
                }

                if (validatedCommand.name != null) {
                    validatedCommands.push(validatedCommand);
                    if (validatedCommand.isExcluded) {
                        excludedCommands[validatedCommand.name] = validatedCommand.isExcluded;
                    }
                }
            }
        }

        return {
            isValid: true,
            value: {
                commands: validatedCommands,
                excludedCommands: excludedCommands
            }
        };
    };

    presenter.validateCommandsJSON = function Grid_Scene_validate_commands_file (commands) {
        if (commands == undefined) {
            return {};
        }

        var trimmedCommands = commands.trim();
        var result;

        if (trimmedCommands == "") {
            result = {};
        } else {
            var data = commands.replace(/\r?\n|\r/g,""); //removing all new lines
            data = data.replace(/\t/g," "); //removing tabulators

            try {
                result = JSON.parse(data);
            } catch (e) {
                return  presenter.getErrorObject("GS03");
            }
        }

        var validatedCustomCommands = presenter.validateCustomCommands(result);
        if (!validatedCustomCommands.isValid) {
            return validatedCustomCommands;
        }

        return {
            isValid: true,
            value: validatedCustomCommands.value
        };
    };



    presenter.validateDelay = function(model) {
        function getDelayObject (isValid, hasDelay, delay) {return {isValid: isValid, hasDelay: hasDelay, delay: delay};}

        if (model["delay"] == undefined) {
            return getDelayObject(true, false);
        }

        var trimmedDelay = model["delay"].trim();
        if (trimmedDelay == "") {
            return getDelayObject(true, false);
        }

        var parsedDelay = Number(trimmedDelay);
        if(isNaN(parsedDelay)) {
            return presenter.getErrorObject("GS02");
        }

        if (parsedDelay > 0) {
            return getDelayObject(true, true, parsedDelay);
        } else {
            return getDelayObject(true, false, parsedDelay);
        }
    };

    presenter.getErrorObject = function (errorCode) {
        return {isValid: false, isError: true, errorCode: errorCode};
    };

    presenter.show = function() {
        presenter.setVisibility(true);
        presenter.configuration.isVisible = true;
    };

    presenter.hide = function() {
        presenter.setVisibility(false);
        presenter.configuration.isVisible = false;
    };

    presenter.setVisibility = function(isVisible) {
        presenter.$view.css("visibility", isVisible ? "visible" : "hidden");
    };

    presenter.getDefaultCommandsToText = function Grid_Scene_get_commands (withParams) {
        var functions = "";
        var labels = presenter.configuration.labels;

        if (withParams === undefined) {
            withParams = false;
        }

        for (var key in presenter.originalCommands) {
            if (presenter.originalCommands.hasOwnProperty(key)) {
                if (!(key in presenter.configuration.excludedCommands)) {
                    var functionText = "";
                    var args = "";

                    if (key in labels) {
                        functionText = labels[key];
                    } else {
                        functionText = presenter.LABELS[key];
                    }

                    if (withParams) {
                        args = "(" + presenter.commandsArgs[key] + ")";
                    }

                    functions += functionText + args + "<br />";
                }
            }
        }
        return functions;
    };

    presenter.getCustomCommandsToText = function Grid_Screne_get_custom_commands (withParams) {
        var commands = "";

        if (withParams === undefined) {
            withParams = false;
        }

        var customCommands = presenter.configuration.customCommands;
        for (var key in customCommands) {
            if (customCommands.hasOwnProperty(key)) {
                if (!(customCommands[key].name in presenter.configuration.excludedCommands)) {
                    var args ="";

                    if (withParams) {
                        args = "(" + customCommands[key].arguments + ")";
                    }

                    commands += customCommands[key].name + args + "<br />";
                }
            }
        }
        return commands;
    };

    presenter.getCommandsToText = function Grid_Screne_get_custom_commands (withParams) {
        if (withParams === undefined) {
            withParams = false;
        }

        return presenter.getDefaultCommandsToText(withParams) + presenter.getCustomCommandsToText(withParams);
    };

    presenter.executeCommand = function(name, params) {
        var commands = {
            'show': presenter.show,
            'hide': presenter.hide,
            'mark' : applyDelayDecorator(presenter.mark),
            'drawLeft': applyDelayDecorator(presenter.drawLeft),
            'drawRight': applyDelayDecorator(presenter.drawRight),
            'drawDown': applyDelayDecorator(presenter.drawDown),
            'drawUp': applyDelayDecorator(presenter.drawUp),
            'drawLeftFrom':applyDelayDecorator(presenter.drawLeft),
            'drawRightFrom': applyDelayDecorator(presenter.drawRight),
            'drawDownFrom': applyDelayDecorator(presenter.drawDown),
            'drawUpFrom': applyDelayDecorator(presenter.drawUp),
            'setCursor': applyDelayDecorator(presenter.setCursor),
            'setColor': applyDelayDecorator(presenter.setColor),
            'clearMark' : applyDelayDecorator(presenter.resetMark),
            'clear': applyDelayDecorator(presenter.reset),
            'reset' : presenter.reset,
            'executeCode': applyDecorator(presenter.executeCode),
            'getDefaultCommands': presenter.getDefaultCommandsToText,
            'getCustomCommands': presenter.getCustomCommandsToText,
            'getCommands': presenter.getCommandsToText,
            'isAllOK': presenter.isAllOK
        };

        Commands.dispatch(commands, name, params, presenter);
    };

    presenter.reset = function(){
        presenter.$view.find('.cell-element').each(function () {
            $(this).removeClass('wrong').removeClass('correct');
            if($(this).attr('colored') == 'true'){
                var coordinates = $(this).attr('coordinates').split('-');
                presenter.resetMark(coordinates[0], coordinates[1]);
            }
        });

        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        presenter.initColoredGridArray(rows,columns);

        presenter.setVisibility(presenter.configuration.visibleByDefault);
        presenter.actualCursorPosition = [1,1];
        presenter.configuration.isErrorMode = false;
        presenter.configuration.isShowingAnswers = false;

    };

    presenter.setCursor = function (x, y) {
        if(!isNaN(parseInt(x)) && !isNaN(parseInt(y))) {
            presenter.actualCursorPosition = [x, y];
        }
    };

    presenter.drawHorizontalLine = function (from, to, y) {
        if (from <= to) {
            for (var i = from; i <= to; i++) {
                presenter.mark(i, y);
            }
        } else {
            for (var i = from; i >= to; i--) {
                presenter.mark(i, y);
            }
        }
    };

    presenter.drawVerticalLine = function (from, to, x) {
        if (from <= to) {
            for (var i = from; i <= to; i++) {
                presenter.mark(x, i);
            }
        } else {
            for (var i = from; i >= to; i--) {
                presenter.mark(x, i);
            }
        }

    };

    presenter.mark = function mark (x, y) {
        presenter.actualCursorPosition = [x,y];
        if (ModelValidationUtils.validateIntegerInRange(x, presenter.configuration.columns + 1, 1).isValid != false) {
            if (ModelValidationUtils.validateIntegerInRange(y, presenter.configuration.rows + 1, 1).isValid != false) {
                presenter.coloredGrid[y - 1][x - 1] = presenter.configuration.color;
            }
        }
        presenter.colorSquare(x, y);
    };

    presenter.drawLeft = function (x, y, numberOfSteps) {
        if (arguments.length == 1) {
            if (parseInt(x) <= 0) return;
            presenter.drawHorizontalLine( presenter.actualCursorPosition[0] - 1, presenter.actualCursorPosition[0] - x, presenter.actualCursorPosition[1]);
        } else {
            if (parseInt(numberOfSteps) <= 0) return;
            presenter.drawHorizontalLine(x, x - numberOfSteps + 1 , y);
        }
    };

    presenter.drawRight = function (x, y, numberOfSteps) {
        if (arguments.length == 1) {
            if (parseInt(x) <= 0) return;
            presenter.drawHorizontalLine(presenter.actualCursorPosition[0] + 1, presenter.actualCursorPosition[0] + x, presenter.actualCursorPosition[1]);
        } else {
            if (parseInt(numberOfSteps) <= 0) return;
            presenter.drawHorizontalLine(x, x + numberOfSteps - 1, y);
        }
    };

    presenter.drawUp = function (x, y, numberOfSteps) {
        if (arguments.length == 1) {
            if (parseInt(x) <= 0) return;
            presenter.drawVerticalLine(presenter.actualCursorPosition[1] + 1, presenter.actualCursorPosition[1] + x, presenter.actualCursorPosition[0]);
        } else {
            if (parseInt(numberOfSteps) <= 0) return;
            presenter.drawVerticalLine(y, y + numberOfSteps - 1, x);
        }
    };

    presenter.drawDown = function (x, y, numberOfSteps) {
        if (arguments.length == 1) {
            if (parseInt(x) <= 0) return;
            presenter.drawVerticalLine(presenter.actualCursorPosition[1] - 1, presenter.actualCursorPosition[1]  - x, presenter.actualCursorPosition[0]);
        } else {
            if (parseInt(numberOfSteps) <= 0) return;
            presenter.drawVerticalLine(y, y - numberOfSteps + 1, x);
        }
    };

    presenter.setColor = function (color) {
        if (color.trim() === '') {
            return;
        }
        presenter.configuration.color = color;
    };

    presenter.generateCommand = function Grid_Scene_generate_command (code, name, args) {
        return eval ("(function() { return function(" + args + "){" + code + "}}())");
    };

    function isExcluded(name, excludedCommands) {
        if ((excludedCommands[name] != null) && (excludedCommands[name])) {
            return true;
        }
        return false;
    }

    presenter.getSceneCommands = function () {
        var commandsLabels = $.extend({}, presenter.LABELS, presenter.configuration.labels);

        var commands = $.extend(true, {}, presenter.originalCommands);
        var excludedCommands = presenter.configuration.excludedCommands;

        for (var key in excludedCommands) {
            if (excludedCommands.hasOwnProperty(key)) {
                if (key in commands) {
                    commands[key] = delayDecorator(presenter.generateCommand("", "empty", ""));
                }
            }
        }

        var result = {};
        for (var key in commands) {
            var label = commandsLabels[key];
            result[label] = commands[key];
        }

        return result;
    };

    presenter.getCustomCommands = function () {
        var customCommands = presenter.configuration.customCommands;
        var excludedCommands = presenter.configuration.excludedCommands;
        var customCommandsString = "";
        for (var index = 0; index < customCommands.length; index++) {
            var customCommand = customCommands[index];
            if (!isExcluded(customCommand['name'], excludedCommands)) {
                customCommandsString += "function " + customCommand['name'] + "(" + customCommand['arguments'] + "){" + customCommand['code'] + "};";
            }
            else {
                customCommandsString += "function " + customCommand['name'] + "(){};";
            }
        }
        return customCommandsString;
    };

    presenter.executeCode = function (code) {
        if (presenter.configuration.isShowingAnswers) return;
        if (presenter.configuration.isErrorMode) return;
        presenter.actualCursorPosition = [1,1];
        with (presenter.getSceneCommands()) {
            var customCommands = presenter.getCustomCommands();
            eval(customCommands);
            try {
                eval(code);
            } catch (e) {
                //console.log(e);
            }

        }
        if (presenter.isAllOK()) {
            sendAllOKEvent();
        }
    };

    presenter.addCustomBlocks = function () {
        window.BlocklyCustomBlocks.SceneGrid.addBlocks(presenter.configuration.labels);
    };
    
    presenter.getToolboxCategoryXML = function () {
        var category = "<category name=\"GridScene\">";
        
        BlocklyCustomBlocks.SceneGrid.CUSTOM_BLOCKS_LIST.forEach(function (element) {
            var block = StringUtils.format("<block type=\"{0}\"></block>", element);
            category = StringUtils.format("{0}{1}", category, block); 
        });
        
        category = StringUtils.format("{0}{1}", category, "</category>");
        
        return category;
    };

    presenter.getState = function Grid_Scene_get_state () {
        return JSON.stringify(presenter.coloredGrid);
    };

    presenter.setState = function Grid_Scene_set_state (state) {
        if (state != null) {
            presenter.setColoredGridArray(JSON.parse(state));
        }
    };

    presenter.getMaxScore = function Grid_Scene_get_max_score () {
        return 1;
    };

    presenter.getScore = function Grid_Scene_get_score () {
        if (presenter.configuration.isErrorMode) {
            return 0;
        }
        if (presenter.configuration.isShowingAnswers) {
            return 0;
        }
        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        var answer = presenter.configuration.answer;
        var actualState = presenter.coloredGrid;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < columns; j++) {
                if (actualState[i][j] != answer[i][j]) {
                    return 0;
                }
            }
        }

        if (!presenter.configuration.isErrorMode) {
            return 1;
        }
        return 0;
    };




    presenter.setWorkMode = function () {
        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        for (var i = 0; i < columns; i++){
            for (var j = 0; j < rows; j++){
                var coordinates = (i + 1) + "-" +(1 + j);
                var element = presenter.$view.find('.cell-element[coordinates="' + coordinates + '"]');
                element.removeClass('wrong').removeClass('correct');
            }
        }
        presenter.configuration.isErrorMode = false;
        presenter.setColoredGridArray(presenter.coloredGrid);
    };

    presenter.setShowErrorsMode = function () {
        if (presenter.configuration.isShowingAnswers) {
            presenter.hideAnswers();
        }
        var rows = presenter.configuration.rows;
        var columns = presenter.configuration.columns;
        var answer = presenter.configuration.answer;
        var actualState = presenter.coloredGrid;

        for (var i = 0; i < columns; i++){
            for (var j = 0; j < rows; j++){
                var coordinates = (i + 1) + "-" +(j + 1);
                var element = presenter.$view.find('.cell-element[coordinates="' + coordinates + '"]');
                element.css('background-color', '');
                if (answer[j][i] == actualState[j][i]) {
                    element.addClass('correct');
                } else {
                    element.addClass('wrong');
                }
            }
        }
        presenter.configuration.isErrorMode = true;
    };

    presenter.showAnswers = function AddonIFrame_Communication_show_answers () {
        if(presenter.configuration.isErrorMode) {
            presenter.setWorkMode();
        }
        presenter.lastState = $.extend(true,[], presenter.coloredGrid);
        presenter.generateOriginalCommands(false);
        presenter.reset();
        presenter.configuration.isShowingAnswers = true;
        presenter.setColoredGridArray(presenter.configuration.answer);
    };

    presenter.hideAnswers = function AddonIFrame_Communication_hide_answers () {
        presenter.configuration.isShowingAnswers = false;
        presenter.reset();
        presenter.coloredGrid = presenter.lastState;
        presenter.lastState = null;
        presenter.setColoredGridArray(presenter.coloredGrid);
        presenter.generateOriginalCommands(true);
    };

    presenter.onEventReceived = function (eventName) {
        if (eventName == "ShowAnswers") {
            presenter.showAnswers();
        } else if (eventName == "HideAnswers") {
            presenter.hideAnswers();
        }
    };

    presenter.isAllOK = function () {
        if (!presenter.configuration.isSavingAnswer) {
            if (!presenter.configuration.isPreview) {
                var rows = presenter.configuration.rows;
                var columns = presenter.configuration.columns;
                var answer = presenter.configuration.answer;
                var actualState = presenter.coloredGrid;
                for (var i = 0; i < rows; i++) {
                    for (var j = 0; j < columns; j++) {
                        if (actualState[i][j] != answer[i][j]) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    };

    function sendAllOKEvent() {
        var eventData = {
            'source': presenter.configuration.addonID,
            'item': 'all',
            'value': '',
            'score': ''
        };
        if (presenter.eventBus != null) {
            presenter.eventBus.sendEvent('ValueChanged', eventData);
        }
    }

    return presenter;
}
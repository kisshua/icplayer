TestCase("[Dice] Build elements", {

    setUp: function () {
        this.presenter = AddonDice_create();

        this.element1 = {
            number: "A1",
            image: "--B1--"
        };

        this.element2 = {
            number: "A2",
            image: null
        };

        this.element3 = {
            number: null,
            image: "--B3--"
        };

        this.element4 = {
            number: null,
            image: null
        };

        this.presenter.configuration.elementsList = [this.element1, this.element2, this.element3, this.element4];
    },


    'test build element with image and text will set both': function () {
        this.presenter.buildElements();

        var correctElement = this.presenter.state.elements[0];

        assertTrue(correctElement.style.backgroundImage.indexOf("--B1--") > -1);
        assertEquals("A1", correctElement.innerText);
    },

    'test elements builder will set only number if image is null': function () {
        this.presenter.buildElements();

        var correctElement = this.presenter.state.elements[1];

        assertEquals("", correctElement.style.backgroundImage);
        assertEquals("A2", correctElement.innerText);
    },


    'test elements builder will set only image if number is null': function () {
        this.presenter.buildElements();

        var correctElement = this.presenter.state.elements[2];

        assertTrue(correctElement.style.backgroundImage.indexOf("--B3--") > -1);
        assertEquals("", correctElement.innerText);
    },

    'test elements builder will put index if number and image are null': function () {
        this.presenter.buildElements();

        var correctElement = this.presenter.state.elements[3];

        assertEquals("", correctElement.style.backgroundImage);
        assertEquals("4", correctElement.innerText);
    }

});
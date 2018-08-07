const ABOUT_ME = '#about-me';

$(document).ready(function () {
    $(window).on('resize', function () {
        if ($(window).height() > $(window).width()) {
            $(ABOUT_ME).css('grid-column', '1 / span 2');
        } else {
            $(ABOUT_ME).css('grid-column','');
        }
    });

});

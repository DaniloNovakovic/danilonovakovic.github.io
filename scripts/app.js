$(document).ready(function() {
    // Mobile nav functionality
    $('#open-nav,#close').click(function() {
        $('#open-nav, #close').toggle();
        $('.custom-navigation #links').toggleClass('visible');
    });
});
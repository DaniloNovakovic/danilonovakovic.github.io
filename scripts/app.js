$(document).ready(function() {
    // Mobile nav functionality
    $('#open-nav,#close').click(function() {
        $('#open-nav, #close').toggle();
        $('.custom-navigation #links').toggleClass('visible');
    });
    $('.custom-navigation #links').click(function() {
       $('.custom-navigation #links').removeClass('visible'); 
        $('#open-nav').toggle(true);
        $('#close').toggle(false);
    });
});
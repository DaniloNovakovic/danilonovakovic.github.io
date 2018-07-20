$(document).ready(function() {
    // Mobile nav functionality
    $('#hamburger,#close').click(function() {
        $('#hamburger, #close').toggle();
        $('.custom-navigation #links').toggleClass('visible');
    });
});
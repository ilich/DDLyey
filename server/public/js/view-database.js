(function ($) {
    $(document).ready(function () {
        
        $('#api-secret').click(function (e) {
            e.preventDefault();
            
            var secret = $(this).data('value');
            $(this).parent().text(secret);    
        });
            
    }); 
})(jQuery);
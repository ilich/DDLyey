(function ($) {
    
    $(document).ready(function () {
        $('#advanced-search').click(function (e) {
            e.preventDefault();
            
            var $link = $(this);
            if ($link.data('expanded') == 1) {
                $('.advanced-search').hide();
                $link.text('Show advanced options');
                $link.data('expanded', 0);
            } else {
                $('.advanced-search').show();
                $link.text('Hide advanced options');
                $link.data('expanded', 1);
            }  
        });
        
        $('#search-button').click(function () {
           $('input[type="text"],select').val(''); 
        });
    })
        
})(jQuery);
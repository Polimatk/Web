feather.replace();
$('#navbtn, .sidebar-bg').click(function() {
    $('.sidebar').toggleClass('show');
    $('.sidebar-bg').toggleClass('show');
});
$('[data-toggle="tooltip"]').tooltip();
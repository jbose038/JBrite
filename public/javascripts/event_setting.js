$(function() {
  $('.need-confirm-btn').click(function() {
    if (confirm('Are you sure to delete?')) {
      return true;
    }
    return false;
  });
});


$(function() {
  $('#sel_payment').on('change', function() {
    if (sel_payment.value == '유료')
      $('#payment').prop({'disabled':false});
    if (sel_payment.value == '무료')
      $('#payment').prop({'disabled':true});
  });
});
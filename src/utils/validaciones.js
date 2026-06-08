function clean_ci(ci) {
  return ci.replace(/\D/g, '');
}

function validation_digit(ci) {
  var a = 0;
  var i = 0;
  if (ci.length <= 6) {
    for (i = ci.length; i < 7; i++) {
      ci = '0' + ci;
    }
  }
  for (i = 0; i < 7; i++) {
    a += (parseInt("2987634"[i]) * parseInt(ci[i])) % 10;
  }
  if (a % 10 === 0) return 0;
  return 10 - a % 10;
}

export function validate_ci(ci) {
  ci = clean_ci(ci);
  if (ci.length < 7 || ci.length > 8) return false;
  var dig = ci[ci.length - 1];
  ci = ci.replace(/[0-9]$/, '');
  return dig == validation_digit(ci);
}

export function validate_mail(mail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
}

export function validate_celular(cel) {
  return /^09\d{7}$/.test(cel.replace(/\s/g, ''));
}
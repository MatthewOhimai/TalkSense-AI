import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexPasswordValidator:
    """
    Validate whether the password meets these rules:
    - Minimum length enforced separately (settings MinimumLengthValidator)
    - Must contain at least one uppercase and one lowercase
    - And must contain at least one digit OR one special character
    """

    def validate(self, password, user=None):
        if not password:
            return
        if not re.search(r"[A-Z]", password):
            raise ValidationError(_('Password must contain at least one uppercase letter.'), code='password_no_upper')
        if not re.search(r"[a-z]", password):
            raise ValidationError(_('Password must contain at least one lowercase letter.'), code='password_no_lower')
        # digit or special
        if not (re.search(r"\d", password) or re.search(r"[^A-Za-z0-9]", password)):
            raise ValidationError(_('Password must contain at least one digit or one special character.'), code='password_no_digit_or_special')

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter, one lowercase letter, "
            "and at least one digit or special character."
        )

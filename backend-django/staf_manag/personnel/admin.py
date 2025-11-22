from django.contrib import admin

from .models import Personnel
from accounts.models import CustomUser, PasswordResetCode, UserPreferences
from conges.models import Conge, DemandeConge, RegleConge

admin.site.register(Personnel)
admin.site.register(CustomUser)
admin.site.register(PasswordResetCode)
admin.site.register(Conge)
admin.site.register(DemandeConge)
admin.site.register(RegleConge)
admin.site.register(UserPreferences)
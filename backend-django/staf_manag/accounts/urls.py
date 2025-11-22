from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import (
    RequestResetCodeView,
    VerifyCodeView,
    ResetPasswordView,
    ChangePasswordView,
    PreferencesView,
    LoginWithOtpView,
    # UpdatePhotoView
)
urlpatterns = [
    # path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/', LoginWithOtpView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('request-reset-code/', RequestResetCodeView.as_view(), name='request-reset-code'),
    path('verify-code/', VerifyCodeView.as_view(), name='verify-code'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
]
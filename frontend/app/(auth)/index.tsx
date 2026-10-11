import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/src/constants/appColors';
import { authStyles } from '@/src/constants/globalStyles';
import { AuthHeader } from '@/src/components/AuthHeader';
import { 
  apiLogin, 
  apiRegister, 
  apiVerifyRegisterOtp, 
  clearAuthAndCache, 
  apiGetDashboard, 
  apiGetSchedule, 
  apiGetNews,
  apiGetGrades,
  apiGetNotifications,
  apiGetMapLocations
} from '@/src/services/api';

export default function AuthScreen() {
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingButtonText, setLoadingButtonText] = useState('Đang chờ...');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  
  // Register State & Steps (1: Fill form, 2: Enter OTP)
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscureRegPassword, setObscureRegPassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  const [emailSentTo, setEmailSentTo] = useState('');

  // 6 individual OTP digit states for registration
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();

  // Handle individual OTP digit change or full paste
  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newValues = [...otpValues];
      newValues[index] = '';
      setOtpValues(newValues);
      return;
    }

    // Nếu người dùng dán (paste) cả chuỗi mã OTP (vd: 734331)
    if (cleaned.length > 1) {
      const newValues = [...otpValues];
      const digits = cleaned.split('').slice(0, 6);
      digits.forEach((d, i) => {
        newValues[i] = d;
      });
      setOtpValues(newValues);
      inputRefs.current[Math.min(digits.length - 1, 5)]?.focus();
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = cleaned;
    setOtpValues(newValues);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Khởi động đếm ngược 60 giây gửi lại OTP
  const startCountdown = useCallback(() => {
    setResendCountdown(60);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Hủy interval khi unmount component
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Xử lý gửi lại mã OTP đăng ký
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);
    try {
      const fullFullName = `${firstName.trim()} ${lastName.trim()}`;
      const fullEmail = `${studentId.trim().toLowerCase()}@sv.ttn.edu.vn`;
      const res = await apiRegister({
        mssv: studentId.trim(),
        password: regPassword,
        fullName: fullFullName,
        email: fullEmail,
      });

      if (res.success) {
        setEmailSentTo(res.email || fullEmail);
        setSuccessMsg(res.message || 'Mã OTP mới đã được gửi đến email!');
        setOtpValues(['', '', '', '', '', '']);
        startCountdown();
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(res.message || 'Không thể gửi lại mã OTP.');
      }
    } catch {
      setError('Lỗi kết nối đến server.');
    } finally {
      setResending(false);
    }
  };

  const handleAuthAction = async () => {
    setError('');
    setSuccessMsg('');

    if (authType === 'login') {
      if (!email || !password) {
        setError('Vui lòng nhập Mã sinh viên (hoặc Email) và Mật khẩu.');
        return;
      }
      setLoading(true);
      setLoadingButtonText('Đang chờ...');
      try {
        const res = await apiLogin(email.trim(), password);
        if (res.success) {
          if (res.user && res.user.role === 'admin') {
            setError('Tài khoản Quản trị viên chỉ sử dụng trên hệ thống Web máy tính.');
            setLoading(false);
            return;
          }

          setLoadingButtonText('Đang chờ...');

          await clearAuthAndCache();
          if (res.token) {
            await AsyncStorage.setItem('@auth_token', res.token);
          }
          if (res.user) {
            const userPayload = {
              ...res.user,
              ho_ten: res.user.fullName || res.user.full_name || res.user.ho_ten || ('Sinh viên ' + res.user.mssv),
              fullName: res.user.fullName || res.user.full_name || res.user.ho_ten || ('Sinh viên ' + res.user.mssv),
            };
            await AsyncStorage.setItem('@auth_user', JSON.stringify(userPayload));
          }

          const targetMssv = res.user?.mssv;

          // Nạp toàn bộ dữ liệu lên app vào bộ nhớ đệm cache trước khi chuyển trang để khi người dùng vào app thì dữ liệu hiển thị ngay lập tức
          await Promise.allSettled([
            apiGetDashboard(),
            apiGetSchedule(targetMssv),
            apiGetNews(),
            apiGetNews('all'),
            apiGetGrades(targetMssv),
            apiGetNotifications(),
            apiGetMapLocations(),
          ]);

          setLoadingButtonText('Đang mở ứng dụng...');
          router.replace('/(main)/home');
        } else {
          setError(res.message || 'Đăng nhập thất bại.');
          setLoading(false);
        }
      } catch {
        setError('Lỗi kết nối đến server.');
        setLoading(false);
      }
    } else {
      if (regStep === 1) {
        if (!firstName || !lastName || !studentId || !regPassword || !confirmPassword) {
          setError('Vui lòng điền đầy đủ thông tin.');
          return;
        }
        if (regPassword !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          return;
        }
        if (regPassword.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }
        const fullFullName = `${firstName.trim()} ${lastName.trim()}`;
        const fullEmail = `${studentId.trim().toLowerCase()}@sv.ttn.edu.vn`;

        setLoading(true);
        try {
          const res = await apiRegister({
            mssv: studentId.trim(),
            password: regPassword,
            fullName: fullFullName,
            email: fullEmail
          });

          if (res.success) {
            setEmailSentTo(res.email || fullEmail);
            setSuccessMsg(res.message || 'Mã OTP đã được gửi đến email.');
            setRegStep(2);
            startCountdown();
          } else {
            setError(res.message || 'Đăng ký thất bại.');
          }
        } catch {
          setError('Lỗi kết nối đến server.');
        } finally {
          setLoading(false);
        }
      } else {
        // RegStep 2: Verify OTP & Save to DB
        const fullOtp = otpValues.join('');
        if (fullOtp.length < 6) {
          setError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
          return;
        }

        setLoading(true);
        try {
          const res = await apiVerifyRegisterOtp(studentId.trim(), fullOtp);
          if (res.success) {
            setSuccessMsg('Đăng ký tài khoản thành công.');
            setTimeout(() => {
              setAuthType('login');
              setRegStep(1);
              setEmail(studentId.trim());
              setPassword('');
              setSuccessMsg('');
            }, 1500);
          } else {
            setError(res.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
          }
        } catch {
          setError('Lỗi kết nối đến server.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };



  return (
    <SafeAreaView style={[authStyles.container, { flex: 1 }]} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }} keyboardShouldPersistTaps="handled">
          <View>
            <AuthHeader 
              currentTab={authType} 
              onTabChange={(tab) => {
                setAuthType(tab);
                setRegStep(1);
                setError('');
                setSuccessMsg('');
              }} 
              isKeyboardVisible={false}
            />

            <View style={authStyles.formContainer}>
              {error ? (
                <View style={localStyles.errorBox}>
                  <Feather name="alert-circle" size={16} color={AppColors.danger} style={{ marginRight: 8 }} />
                  <Text style={localStyles.errorText}>{error}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={localStyles.successBox}>
                  <Feather name="check-circle" size={16} color={AppColors.success} style={{ marginRight: 8 }} />
                  <Text style={localStyles.successText}>{successMsg}</Text>
                </View>
              ) : null}

              {authType === 'login' ? (
                // ================= LOGIN FORM =================
                <>
                  <Text style={authStyles.label}>EMAIL HOẶC MÃ SINH VIÊN</Text>
                  <View style={authStyles.inputBox}>
                    <Feather name="mail" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                    <TextInput
                      style={authStyles.textInput}
                      placeholder="MSSV hoặc Email trường"
                      placeholderTextColor={AppColors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={{ height: 16 }} />

                  <Text style={authStyles.label}>MẬT KHẨU</Text>
                  <View style={authStyles.inputBox}>
                    <Feather name="lock" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                    <TextInput
                      style={authStyles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor={AppColors.textMuted}
                      secureTextEntry={obscurePassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)} style={authStyles.iconSuffix}>
                      <MaterialIcons name={obscurePassword ? 'visibility' : 'visibility-off'} size={19} color={AppColors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={authStyles.forgotPassBtn} onPress={handleForgotPassword} activeOpacity={0.7}>
                    <Text style={authStyles.forgotPassText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </>
              ) : regStep === 1 ? (
                // ================= REGISTER FORM STEP 1 =================
                <>
                  <View style={authStyles.row}>
                    <View style={authStyles.col}>
                      <Text style={authStyles.label}>HỌ VÀ TÊN ĐỆM</Text>
                      <View style={authStyles.inputBox}>
                        <TextInput 
                          style={authStyles.textInput} 
                          placeholder="Nguyễn Văn" 
                          placeholderTextColor={AppColors.textMuted} 
                          value={firstName} 
                          onChangeText={setFirstName} 
                        />
                      </View>
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={authStyles.col}>
                      <Text style={authStyles.label}>TÊN</Text>
                      <View style={authStyles.inputBox}>
                        <TextInput 
                          style={authStyles.textInput} 
                          placeholder="A" 
                          placeholderTextColor={AppColors.textMuted} 
                          value={lastName} 
                          onChangeText={setLastName} 
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ height: 14 }} />

                  <Text style={authStyles.label}>MÃ SỐ SINH VIÊN (MSSV)</Text>
                  <View style={[authStyles.inputBox, { paddingHorizontal: 16 }]}>
                    <TextInput 
                      style={authStyles.textInput} 
                      placeholder="MSSV" 
                      placeholderTextColor={AppColors.textMuted} 
                      value={studentId} 
                      onChangeText={setStudentId} 
                      autoCapitalize="none"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ height: 14 }} />
                  
                  <Text style={authStyles.label}>MẬT KHẨU</Text>
                  <View style={authStyles.inputBox}>
                    <Feather name="lock" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                    <TextInput
                      style={authStyles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor={AppColors.textMuted}
                      secureTextEntry={obscureRegPassword}
                      value={regPassword}
                      onChangeText={setRegPassword}
                    />
                    <TouchableOpacity onPress={() => setObscureRegPassword(!obscureRegPassword)} style={authStyles.iconSuffix}>
                      <MaterialIcons name={obscureRegPassword ? 'visibility' : 'visibility-off'} size={19} color={AppColors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 14 }} />
                  
                  <Text style={authStyles.label}>XÁC NHẬN MẬT KHẨU</Text>
                  <View style={authStyles.inputBox}>
                    <Feather name="lock" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                    <TextInput
                      style={authStyles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor={AppColors.textMuted}
                      secureTextEntry={obscureConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setObscureConfirmPassword(!obscureConfirmPassword)} style={authStyles.iconSuffix}>
                      <MaterialIcons name={obscureConfirmPassword ? 'visibility' : 'visibility-off'} size={19} color={AppColors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // ================= REGISTER FORM STEP 2: OTP VERIFICATION =================
                <>
                  <View style={localStyles.infoCard}>
                    <Feather name="mail" size={24} color={AppColors.primary} style={{ marginBottom: 8 }} />
                    <Text style={localStyles.infoTitle}>Xác thực Email đăng ký</Text>
                    <Text style={localStyles.infoDesc}>
                      Mã OTP 6 chữ số đã được gửi đến email <Text style={{ fontWeight: 'bold', color: AppColors.primary }}>{emailSentTo}</Text>. Nhập mã để hoàn tất đăng ký và lưu tài khoản vào hệ thống.
                    </Text>
                  </View>

                  <View style={{ height: 16 }} />

                  <Text style={authStyles.label}>MÃ OTP 6 CHỮ SỐ</Text>
                  <View style={localStyles.otpContainer}>
                    {otpValues.map((val, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        style={[
                          localStyles.otpBox,
                          val ? localStyles.otpBoxFilled : null
                        ]}
                        value={val}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={6}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <View style={{ height: 16 }} />

                  {/* Nút gửi lại OTP với đếm ngược 60 giây */}
                  <View style={{ alignItems: 'center', marginVertical: 4 }}>
                    {resendCountdown > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.85, paddingVertical: 6 }}>
                        <Feather name="clock" size={14} color={AppColors.textMuted} />
                        <Text style={{ fontSize: 13, color: AppColors.textMuted, fontWeight: '600' }}>
                          Gửi lại mã sau <Text style={{ color: AppColors.primary, fontWeight: '800' }}>{resendCountdown}s</Text>
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={resending}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#EEF2FF', borderRadius: 99 }}
                      >
                        {resending ? (
                          <ActivityIndicator size="small" color={AppColors.primary} />
                        ) : (
                          <Feather name="rotate-cw" size={13} color={AppColors.primary} />
                        )}
                        <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.primary }}>
                          {resending ? 'Đang gửi mã...' : 'Gửi lại mã OTP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={{ height: 12 }} />

                  <TouchableOpacity onPress={() => { setRegStep(1); setError(''); }} activeOpacity={0.7} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="arrow-left" size={13} color={AppColors.accent} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.accent }}>
                      Quay lại
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 20 }} />

              <TouchableOpacity 
                style={[
                  authStyles.primaryButton, 
                  loading && { opacity: 0.85, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }
                ]} 
                onPress={handleAuthAction} 
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={authStyles.primaryBtnText}>
                      {loadingButtonText || 'Đang xử lý...'}
                    </Text>
                  </>
                ) : (
                  <Text style={authStyles.primaryBtnText}>
                    {authType === 'login' 
                      ? 'Đăng Nhập Vào Campus' 
                      : regStep === 1 
                      ? 'Tiếp Tục' 
                      : 'Đăng Ký'}
                  </Text>
                )}
              </TouchableOpacity>

              {authType === 'login' && (
                <>
                  <View style={{ height: 14 }} />
                  <View style={authStyles.dividerRow}>
                    <View style={authStyles.dividerLine} />
                    <Text style={authStyles.dividerText}>hoặc</Text>
                    <View style={authStyles.dividerLine} />
                  </View>

                  <View style={{ height: 14 }} />

                  <TouchableOpacity style={authStyles.guestButton} onPress={async () => {
                    setLoading(true);
                    setLoadingButtonText('Đang đăng nhập như Khách...');
                    await clearAuthAndCache();
                    await AsyncStorage.setItem('@auth_user', JSON.stringify({ mssv: 'guest', fullName: 'Khách' }));
                    await Promise.allSettled([
                      apiGetDashboard(),
                      apiGetNews(),
                      apiGetNotifications(),
                      apiGetMapLocations(),
                    ]);
                    router.replace('/(main)/home');
                  }} activeOpacity={0.8}>
                    <Text style={authStyles.guestBtnText}>
                      Khách (giới hạn chức năng)
                    </Text>
                  </TouchableOpacity>


                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  infoCard: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textForeground,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  otpBox: {
    width: 44,
    height: 50,
    backgroundColor: AppColors.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.textForeground,
  },
  otpBoxFilled: {
    borderColor: AppColors.primary,
    backgroundColor: '#EEF2FF',
  },
});

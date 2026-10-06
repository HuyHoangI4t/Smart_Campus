import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/src/constants/appColors';
import { authStyles } from '@/src/constants/globalStyles';
import { apiForgotPassword, apiVerifyOtp, apiResetPassword } from '@/src/services/api';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState('');
  const [mssv, setMssv] = useState('');
  const [emailSentTo, setEmailSentTo] = useState('');
  
  // 6 individual OTP digit states
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Handle individual OTP digit change
  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError('Vui lòng nhập Mã số sinh viên hoặc Email.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiForgotPassword(identifier.trim());
      if (res.success) {
        setMssv(res.mssv || identifier.trim());
        setEmailSentTo(res.email || `${res.mssv || identifier.trim()}@sv.ttn.edu.vn`);
        setSuccessMsg(res.message || 'Mã OTP đã được gửi đến email. Vui lòng kiểm tra hộp thư (có thể mất 1-3 giây).');
        setStep(2);
      } else {
        setError(res.message || 'Không tìm thấy tài khoản.');
      }
    } catch {
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    setSuccessMsg('');

    const fullOtp = otpValues.join('');
    if (fullOtp.length < 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiVerifyOtp(mssv, fullOtp);
      if (res.success && res.token) {
        setResetToken(res.token);
        setSuccessMsg('Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.');
        setStep(3);
      } else {
        setError(res.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } catch {
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiResetPassword({
        mssv,
        token: resetToken,
        newPassword
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Đặt lại mật khẩu thành công!');
        setStep(4);
      } else {
        setError(res.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch {
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[authStyles.container, { flex: 1 }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'space-between' }} keyboardShouldPersistTaps="handled">
          <View>
            {/* Top Navigation Bar */}
            <View style={localStyles.headerRow}>
              <TouchableOpacity 
                style={localStyles.backButton} 
                onPress={() => {
                  if (step > 1 && step < 4) {
                    setStep((step - 1) as any);
                  } else {
                    router.back();
                  }
                }} 
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={20} color={AppColors.primary} />
              </TouchableOpacity>
              <Text style={localStyles.headerTitle}>Khôi Phục Mật Khẩu</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Step Indicator */}
            <View style={localStyles.stepperRow}>
              <View style={[localStyles.stepDot, step >= 1 && localStyles.stepDotActive]}>
                <Text style={[localStyles.stepText, step >= 1 && localStyles.stepTextActive]}>1</Text>
              </View>
              <View style={[localStyles.stepLine, step >= 2 && localStyles.stepLineActive]} />
              <View style={[localStyles.stepDot, step >= 2 && localStyles.stepDotActive]}>
                <Text style={[localStyles.stepText, step >= 2 && localStyles.stepTextActive]}>2</Text>
              </View>
              <View style={[localStyles.stepLine, step >= 3 && localStyles.stepLineActive]} />
              <View style={[localStyles.stepDot, step >= 3 && localStyles.stepDotActive]}>
                <Text style={[localStyles.stepText, step >= 3 && localStyles.stepTextActive]}>3</Text>
              </View>
            </View>

            {/* Error / Success Banners */}
            {error ? (
              <View style={localStyles.errorBox}>
                <Feather name="alert-circle" size={16} color={AppColors.danger} style={{ marginRight: 8 }} />
                <Text style={localStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {successMsg && step !== 4 ? (
              <View style={localStyles.successBox}>
                <Feather name="check-circle" size={16} color={AppColors.success} style={{ marginRight: 8 }} />
                <Text style={localStyles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: Enter MSSV or Email */}
            {step === 1 && (
              <>
                <View style={localStyles.card}>
                  <View style={localStyles.iconContainer}>
                    <Feather name="mail" size={28} color={AppColors.primary} />
                  </View>
                  <Text style={localStyles.cardTitle}>Xác thực tài khoản</Text>
                  <Text style={localStyles.cardDesc}>
                    Nhập Mã số sinh viên (MSSV) hoặc Email trường cấp. Hệ thống sẽ gửi email chứa mã OTP 6 số (quá trình gửi qua Gmail có thể mất 1-3 giây).
                  </Text>
                </View>

                <View style={{ height: 20 }} />

                <Text style={authStyles.label}>MÃ SỐ SINH VIÊN HOẶC EMAIL</Text>
                <View style={authStyles.inputBox}>
                  <Feather name="user" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="VD: MSSV hoặc mssv@sv.ttn.edu.vn"
                    placeholderTextColor={AppColors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ height: 24 }} />

                <TouchableOpacity 
                  style={[authStyles.primaryButton, loading && { opacity: 0.7 }]} 
                  onPress={handleRequestOtp} 
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryBtnText}>
                    {loading ? 'Đang gửi OTP...' : 'Gửi Mã Xác Thực OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: Enter OTP with 6 compact boxes */}
            {step === 2 && (
              <>
                <View style={localStyles.card}>
                  <View style={localStyles.iconContainer}>
                    <Feather name="shield" size={28} color={AppColors.primary} />
                  </View>
                  <Text style={localStyles.cardTitle}>Nhập mã OTP xác thực</Text>
                  <Text style={localStyles.cardDesc}>
                    Mã xác thực 6 số đã được gửi tới email <Text style={{ fontWeight: 'bold', color: AppColors.primary }}>{emailSentTo}</Text>. Vui lòng kiểm tra hộp thư đến hoặc hộp thư rác (Spam).
                  </Text>
                </View>

                <View style={{ height: 20 }} />

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
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <View style={{ height: 24 }} />

                <TouchableOpacity 
                  style={[authStyles.primaryButton, loading && { opacity: 0.7 }]} 
                  onPress={handleVerifyOtp} 
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryBtnText}>
                    {loading ? 'Đang xác thực...' : 'Xác Thực Mã OTP'}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 24, alignItems: 'center' }}>
                  <TouchableOpacity onPress={handleRequestOtp} disabled={loading} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.accent }}>
                      Gửi lại mã OTP
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <>
                <View style={localStyles.card}>
                  <View style={localStyles.iconContainer}>
                    <Feather name="lock" size={28} color={AppColors.primary} />
                  </View>
                  <Text style={localStyles.cardTitle}>Tạo Mật Khẩu Mới</Text>
                  <Text style={localStyles.cardDesc}>
                    Xác thực OTP thành công! Vui lòng nhập mật khẩu mới cho tài khoản <Text style={{ fontWeight: 'bold', color: AppColors.primary }}>{mssv}</Text>.
                  </Text>
                </View>

                <View style={{ height: 20 }} />

                <Text style={authStyles.label}>MẬT KHẨU MỚI</Text>
                <View style={authStyles.inputBox}>
                  <Feather name="lock" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Ít nhất 6 ký tự"
                    placeholderTextColor={AppColors.textMuted}
                    secureTextEntry={obscurePassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)} style={authStyles.iconSuffix}>
                    <MaterialIcons name={obscurePassword ? 'visibility' : 'visibility-off'} size={19} color={AppColors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 14 }} />

                <Text style={authStyles.label}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                <View style={authStyles.inputBox}>
                  <Feather name="lock" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor={AppColors.textMuted}
                    secureTextEntry={obscurePassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <View style={{ height: 24 }} />

                <TouchableOpacity 
                  style={[authStyles.primaryButton, loading && { opacity: 0.7 }]} 
                  onPress={handleResetPassword} 
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryBtnText}>
                    {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu Mới'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 4: Success Screen */}
            {step === 4 && (
              <View style={[localStyles.card, { paddingVertical: 32 }]}>
                <View style={[localStyles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="check" size={36} color={AppColors.success} />
                </View>
                <Text style={[localStyles.cardTitle, { fontSize: 20, marginTop: 10 }]}>Thành công!</Text>
                <Text style={[localStyles.cardDesc, { marginTop: 6 }]}>
                  {successMsg}
                </Text>

                <View style={{ height: 24 }} />

                <TouchableOpacity 
                  style={authStyles.primaryButton} 
                  onPress={() => router.replace('/(auth)')}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryBtnText}>Đăng Nhập Ngay</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Back to Login */}
          {step !== 4 && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <TouchableOpacity onPress={() => router.replace('/(auth)')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Feather name="arrow-left" size={13} color={AppColors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.primary }}>
                  Quay lại trang Đăng Nhập
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.cardBg,
    borderWidth: 1,
    borderColor: AppColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  stepDotActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textMuted,
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: AppColors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: AppColors.primary,
  },
  card: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textForeground,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  /* Compact 6 Separate OTP Boxes for Small Screens */
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
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
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: AppColors.primary,
    backgroundColor: '#EEF2FF',
  },
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
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '@/src/constants/appColors';
import { authStyles } from '@/src/constants/globalStyles';
import { AuthHeader } from '@/src/components/AuthHeader';
import { apiLogin, apiRegister, apiForgotPassword } from '@/src/services/api';

export default function AuthScreen() {
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  
  // Register State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscureRegPassword, setObscureRegPassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);

  const router = useRouter();

  const handleAuthAction = async () => {
    setError('');
    setSuccessMsg('');

    if (authType === 'login') {
      if (!email || !password) {
        setError('Vui lòng nhập Mã sinh viên (hoặc Email) và Mật khẩu.');
        return;
      }
      const res = await apiLogin(email.trim(), password);
      if (res.success) {
        if (res.token) {
          await AsyncStorage.setItem('@auth_token', res.token);
        }
        if (res.user) {
          await AsyncStorage.setItem('@auth_user', JSON.stringify(res.user));
        }
        setSuccessMsg('Đăng nhập thành công!');
        setTimeout(() => {
          router.replace('/(main)/home');
        }, 500);
      } else {
        setError(res.message || 'Đăng nhập thất bại.');
      }
    } else {
      if (!firstName || !lastName || !studentId || !regPassword || !confirmPassword) {
        setError('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      if (regPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      const fullFullName = `${firstName.trim()} ${lastName.trim()}`;
      const fullEmail = `${studentId.trim().toLowerCase()}@sv.ttn.edu.vn`;

      const res = await apiRegister({
        mssv: studentId.trim(),
        password: regPassword,
        fullName: fullFullName,
        email: fullEmail
      });

      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        setTimeout(() => {
          setAuthType('login');
          setEmail(studentId.trim());
          setSuccessMsg('');
        }, 1500);
      } else {
        setError(res.message || 'Đăng ký thất bại.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Quên mật khẩu', 'Vui lòng nhập Mã số sinh viên (hoặc Email) vào ô đăng nhập ở trên trước khi bấm Quên mật khẩu.');
      return;
    }

    Alert.alert(
      'Xác nhận quên mật khẩu',
      `Bạn có muốn đặt lại mật khẩu cho tài khoản ${email} thành mật khẩu mặc định (123456) không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            const res = await apiForgotPassword(email.trim());
            if (res.success) {
              Alert.alert('Thành công', res.message);
            } else {
              Alert.alert('Lỗi', res.message || 'Không thể đặt lại mật khẩu.');
            }
          }
        }
      ]
    );
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
              onTabChange={setAuthType} 
              isKeyboardVisible={false}
            />

            <View style={authStyles.formContainer}>
              {error ? (
                <Text style={{ color: 'red', marginBottom: 12, textAlign: 'center', fontWeight: 'bold' }}>
                  {error}
                </Text>
              ) : null}

              {successMsg ? (
                <Text style={{ color: 'green', marginBottom: 12, textAlign: 'center', fontWeight: 'bold' }}>
                  {successMsg}
                </Text>
              ) : null}

              {authType === 'login' ? (
                // ================= LOGIN FORM =================
                <>
                  <Text style={authStyles.label}>EMAIL HOẶC MÃ SINH VIÊN</Text>
                  <View style={authStyles.inputBox}>
                    <Feather name="mail" size={19} color={AppColors.textMuted} style={authStyles.iconPrefix} />
                    <TextInput
                      style={authStyles.textInput}
                      placeholder="mssv hoặc mssv@sv.ttn.edu.vn"
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
              ) : (
                // ================= REGISTER FORM =================
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
                      placeholder="mssv" 
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
              )}

              <View style={{ height: 20 }} />

              <TouchableOpacity style={authStyles.primaryButton} onPress={handleAuthAction} activeOpacity={0.85}>
                <Text style={authStyles.primaryBtnText}>
                  {authType === 'login' ? 'Đăng Nhập Vào Campus' : 'Tạo Tài Khoản Mới'}
                </Text>
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

                  <TouchableOpacity style={authStyles.guestButton} onPress={() => router.replace('/(main)/home')} activeOpacity={0.8}>
                    <Text style={authStyles.guestBtnText}>
                      Khách (Giới hạn tính năng)
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

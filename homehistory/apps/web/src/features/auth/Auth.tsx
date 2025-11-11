import Window from '@/libs/lib-window/Window';
import { useState } from 'react';
import EmailEntry from './components/EmailEntry';
// import ProfessionalSignup from './components/ProfessionalSignup';
import RegisterPage from './components/register';
import Login from './components/Login';
import { LoginFormData, RegisterFormData } from '@/interfaces/authInterface';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';

enum AuthStep {
  Login = 'LOGIN',
  Signup = 'SIGNUP',
  CreateProfissionalAccount = 'CREATEPROFISSIONALACCOUNT',
  ForgotPassword = 'FORGOT_PASSWORD',
}

enum LoginStep {
  Email = 'EMAIL',
  Password = 'PASSWORD',
}

interface AuthProps {
  isVisible: boolean;
  emitVisibility: () => void;
}

const Auth = ({ isVisible, emitVisibility }: AuthProps) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.Login);
  const [loginStep, setLoginStep] = useState<LoginStep>(LoginStep.Email);
  const { addNotification } = useUIStore();
  const { login, register } = useAuthStore();

  const navigate = useNavigate();

  const shouldShowBackIcon = step === AuthStep.Signup || loginStep === LoginStep.Password;

  const handleBackNavigation = () => {
    if (step === AuthStep.Signup) {
      setStep(AuthStep.Login);
      setLoginStep(LoginStep.Email);
    } else if (loginStep === LoginStep.Password) {
      setLoginStep(LoginStep.Email);
    }
  };

  const handleStepChange = (newStep: AuthStep) => {
    setStep(newStep);
    if (newStep !== AuthStep.Login) {
      setLoginStep(LoginStep.Email);
    }
  };

  const handleLogin = async (formData: LoginFormData) => {
    try {
      const success = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (success) {
        addNotification({
          type: 'success',
          title: 'Welcome back!',
          message: "You've been successfully signed in.",
        });
        // navigate(redirectTo, { replace: true });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Sign in failed',
        message: error.message || 'Invalid email or password. Please try again.',
      });
    }
  };

  const handleSignUp = async (data: Partial<RegisterFormData>) => {
    try {
      const success = await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: 'buyer',
        subscribeNewsletter: true,
      });

      if (success) {
        addNotification({
          type: 'success',
          title: 'Account created!',
          message: 'Welcome to HomeHistory. You can now start exploring properties.',
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Registration failed',
        message: error.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const renderView = () => {
    switch (step) {
      case AuthStep.Login:
        return (
          <Login
            currentStep={loginStep}
            onStepChange={setLoginStep}
            emitSignUp={() => handleStepChange(AuthStep.Signup)}
            emitCreateProfissionalAccount={() =>
              handleStepChange(AuthStep.CreateProfissionalAccount)
            }
            emitLogin={handleLogin}
          />
        );

      case AuthStep.Signup:
        return (
          <RegisterPage onBack={() => handleStepChange(AuthStep.Login)} emitSignUp={handleSignUp} />
        );

      case AuthStep.CreateProfissionalAccount:
        navigate('/signup/professional');
        return;
      case AuthStep.ForgotPassword:
        return <></>;
      default:
        return <EmailEntry />;
    }
  };

  return (
    <Window
      title={step === AuthStep.Login ? 'Log in or Sign up' : 'Sign up'}
      visible={isVisible}
      onClose={emitVisibility}
      size="normal"
      hasBackIcon={shouldShowBackIcon}
      onBack={handleBackNavigation}
    >
      {renderView()}
    </Window>
  );
};

export default Auth;

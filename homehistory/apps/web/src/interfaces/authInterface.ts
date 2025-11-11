export type ProfessionalType = 'AGENT' | 'LANDLORD' | 'LENDER' | 'CONTRACTOR';

export interface RegisterFormData {
  professionalType: ProfessionalType | '';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type OnboardingPhase =
  | 'entrada'
  | 'login'
  | 'dados_pessoais'
  | 'dados_pet'
  | 'plano'
  | 'cadastro'
  | 'revisao';

export interface OnboardingStepConfig {
  stepNumber: number;
  routeName: string;
  label: string;
  phase: OnboardingPhase;
  flow: 'new' | 'existing' | 'shared';
  keyEvents?: string[];
  skipped?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  { stepNumber: 1, routeName: 'account', label: 'Criar Conta', phase: 'entrada', flow: 'shared' },
  { stepNumber: 2, routeName: 'email', label: 'E-mail (Login)', phase: 'login', flow: 'existing' },
  { stepNumber: 3, routeName: 'verify', label: 'Verificar OTP', phase: 'login', flow: 'existing' },
  { stepNumber: 4, routeName: 'continue', label: 'Continuar', phase: 'login', flow: 'existing' },
  { stepNumber: 5, routeName: 'customer', label: 'Dados Pessoais', phase: 'dados_pessoais', flow: 'new' },
  { stepNumber: 6, routeName: 'pet-name', label: 'Nome do Pet', phase: 'dados_pet', flow: 'shared' },
  { stepNumber: 7, routeName: 'pet-family', label: 'Espécie do Pet', phase: 'dados_pet', flow: 'shared' },
  { stepNumber: 8, routeName: 'address', label: 'Endereço', phase: 'dados_pessoais', flow: 'new' },
  { stepNumber: 9, routeName: 'pet-details', label: 'Detalhes do Pet', phase: 'dados_pet', flow: 'shared' },
  { stepNumber: 10, routeName: 'pet-breed', label: 'Raça do Pet', phase: 'dados_pet', flow: 'shared' },
  { stepNumber: 11, routeName: 'pet-together-since', label: 'Tempo Juntos', phase: 'dados_pet', flow: 'shared', skipped: true },
  { stepNumber: 12, routeName: 'diseases', label: 'Doenças', phase: 'dados_pet', flow: 'shared', skipped: true },
  { stepNumber: 13, routeName: 'coverage', label: 'Plano', phase: 'plano', flow: 'shared', keyEvents: ['add_to_cart'] },
  { stepNumber: 14, routeName: 'additional-coverage-vaccine', label: 'Adic. Vacina', phase: 'plano', flow: 'shared' },
  { stepNumber: 15, routeName: 'additional-coverage-checkup', label: 'Adic. Checkup', phase: 'plano', flow: 'shared' },
  { stepNumber: 16, routeName: 'additional-coverage-dental', label: 'Adic. Dental', phase: 'plano', flow: 'shared' },
  { stepNumber: 17, routeName: 'register', label: 'Cadastro', phase: 'cadastro', flow: 'new' },
  { stepNumber: 18, routeName: 'confirm', label: 'Confirmar Identidade', phase: 'cadastro', flow: 'new', keyEvents: ['sign_up'] },
  { stepNumber: 19, routeName: 'pet-summary', label: 'Resumo do Pet', phase: 'revisao', flow: 'shared' },
  { stepNumber: 20, routeName: 'summary', label: 'Checkout', phase: 'revisao', flow: 'shared', keyEvents: ['begin_checkout', 'add_payment_info'] },
];

export const PHASE_DISPLAY: Record<OnboardingPhase, { label: string; color: string }> = {
  entrada: { label: 'ENTRADA', color: 'var(--accent)' },
  login: { label: 'LOGIN (CONTA EXISTENTE)', color: 'var(--blue)' },
  dados_pessoais: { label: 'DADOS PESSOAIS', color: 'var(--purple)' },
  dados_pet: { label: 'DADOS DO PET', color: 'var(--teal)' },
  plano: { label: 'PLANO & COBERTURAS', color: 'var(--amber)' },
  cadastro: { label: 'CADASTRO', color: 'var(--orange)' },
  revisao: { label: 'REVISÃO & CHECKOUT', color: 'var(--accent)' },
};

const stepMap = new Map(ONBOARDING_STEPS.map((s) => [s.stepNumber, s]));

export function getStepConfig(stepNumber: number): OnboardingStepConfig | undefined {
  return stepMap.get(stepNumber);
}

export function getStepLabel(stepNumber: number, fallback?: string): string {
  return stepMap.get(stepNumber)?.label ?? fallback ?? `Step ${stepNumber}`;
}

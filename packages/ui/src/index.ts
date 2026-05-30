/**
 * @radar/ui
 *
 * Design system reutilizável do RadarAuto (Regra 21).
 * Cores, fontes e tokens vêm de styles.css (CSS vars).
 *
 * Componentes nascem aqui pra reuso. Rule of Three (Regra 13):
 * extraídos do protótipo validado quando aparecem em 3+ telas.
 */
export { Avatar } from "./components/Avatar";
export type { AvatarProps } from "./components/Avatar";

export { Badge } from "./components/Badge";
export type { BadgeProps, BadgeTone } from "./components/Badge";

export { BrandLogo, BrandMark } from "./components/Brand";
export type { BrandLogoProps, BrandMarkProps } from "./components/Brand";

export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";

export { Card } from "./components/Card";
export type { CardProps } from "./components/Card";

export { ChoiceCard } from "./components/ChoiceCard";
export type { ChoiceCardProps } from "./components/ChoiceCard";

export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";

export { FormField, Input } from "./components/Input";
export type { FormFieldProps, InputProps } from "./components/Input";

export { Sidebar } from "./components/Sidebar";
export type { SidebarItem, SidebarProps, SidebarUser } from "./components/Sidebar";

export { SuccessModal } from "./components/SuccessModal";
export type { SuccessModalProps } from "./components/SuccessModal";

export { Toggle } from "./components/Toggle";
export type { ToggleProps } from "./components/Toggle";

export { Topbar } from "./components/Topbar";
export type { TopbarProps, TopbarUser } from "./components/Topbar";

export { WizardStepper } from "./components/WizardStepper";
export type { WizardStepperProps } from "./components/WizardStepper";

export { WizardTrack } from "./components/WizardTrack";
export type { WizardTrackProps } from "./components/WizardTrack";
export { Skeleton, SkeletonText } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton";
export { PasswordInput } from "./components/PasswordInput";
export type { PasswordInputProps } from "./components/PasswordInput";
export { WhatsAppIcon } from "./components/icons/WhatsAppIcon";
export type { WhatsAppIconProps } from "./components/icons/WhatsAppIcon";
export { useWizard } from "./components/useWizard";
export type { WizardApi, WizardDirection, UseWizardOptions } from "./components/useWizard";
export { WizardShell } from "./components/WizardShell";
export type { WizardShellProps } from "./components/WizardShell";

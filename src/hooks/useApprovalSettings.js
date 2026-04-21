import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';

export const APPROVAL_SETTINGS_QUERY_KEY = ['approval-settings'];

const DEFAULTS = {
  require_absence_approval: true,
  require_print_approval: true,
  require_onboarding_approval: true,
};

export function useApprovalSettings() {
  const { data } = useQuery({
    queryKey: APPROVAL_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const list = await base44.entities.InstitutionSettings.filter({ type: 'approval_settings' });
      return list[0] ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    record: data ?? null,
    require_absence_approval:   data?.require_absence_approval   ?? DEFAULTS.require_absence_approval,
    require_print_approval:     data?.require_print_approval     ?? DEFAULTS.require_print_approval,
    require_onboarding_approval: data?.require_onboarding_approval ?? DEFAULTS.require_onboarding_approval,
  };
}

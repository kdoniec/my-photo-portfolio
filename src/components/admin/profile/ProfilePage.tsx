import type { ProfileDTO, SettingsDTO, StatsDTO } from "@/types";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import { ProfileManager } from "./ProfileManager";

interface ProfilePageProps {
  profile: ProfileDTO;
  settings: SettingsDTO;
  stats: StatsDTO;
}

export function ProfilePage({ profile, settings, stats }: ProfilePageProps) {
  return (
    <StatsProvider initialStats={stats}>
      <ProfileManager profile={profile} settings={settings} stats={stats} />
    </StatsProvider>
  );
}

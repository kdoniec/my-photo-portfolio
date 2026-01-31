import { useState } from "react";
import type { ProfileDTO, SettingsDTO, StatsDTO } from "@/types";
import { ProfileForm } from "./ProfileForm";
import { SeoSettingsForm } from "./SeoSettingsForm";
import { StatsCard } from "./StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileManagerProps {
  profile: ProfileDTO;
  settings: SettingsDTO;
  stats: StatsDTO;
}

export function ProfileManager({ profile: initialProfile, settings: initialSettings, stats }: ProfileManagerProps) {
  const [profile, setProfile] = useState<ProfileDTO>(initialProfile);
  const [settings, setSettings] = useState<SettingsDTO>(initialSettings);

  const handleProfileSuccess = async () => {
    // Refresh profile data
    const response = await fetch("/api/profile");
    if (response.ok) {
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    }
  };

  const handleSettingsSuccess = async () => {
    // Refresh settings data
    const response = await fetch("/api/settings");
    if (response.ok) {
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="seo">Ustawienia SEO</TabsTrigger>
        <TabsTrigger value="stats">Statystyki</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Dane profilu</CardTitle>
            <CardDescription>Zarządzaj swoimi informacjami kontaktowymi widocznymi publicznie</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} onSuccess={handleProfileSuccess} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card>
          <CardHeader>
            <CardTitle>Ustawienia SEO</CardTitle>
            <CardDescription>Dostosuj tytuł i opis strony dla wyszukiwarek internetowych</CardDescription>
          </CardHeader>
          <CardContent>
            <SeoSettingsForm settings={settings} onSuccess={handleSettingsSuccess} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats">
        <Card>
          <CardHeader>
            <CardTitle>Statystyki</CardTitle>
            <CardDescription>Przegląd wykorzystania zasobów Twojej strony</CardDescription>
          </CardHeader>
          <CardContent>
            <StatsCard stats={stats} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
